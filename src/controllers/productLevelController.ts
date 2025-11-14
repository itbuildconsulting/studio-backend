import { Request, Response } from 'express';
import Product from '../models/Product.model';
import ProductType from '../models/ProductType.model';
import Place from '../models/Place.model';
import {
  getProductsForStudent,
  getAllLevelsForDropdown,
  validateLevels,
  canAccessProduct,
} from '../services/productLevelService';
import Person from '../models/Person.model';

/**
 * 🆕 GET /api/app/products-for-me
 * Retorna apenas os produtos que o aluno logado tem acesso baseado no nível
 */
export const getProductsForLoggedStudent = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Pegar o ID do aluno do token JWT (assumindo que está em req.user)
    const studentId = (req as any).user?.id || req.body.studentId;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
    }

    const { page = 1, pageSize = 10, productTypeId } = req.query;

    const result = await getProductsForStudent(studentId, {
      page: Number(page),
      pageSize: Number(pageSize),
      productTypeId: productTypeId ? Number(productTypeId) : undefined,
    });

    return res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Erro ao buscar produtos para o aluno:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar produtos',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
};

/**
 * 🆕 GET /api/admin/products-with-levels
 * Lista produtos com informações de nível (para admin)
 */
export const getProductsWithLevels = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { page = 1, pageSize = 10, productTypeId } = req.query;

    const limit = parseInt(String(pageSize), 10);
    const offset = (parseInt(String(page), 10) - 1) * limit;

    const whereClause: any = {};

    if (productTypeId && productTypeId !== 'null') {
      whereClause.productTypeId = productTypeId;
    }

    const { rows: products, count: totalRecords } = await Product.findAndCountAll({
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
      limit,
      offset,
      order: [['id', 'DESC']],
    });

    // Enriquecer com informações de nível
    const enrichedProducts = products.map((product) => {
      const p = product.toJSON() as any;
      return {
        ...p,
        hasLevelRestriction:
          p.requiredLevel !== null || p.exclusiveLevels !== null,
        accessType: p.exclusiveLevels
          ? 'exclusive'
          : p.requiredLevel
          ? 'minimum'
          : 'public',
      };
    });

    return res.status(200).json({
      success: true,
      data: enrichedProducts,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: parseInt(String(page), 10),
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar produtos com níveis:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar produtos',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
};

/**
 * 🆕 POST /api/admin/products (atualizado com suporte a níveis)
 * Criar produto com restrições de nível
 */
export const createProductWithLevels = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const {
      name,
      credit,
      validateDate,
      productTypeId,
      value,
      active,
      purchaseLimit,
      requiredLevel,
      exclusiveLevels,
    } = req.body;

    // Validações básicas
    if (!name || !credit || !validateDate || !productTypeId || !value) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios faltando',
      });
    }

    // Validar níveis se fornecidos
    if (exclusiveLevels && Array.isArray(exclusiveLevels) && exclusiveLevels.length > 0) {
      const validation = await validateLevels(exclusiveLevels);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: `Níveis inválidos: ${validation.invalidIds.join(', ')}`,
        });
      }
    }

    // Criar produto
    const newProduct = await Product.create({
      name,
      credit,
      validateDate,
      productTypeId,
      value,
      active: active ?? 1,
      purchaseLimit: purchaseLimit ?? 0,
      requiredLevel: requiredLevel || null,
      exclusiveLevels: exclusiveLevels || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Produto criado com sucesso',
      data: newProduct,
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar produto',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
};

/**
 * 🆕 PUT /api/admin/products/:id (atualizado com suporte a níveis)
 * Atualizar produto incluindo restrições de nível
 */
export const updateProductWithLevels = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const {
      name,
      credit,
      validateDate,
      productTypeId,
      value,
      active,
      purchaseLimit,
      requiredLevel,
      exclusiveLevels,
    } = req.body;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado',
      });
    }

    // Validar níveis se fornecidos
    if (exclusiveLevels && Array.isArray(exclusiveLevels) && exclusiveLevels.length > 0) {
      const validation = await validateLevels(exclusiveLevels);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: `Níveis inválidos: ${validation.invalidIds.join(', ')}`,
        });
      }
    }

    // Atualizar produto
    await product.update({
      name: name ?? product.name,
      credit: credit ?? product.credit,
      validateDate: validateDate ?? product.validateDate,
      productTypeId: productTypeId ?? product.productTypeId,
      value: value ?? product.value,
      active: active ?? product.active,
      purchaseLimit: purchaseLimit ?? product.purchaseLimit,
      requiredLevel: requiredLevel !== undefined ? requiredLevel : product.requiredLevel,
      exclusiveLevels:
        exclusiveLevels !== undefined ? exclusiveLevels : product.exclusiveLevels,
    });

    return res.status(200).json({
      success: true,
      message: 'Produto atualizado com sucesso',
      data: product,
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar produto',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
};

/**
 * 🆕 GET /api/admin/levels-dropdown
 * Retorna lista de níveis para usar em dropdowns
 */
export const getLevelsDropdown = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const levels = await getAllLevelsForDropdown();

    return res.status(200).json({
      success: true,
      data: levels,
    });
  } catch (error) {
    console.error('Erro ao buscar níveis:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar níveis',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
};

/**
 * 🆕 POST /api/app/check-product-access
 * Verifica se um aluno tem acesso a um produto específico
 */
export const checkProductAccess = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { productId } = req.body;
    const studentId = (req as any).user?.id || req.body.studentId;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId é obrigatório',
      });
    }

    // Buscar produto
    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado',
      });
    }

    // Buscar nível do aluno
    const student = await Person.findByPk(studentId, {
      attributes: ['student_level'],
    });

    const studentLevelId = student?.student_level
      ? parseInt(student.student_level)
      : null;

    // Verificar acesso
    const hasAccess = canAccessProduct(studentLevelId, {
      requiredLevel: product.requiredLevel,
      exclusiveLevels: product.exclusiveLevels as number[] | null,
    });

    return res.status(200).json({
      success: true,
      hasAccess,
      productId,
      studentLevelId,
      productRestrictions: {
        requiredLevel: product.requiredLevel,
        exclusiveLevels: product.exclusiveLevels,
      },
    });
  } catch (error) {
    console.error('Erro ao verificar acesso ao produto:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar acesso',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
};