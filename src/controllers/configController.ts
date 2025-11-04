// ✅ VERSÃO FINAL CORRIGIDA - upsertConfig
// Arquivo: src/controllers/configController.ts

import { Request, Response } from 'express';
import Config from '../models/Config.model';
import sequelize from '../config/database';

/**
 * Normaliza configValue para string (formato aceito pelo banco)
 * @param value - Valor a ser normalizado
 * @returns string
 */
const normalizeConfigValue = (value: any): string => {
  // Se já é string, retorna diretamente
  if (typeof value === 'string') {
    return value;
  }
  
  // Se é array ou objeto, converte para JSON string
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    return JSON.stringify(value);
  }
  
  // Se é null ou undefined, retorna string vazia
  if (value === null || value === undefined) {
    return '';
  }
  
  // Outros tipos (number, boolean), converte para string
  return String(value);
};

/**
 * Helper para pegar apenas campos específicos de um objeto
 */
function pick<T extends object>(obj: any, fields: (keyof T)[]): Partial<T> {
  const out: any = {};
  for (const k of fields) {
    if (obj[k] !== undefined) {
      out[k] = obj[k];
    }
  }
  return out;
}

/**
 * Cria ou atualiza uma configuração (upsert)
 * @route POST /config/upsertConfig
 */
export const upsertConfig = async (req: Request, res: Response): Promise<Response> => {
  const t = await sequelize.transaction();
  let committed = false;
  
  try {
    const { configKey } = req.body as { configKey?: string };
    
    // Validação de configKey
    if (!configKey || typeof configKey !== 'string') {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'configKey é obrigatório e deve ser uma string.' 
      });
    }

    // Normaliza configKey (trim e minúsculo para consistência)
    const key = configKey.trim();

    // Extrai apenas os campos permitidos
    const payload = pick<typeof req.body>(req.body, ['configValue', 'description', 'active']);

    // ✅ CORREÇÃO: Normalizar configValue antes de salvar
    if (payload.configValue !== undefined) {
      payload.configValue = normalizeConfigValue(payload.configValue);
    }

    // Busca configuração existente com lock para evitar race condition
    const existing = await Config.findOne({
      where: { configKey: key },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (existing) {
      // Atualiza configuração existente
      await existing.update(payload, { transaction: t });
      await t.commit();
      committed = true;
      
      return res.status(200).json({
        success: true,
        action: 'updated',
        message: 'Configuração atualizada com sucesso',
        data: existing,
      });
    }

    // Cria nova configuração
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
      data: created,
    });

  } catch (err: any) {
    // ✅ CORREÇÃO: Só faz rollback se a transaction ainda não foi finalizada
    if (!committed) {
      try {
        await t.rollback();  // ✅ Sem verificar t.finished
      } catch (rollbackError) {
        // Se der erro aqui, é porque transaction já foi finalizada
        // Apenas loga o aviso, não propaga o erro
        console.error('Aviso: Erro ao fazer rollback (transaction pode já ter sido finalizada):', rollbackError);
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