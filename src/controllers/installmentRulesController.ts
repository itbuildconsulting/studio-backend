import { Request, Response } from 'express';
import InstallmentRule from '../models/InstallmentRule.model';
import { Op } from 'sequelize';

/**
 * Criar uma nova regra de parcelamento
 * POST /installment-rules/create
 */
export const createInstallmentRule = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      min_amount,
      max_amount,
      max_installments,
      interest_free_installments,
      description
    } = req.body;

    // Validações básicas
    if (!min_amount || !max_amount || !max_installments) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: min_amount, max_amount, max_installments'
      });
    }

    if (min_amount >= max_amount) {
      return res.status(400).json({
        success: false,
        message: 'min_amount deve ser menor que max_amount'
      });
    }

    if (interest_free_installments > max_installments) {
      return res.status(400).json({
        success: false,
        message: 'Parcelas sem juros não pode ser maior que máximo de parcelas'
      });
    }

    // Verificar sobreposição de faixas de valores
    const existingRule = await InstallmentRule.findOne({
      where: {
        is_active: true,
        [Op.or]: [
          {
            min_amount: { [Op.lte]: min_amount },
            max_amount: { [Op.gte]: min_amount }
          },
          {
            min_amount: { [Op.lte]: max_amount },
            max_amount: { [Op.gte]: max_amount }
          },
          {
            min_amount: { [Op.gte]: min_amount },
            max_amount: { [Op.lte]: max_amount }
          }
        ]
      }
    });

    if (existingRule) {
      return res.status(400).json({
        success: false,
        message: `Já existe uma regra que cobre essa faixa de valores (R$ ${existingRule.min_amount / 100} - R$ ${existingRule.max_amount / 100}).`,
      });
    }

    // Criar nova regra
    const newRule = await InstallmentRule.create({
      min_amount,
      max_amount,
      max_installments,
      interest_free_installments: interest_free_installments || 0,
      description: description || '',
      is_active: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Regra criada com sucesso',
      data: newRule,
    });
  } catch (error) {
    console.error('Erro ao criar regra:', error);
    return res.status(500).json({ success: false, error: 'Erro ao criar regra' });
  }
};

/**
 * Editar uma regra existente
 * POST /installment-rules/update
 */
export const updateInstallmentRule = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      id,
      min_amount,
      max_amount,
      max_installments,
      interest_free_installments,
      description,
      is_active
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID da regra é obrigatório'
      });
    }

    const rule = await InstallmentRule.findByPk(id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Regra não encontrada' });
    }

    // Atualizar campos
    rule.min_amount = min_amount || rule.min_amount;
    rule.max_amount = max_amount || rule.max_amount;
    rule.max_installments = max_installments || rule.max_installments;
    rule.interest_free_installments = interest_free_installments !== undefined ? interest_free_installments : rule.interest_free_installments;
    rule.description = description || rule.description;
    rule.is_active = is_active !== undefined ? is_active : rule.is_active;

    await rule.save();

    return res.status(200).json({
      success: true,
      message: 'Regra atualizada com sucesso',
      data: rule,
    });
  } catch (error) {
    console.error('Erro ao atualizar regra:', error);
    return res.status(500).json({ success: false, error: 'Erro ao atualizar regra' });
  }
};

/**
 * Deletar uma regra (soft delete)
 * GET /installment-rules/delete?id=1
 */
export const deleteInstallmentRule = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.query;
    
    console.log('🗑️ Tentando deletar ID:', id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID da regra é obrigatório'
      });
    }

    const rule = await InstallmentRule.findByPk(Number(id));
    
    console.log('📊 Regra encontrada:', rule ? 'SIM' : 'NÃO');
    console.log('📊 Dados da regra:', rule?.toJSON());
    
    if (!rule) {
      return res.status(404).json({ 
        success: false, 
        message: 'Regra não encontrada' 
      });
    }

    console.log('📊 is_active ANTES:', rule.is_active);
    
    // Soft delete
    rule.is_active = false;
    await rule.save();
    
    console.log('📊 is_active DEPOIS:', rule.is_active);
    console.log('✅ Regra deletada com sucesso!');

    return res.status(200).json({ 
      success: true, 
      message: 'Regra excluída com sucesso' 
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao deletar regra:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro ao deletar regra' 
    });
  }
};

/**
 * Listar todas as regras
 * GET /installment-rules/list
 */
export const listInstallmentRules = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { active_only } = req.query;

    const where: any = {};
    
    if (active_only === 'true') {
      where.is_active = true;
    }

    const rules = await InstallmentRule.findAll({
      where,
      order: [['min_amount', 'ASC']],
    });

    return res.status(200).json({ success: true, data: rules });
  } catch (error) {
    console.error('Erro ao listar regras:', error);
    return res.status(500).json({ success: false, error: 'Erro ao listar regras' });
  }
};

/**
 * Detalhes de uma regra específica
 * GET /installment-rules/details/:id
 */
export const getInstallmentRuleById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const rule = await InstallmentRule.findByPk(id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Regra não encontrada' });
    }

    return res.status(200).json({ success: true, data: rule });
  } catch (error) {
    console.error('Erro ao buscar regra:', error);
    return res.status(500).json({ success: false, error: 'Erro ao buscar regra' });
  }
};

/**
 * Buscar opções de parcelamento para um valor (endpoint público)
 * GET /payment/installments?amount=25000
 */
export const getInstallmentOptions = async (req: Request, res: Response): Promise<Response> => {
 try {
    const { amount } = req.query;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Valor (amount) é obrigatório'
      });
    }

    const totalAmount = parseInt(amount as string);

    if (isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valor inválido'
      });
    }

    // Buscar regra "a partir de"
    const rule = await InstallmentRule.findOne({
      where: {
        min_amount: { [Op.lte]: totalAmount },
        is_active: true
      },
      order: [['min_amount', 'DESC']], // ← ADICIONAR
    });

    if (!rule) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma regra de parcelamento configurada para este valor'
      });
    }

    // Gerar opções de parcelamento
    const installments = [];
    const maxInstallments = rule.max_installments;
    const interestFreeInstallments = rule.interest_free_installments;

    for (let i = 1; i <= maxInstallments; i++) {
      const installmentValue = Math.round(totalAmount / i);
      const isInterestFree = i <= interestFreeInstallments;

      installments.push({
        number: i,
        installment_amount: installmentValue,
        total_amount: totalAmount,
        interest_free: isInterestFree,
        label: i === 1 
          ? `À vista - ${formatCurrency(totalAmount)}`
          : `${i}x de ${formatCurrency(installmentValue)}${isInterestFree ? ' sem juros' : ''}`.trim()
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        installments,
        max_installments: maxInstallments,
        interest_free_installments: interestFreeInstallments,
        total_amount: totalAmount,
        rule_description: rule.description
      }
    });
  } catch (error) {
    console.error('Erro ao buscar parcelas:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar opções de parcelamento'
    });
  }
};

// Função auxiliar para formatar moeda
function formatCurrency(valueInCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valueInCents / 100);
}