import { Request, Response } from 'express';
import Config from '../models/Config.model';
import sequelize from '../config/database';

/**
 * Normaliza configValue para string (formato aceito pelo banco)
 * @param value - Valor a ser normalizado
 * @returns string
 */
const normalizeConfigValue = (value: any): string => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    return JSON.stringify(value);
  }
  if (value === null || value === undefined) return '';
  return String(value);
};

/**
 * Helper para pegar apenas campos específicos de um objeto
 */
function pick<T extends object>(obj: any, fields: (keyof T)[]): Partial<T> {
  const out: any = {};
  for (const k of fields) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}

/**
 * Cria uma nova configuração
 * @route POST /config/create
 */
export const createConfig = async (req: Request, res: Response): Promise<Response> => {
  const t = await sequelize.transaction();
  let committed = false;

  try {
    const { configKey, configValue, description, active } = req.body;

    // Validação
    if (!configKey || typeof configKey !== 'string') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'configKey é obrigatório e deve ser uma string.'
      });
    }

    const key = configKey.trim();

    // Verifica se já existe
    const existingConfig = await Config.findOne({
      where: { configKey: key },
      transaction: t
    });

    if (existingConfig) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: 'Configuração já existe. Use PUT /update para atualizar.'
      });
    }

    // Cria nova configuração
    const newConfig = await Config.create(
      {
        configKey: key,
        configValue: normalizeConfigValue(configValue),
        description: description || null,
        active: active !== undefined ? active : true
      },
      { transaction: t }
    );

    await t.commit();
    committed = true;

    return res.status(201).json({
      success: true,
      message: 'Configuração criada com sucesso',
      data: newConfig
    });

  } catch (error: any) {
    if (!committed) {
      try {
        await t.rollback();
      } catch (rollbackError) {
        console.error('Erro ao fazer rollback:', rollbackError);
      }
    }
    console.error('Erro ao criar configuração:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar configuração',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Busca uma ou todas as configurações
 * @route GET /config/read
 * @query configKey (opcional) - Busca configuração específica
 * @query page (opcional) - Número da página (default: 1)
 * @query pageSize (opcional) - Tamanho da página (default: 10)
 */
export const getConfig = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { configKey } = req.query;
    const { page = 1, pageSize = 10 } = req.query;

    // Busca configuração específica
    if (configKey && typeof configKey === 'string') {
      const config = await Config.findOne({
        where: { configKey: configKey.trim() }
      });

      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'Configuração não encontrada'
        });
      }

      return res.status(200).json({
        success: true,
        data: config
      });
    }

    // Busca todas com paginação
    const limit = parseInt(pageSize as string, 10);
    const offset = (parseInt(page as string, 10) - 1) * limit;

    const { rows: configs, count: totalRecords } = await Config.findAndCountAll({
      limit,
      offset,
      order: [['configKey', 'ASC']]
    });

    if (configs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nenhuma configuração encontrada'
      });
    }

    return res.status(200).json({
      success: true,
      data: configs,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: parseInt(page as string, 10),
        pageSize: limit
      }
    });

  } catch (error: any) {
    console.error('Erro ao buscar configuração:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar configuração',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Atualiza uma configuração existente
 * @route POST /config/update
 */
export const updateConfig = async (req: Request, res: Response): Promise<Response> => {
  const t = await sequelize.transaction();
  let committed = false;

  try {
    const { configKey, configValue, description, active } = req.body;

    // Validação
    if (!configKey || typeof configKey !== 'string') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'configKey é obrigatório e deve ser uma string.'
      });
    }

    const key = configKey.trim();

    // Busca configuração existente
    const config = await Config.findOne({
      where: { configKey: key },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!config) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Configuração não encontrada'
      });
    }

    // Atualiza apenas campos fornecidos
    if (configValue !== undefined) {
      config.configValue = normalizeConfigValue(configValue);
    }
    if (description !== undefined) {
      config.description = description;
    }
    if (active !== undefined) {
      config.active = active;
    }

    await config.save({ transaction: t });
    await t.commit();
    committed = true;

    return res.status(200).json({
      success: true,
      message: 'Configuração atualizada com sucesso',
      data: config
    });

  } catch (error: any) {
    if (!committed) {
      try {
        await t.rollback();
      } catch (rollbackError) {
        console.error('Erro ao fazer rollback:', rollbackError);
      }
    }
    console.error('Erro ao atualizar configuração:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configuração',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Deleta uma configuração
 * @route GET /config/delete
 * @query configKey - Chave da configuração a ser deletada
 */
export const deleteConfig = async (req: Request, res: Response): Promise<Response> => {
  const t = await sequelize.transaction();
  let committed = false;

  try {
    const { configKey } = req.query;

    // Validação
    if (!configKey || typeof configKey !== 'string') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'configKey é obrigatório e deve ser uma string.'
      });
    }

    const key = configKey.trim();

    // Busca configuração
    const config = await Config.findOne({
      where: { configKey: key },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!config) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Configuração não encontrada'
      });
    }

    // Deleta configuração
    await config.destroy({ transaction: t });
    await t.commit();
    committed = true;

    return res.status(200).json({
      success: true,
      message: 'Configuração excluída com sucesso'
    });

  } catch (error: any) {
    if (!committed) {
      try {
        await t.rollback();
      } catch (rollbackError) {
        console.error('Erro ao fazer rollback:', rollbackError);
      }
    }
    console.error('Erro ao excluir configuração:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao excluir configuração',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Cria ou atualiza uma configuração (upsert)
 * @route POST /config/upsertConfig
 */
export const upsertConfig = async (req: Request, res: Response): Promise<Response> => {
  const t = await sequelize.transaction();
  let committed = false;

  try {
    const { configKey } = req.body as { configKey?: string };

    // Validação
    if (!configKey || typeof configKey !== 'string') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'configKey é obrigatório e deve ser uma string.'
      });
    }

    const key = configKey.trim();

    // Extrai apenas os campos permitidos
    const payload = pick<typeof req.body>(req.body, ['configValue', 'description', 'active']);

    // Normaliza configValue
    if (payload.configValue !== undefined) {
      payload.configValue = normalizeConfigValue(payload.configValue);
    }

    // Busca existente com lock
    const existing = await Config.findOne({
      where: { configKey: key },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (existing) {
      // Atualiza
      await existing.update(payload, { transaction: t });
      await t.commit();
      committed = true;

      return res.status(200).json({
        success: true,
        action: 'updated',
        message: 'Configuração atualizada com sucesso',
        data: existing
      });
    }

    // Cria nova
    const created = await Config.create(
      { configKey: key, ...payload },
      { transaction: t }
    );

    await t.commit();
    committed = true;

    return res.status(201).json({
      success: true,
      action: 'created',
      message: 'Configuração criada com sucesso',
      data: created
    });

  } catch (err: any) {
    if (!committed) {
      try {
        await t.rollback();
      } catch (rollbackError) {
        console.error('Erro ao fazer rollback:', rollbackError);
      }
    }
    console.error('Erro no upsert de config:', err);
    return res.status(500).json({
      success: false,
      message: err?.message ?? 'Erro ao salvar configuração',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};