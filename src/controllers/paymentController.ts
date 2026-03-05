import { Request, Response } from 'express';
import InstallmentRule from '../models/InstallmentRule.model';
import { Op } from 'sequelize';

/**
 * Calcular parcelas baseado nos produtos do carrinho
 * POST /payment/calculate-installments
 */
export const calculateInstallmentsFromCart = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lista de produtos é obrigatória'
      });
    }

    // Calcular total
    let totalAmount = 0;
    for (const product of products) {
      totalAmount += product.price * product.qtd;
    }

    console.log('💰 Total calculado:', totalAmount);

    // Buscar regra "a partir de"
    const rule = await InstallmentRule.findOne({
      where: {
        min_amount: { [Op.lte]: totalAmount },
        is_active: true
      },
      order: [['min_amount', 'DESC']], // ← ADICIONAR
    });

    console.log('📊 Regra encontrada:', rule?.toJSON());

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
        total_amount: totalAmount,
        installments,
        max_installments: maxInstallments,
        interest_free_installments: interestFreeInstallments,
        rule_description: rule.description
      }
    });
  } catch (error) {
    console.error('Erro ao calcular parcelas:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao calcular opções de parcelamento'
    });
  }
};

function formatCurrency(valueInCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valueInCents / 100);
}