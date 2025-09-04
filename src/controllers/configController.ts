import { Request, Response } from 'express';
import Config from '../models/Config.model';
import sequelize from '../config/database';

// Função para criar configuração
export const createConfig = async (req: Request, res: Response): Promise<Response> => {
    const { configKey, configValue, description } = req.body; // Recupera os parâmetros da requisição

    try {
        const existingConfig = await Config.findOne({ where: { configKey } });

        if (existingConfig) {
            return res.status(400).json({ success: false, message: 'Configuração já existe' });
        }

        await Config.create({ configKey, configValue, description });

        return res.status(201).json({ success: true, message: 'Configuração criada com sucesso' });
    } catch (error) {
        console.error('Erro ao criar configuração:', error);
        return res.status(500).json({ success: false, message: 'Erro ao criar configuração' });
    }
};

// Função para atualizar configuração
export const updateConfig = async (req: Request, res: Response): Promise<Response> => {
    const { configKey, configValue } = req.body; // Recupera os parâmetros da requisição

    try {
        const config = await Config.findOne({ where: { configKey } });

        if (!config) {
            return res.status(404).json({ success: false, message: 'Configuração não encontrada' });
        }

        config.configValue = configValue;
        await config.save();

        return res.status(200).json({ success: true, message: 'Configuração atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar configuração:', error);
        return res.status(500).json({ success: false, message: 'Erro ao atualizar configuração' });
    }
};

export const getConfig = async (req: Request, res: Response): Promise<Response> => {
    const { configKey } = req.params; // Recupera o parâmetro da requisição (configKey)
    const { page = 1, pageSize = 10 } = req.query; // Paginação com valores padrão

    try {
        if (configKey) {
            // Caso tenha um configKey, buscamos apenas essa configuração específica
            const config = await Config.findOne({ where: { configKey } });

            if (!config) {
                return res.status(404).json({ success: false, message: 'Configuração não encontrada' });
            }

            return res.status(200).json({ success: true, data: config.configValue });
        } else {
            // Caso não tenha o configKey, buscamos todas as configurações com paginação
            const limit = parseInt(pageSize as string, 10); // Número de registros por página
            const offset = (parseInt(page as string, 10) - 1) * limit; // Deslocamento para a página correta

            const { rows: configs, count: totalRecords } = await Config.findAndCountAll({
                limit,
                offset,
            });

            if (configs.length === 0) {
                return res.status(404).json({ success: false, message: 'Nenhuma configuração encontrada' });
            }

            return res.status(200).json({
                success: true,
                data: configs,
                pagination: {
                    totalRecords,
                    totalPages: Math.ceil(totalRecords / limit),
                    currentPage: parseInt(page as string, 10),
                    pageSize: limit,
                },
            });
        }
    } catch (error) {
        console.error('Erro ao buscar configuração:', error);
        return res.status(500).json({ success: false, message: 'Erro ao buscar configuração' });
    }
};


export const deleteConfig = async (req: Request, res: Response): Promise<Response> => {
    const { configKey } = req.params; // Recupera o parâmetro da URL (configKey)

    try {
        // Buscar configuração com o configKey fornecido
        const config = await Config.findOne({ where: { configKey } });

        if (!config) {
            return res.status(404).json({ success: false, message: 'Configuração não encontrada' });
        }

        // Excluir a configuração
        await config.destroy();

        return res.status(200).json({ success: true, message: 'Configuração excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir configuração:', error);
        return res.status(500).json({ success: false, message: 'Erro ao excluir configuração' });
    }
};

function pick<T extends object>(obj: any, fields: (keyof T)[]): Partial<T> {
  const out: any = {};
  for (const k of fields) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

export const upsertConfig = async (req: Request, res: Response): Promise<Response> => {
  const t = await sequelize.transaction();
  try {
    const { configKey } = req.body as { configKey?: string };
    if (!configKey || typeof configKey !== 'string') {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'configKey é obrigatório.' });
    }

    // normalize opcional (ex.: sempre minúsculo e trim)
    const key = configKey.trim();

    // Só permita atualizar/crear esses campos:
    const payload = pick<typeof req.body>(req.body, ['configValue', 'description', 'active']);

    // Busca existente sob lock p/ evitar corrida
    const existing = await Config.findOne({
      where: { configKey: key },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (existing) {
      await existing.update(payload, { transaction: t });
      await t.commit();
      return res.status(200).json({
        success: true,
        action: 'updated',
        data: existing,
      });
    }

    const created = await Config.create(
      { configKey: key, ...payload },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json({
      success: true,
      action: 'created',
      data: created,
    });
  } catch (err: any) {
    await t.rollback();
    // erro de chave única duplicada etc.
    console.error('Erro no upsert de config:', err);
    return res.status(500).json({ success: false, message: err?.message ?? 'Erro no upsert de config.' });
  }
};