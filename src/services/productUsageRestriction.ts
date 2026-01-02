// services/productUsageRestriction.service.ts
import { Op } from 'sequelize';
import moment from 'moment';
import ClassStudent from '../models/ClassStudent.model';
import Class from '../models/Class.model';
import Credit from '../models/Credit.model';
import Product from '../models/Product.model';

interface UsageRestrictionCheck {
  canUse: boolean;
  message?: string;
  currentUsage?: number;
  limit?: number;
  periodStart?: string;
  periodEnd?: string;
}

/**
 * Verifica se o aluno pode usar créditos do produto baseado nas restrições configuradas
 */
export async function checkProductUsageRestriction(
  studentId: number,
  productId: number,
  classDate: string // formato 'YYYY-MM-DD'
): Promise<UsageRestrictionCheck> {
  
  // 1. Buscar informações do produto
  const product = await Product.findByPk(productId);
  
  if (!product) {
    return {
      canUse: false,
      message: 'Produto não encontrado',
    };
  }

  // 2. Se não há restrição ou limite é null, permitir
  if (product.usageRestrictionType === 'none' || !product.usageRestrictionLimit) {
    return {
      canUse: true,
    };
  }

  // 3. Verificar se o aluno tem créditos deste produto
  const hasCredits = await Credit.findOne({
    where: {
      idCustomer: studentId,
      productTypeId: product.productTypeId,
      status: 'valid',
      expirationDate: { [Op.gte]: new Date() },
      availableCredits: { [Op.gt]: 0 },
    },
  });

  if (!hasCredits) {
    return {
      canUse: false,
      message: 'Sem créditos disponíveis para este produto',
    };
  }

  // 4. Definir o período baseado no tipo de restrição
  let periodStart: moment.Moment;
  let periodEnd: moment.Moment;
  let periodLabel: string;

  switch (product.usageRestrictionType) {
    case 'weekly':
      periodStart = moment(classDate).startOf('isoWeek'); // Segunda-feira
      periodEnd = moment(classDate).endOf('isoWeek'); // Domingo
      periodLabel = 'semana';
      break;

    case 'monthly':
      periodStart = moment(classDate).startOf('month');
      periodEnd = moment(classDate).endOf('month');
      periodLabel = 'mês';
      break;

    case 'lifetime':
      // Desde a primeira compra do produto até hoje
      periodStart = moment(hasCredits.createdAt);
      periodEnd = moment(); // Agora
      periodLabel = 'período total';
      break;

    default:
      return {
        canUse: true,
      };
  }

  // 5. Contar quantas aulas o aluno já fez no período com este produto
  const usageCount = await ClassStudent.count({
    where: {
      studentId,
      status: 1, // Apenas confirmados
    },
    include: [
      {
        model: Class,
        required: true,
        where: {
          date: {
            [Op.between]: [
              periodStart.format('YYYY-MM-DD'),
              periodEnd.format('YYYY-MM-DD'),
            ],
          },
          productTypeId: product.productTypeId,
        },
        attributes: [],
      },
    ],
  });

  // 6. Verificar se atingiu o limite
  if (usageCount >= product.usageRestrictionLimit) {
    return {
      canUse: false,
      message: `Limite de ${product.usageRestrictionLimit} aula(s) por ${periodLabel} atingido. Você já usou ${usageCount} de ${product.usageRestrictionLimit}.`,
      currentUsage: usageCount,
      limit: product.usageRestrictionLimit,
      periodStart: periodStart.format('YYYY-MM-DD'),
      periodEnd: periodEnd.format('YYYY-MM-DD'),
    };
  }

  // 7. Pode usar
  return {
    canUse: true,
    currentUsage: usageCount,
    limit: product.usageRestrictionLimit,
    periodStart: periodStart.format('YYYY-MM-DD'),
    periodEnd: periodEnd.format('YYYY-MM-DD'),
  };
}

/**
 * Busca o produto que o aluno possui créditos baseado no productTypeId
 */
export async function getStudentProductByType(
  studentId: number,
  productTypeId: number
): Promise<Product | null> {
  
  // Buscar crédito válido do aluno para este tipo de produto
  const credit = await Credit.findOne({
    where: {
      idCustomer: studentId,
      productTypeId,
      status: 'valid',
      expirationDate: { [Op.gte]: new Date() },
      availableCredits: { [Op.gt]: 0 },
    },
    order: [['expirationDate', 'ASC']], // FEFO
  });

  if (!credit) {
    return null;
  }

  // Buscar o produto que gerou este crédito
  // Nota: precisamos rastrear qual produto específico foi comprado
  // Isso pode ser feito através do creditBatch ou de uma nova coluna productId na tabela Credit
  
  // Por enquanto, buscar qualquer produto ativo deste tipo
  const product = await Product.findOne({
    where: {
      productTypeId,
      active: 1,
    },
  });

  return product;
}

export default {
  checkProductUsageRestriction,
  getStudentProductByType,
};