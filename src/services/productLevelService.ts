import Product from '../models/Product.model';
import ProductType from '../models/ProductType.model';
import Place from '../models/Place.model';
import Level from '../models/Level.model';
import Person from '../models/Person.model';
import { Op } from 'sequelize';

/**
 * Verifica se um aluno tem acesso a um produto baseado no seu nível
 * @param studentLevel - ID do nível atual do aluno (ou null se não tiver nível)
 * @param product - Objeto do produto com requiredLevel e exclusiveLevels
 * @returns true se o aluno tem acesso, false caso contrário
 */
export function canAccessProduct(
  studentLevel: number | null,
  product: { requiredLevel?: number | null; exclusiveLevels?: number[] | null }
): boolean {
  // 1. Produto sem restrições → todos têm acesso
  if (!product.requiredLevel && !product.exclusiveLevels) {
    return true;
  }

  // 2. Se o aluno não tem nível, só pode acessar produtos sem restrição
  if (!studentLevel) {
    return false;
  }

  // 3. Verificar se está na lista de níveis exclusivos
  if (product.exclusiveLevels && Array.isArray(product.exclusiveLevels)) {
    return product.exclusiveLevels.includes(studentLevel);
  }

  // 4. Verificar nível mínimo requerido
  if (product.requiredLevel) {
    // Buscar informações do nível do aluno e do produto para comparar
    // Por enquanto, comparamos só os IDs (assumindo que IDs maiores = níveis superiores)
    return studentLevel >= product.requiredLevel;
  }

  return true;
}

/**
 * Verifica se um aluno tem acesso baseado no numberOfClasses dos níveis
 * Mais robusto que comparar apenas IDs
 */
export async function canAccessProductRobust(
  studentLevelId: number | null,
  product: { requiredLevel?: number | null; exclusiveLevels?: number[] | null }
): Promise<boolean> {
  // Produto sem restrições
  if (!product.requiredLevel && !product.exclusiveLevels) {
    return true;
  }

  // Aluno sem nível
  if (!studentLevelId) {
    return false;
  }

  // Verificar lista exclusiva
  if (product.exclusiveLevels && Array.isArray(product.exclusiveLevels)) {
    return product.exclusiveLevels.includes(studentLevelId);
  }

  // Verificar nível mínimo (comparando numberOfClasses)
  if (product.requiredLevel) {
    const [studentLevel, requiredLevel] = await Promise.all([
      Level.findByPk(studentLevelId, { attributes: ['numberOfClasses'] }),
      Level.findByPk(product.requiredLevel, { attributes: ['numberOfClasses'] }),
    ]);

    if (!studentLevel || !requiredLevel) {
      return false;
    }

    return studentLevel.numberOfClasses >= requiredLevel.numberOfClasses;
  }

  return true;
}

/**
 * Filtra produtos que o aluno tem acesso baseado no seu nível
 * @param studentId - ID do aluno
 * @param options - Opções adicionais de filtro
 */
export async function getProductsForStudent(
  studentId: number,
  options?: {
    page?: number;
    pageSize?: number;
    productTypeId?: number;
    active?: number;
  }
): Promise<{
  products: any[];
  pagination: {
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}> {
  const { page = 1, pageSize = 10, productTypeId, active = 1 } = options || {};

  // 1. Buscar o nível do aluno
  const student = await Person.findByPk(studentId, {
    attributes: ['student_level'],
  });

  const studentLevelId = student?.student_level ? parseInt(student.student_level) : null;

  // 2. Buscar informações do nível do aluno para comparação
  let studentLevelNumberOfClasses = 0;
  if (studentLevelId) {
    const studentLevel = await Level.findByPk(studentLevelId, {
      attributes: ['numberOfClasses'],
    });
    studentLevelNumberOfClasses = studentLevel?.numberOfClasses || 0;
  }

  // 3. Configurar filtros
  const limit = parseInt(String(pageSize), 10);
  const offset = (parseInt(String(page), 10) - 1) * limit;

  const whereClause: any = { active };

  if (productTypeId) {
    whereClause.productTypeId = productTypeId;
  }

  // 4. Buscar TODOS os produtos (vamos filtrar por nível depois)
  const { rows: allProducts, count: totalBeforeFilter } = await Product.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: ProductType,
        as: 'productType',
        attributes: ['name'],
        include: [
          {
            model: Place,
            as: 'place',
            attributes: ['name'],
          },
        ],
      },
    ],
  });

  // 5. Filtrar produtos baseado no nível do aluno
  const accessibleProducts = [];

  for (const product of allProducts) {
    const productData = product.toJSON() as any;

    // Produto sem restrições
    if (!productData.requiredLevel && !productData.exclusiveLevels) {
      accessibleProducts.push(productData);
      continue;
    }

    // Aluno sem nível só vê produtos sem restrição
    if (!studentLevelId) {
      continue;
    }

    // Verificar lista exclusiva
    if (productData.exclusiveLevels && Array.isArray(productData.exclusiveLevels)) {
      if (productData.exclusiveLevels.includes(studentLevelId)) {
        accessibleProducts.push(productData);
      }
      continue;
    }

    // Verificar nível mínimo
    if (productData.requiredLevel) {
      const requiredLevel = await Level.findByPk(productData.requiredLevel, {
        attributes: ['numberOfClasses'],
      });

      if (
        requiredLevel &&
        studentLevelNumberOfClasses >= requiredLevel.numberOfClasses
      ) {
        accessibleProducts.push(productData);
      }
    }
  }

  // 6. Aplicar paginação DEPOIS do filtro
  const totalRecords = accessibleProducts.length;
  const paginatedProducts = accessibleProducts.slice(offset, offset + limit);

  return {
    products: paginatedProducts,
    pagination: {
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: parseInt(String(page), 10),
      pageSize: limit,
    },
  };
}

/**
 * Busca todos os níveis para exibir no dropdown do admin
 */
export async function getAllLevelsForDropdown(): Promise<
  Array<{ id: number; name: string; numberOfClasses: number }>
> {
  const levels = await Level.findAll({
    attributes: ['id', 'name', 'numberOfClasses'],
    order: [['numberOfClasses', 'ASC']],
  });

  return levels.map((level) => ({
    id: level.id,
    name: level.name,
    numberOfClasses: level.numberOfClasses,
  }));
}

/**
 * Valida se os níveis informados existem
 */
export async function validateLevels(levelIds: number[]): Promise<{
  valid: boolean;
  invalidIds: number[];
}> {
  const existingLevels = await Level.findAll({
    where: {
      id: { [Op.in]: levelIds },
    },
    attributes: ['id'],
  });

  const existingIds = existingLevels.map((l) => l.id);
  const invalidIds = levelIds.filter((id) => !existingIds.includes(id));

  return {
    valid: invalidIds.length === 0,
    invalidIds,
  };
}