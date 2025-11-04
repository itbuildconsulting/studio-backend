import { Request, Response } from 'express';
import Person from '../models/Person.model';
import Product from '../models/Product.model';
import { authenticateToken } from '../core/token/authenticateToken';
import { saveTransaction } from './transactionController';
import { updateCustomerBalance } from './balanceController';
import { checkPurchaseLimit, createItemsAfterTransaction } from './itemsController';
import Item from '../models/Item.model';
import Transactions from '../models/Transaction.model';
import { removeCreditsForBatch } from '../services/credits.service';
import ClassStudent from '../models/ClassStudent.model';
import Class from '../models/Class.model';

interface ProductRequest {
    productId: string;
    quantity: number;
}

interface PaymentRequest {
    number: string;
    holder_name: string;
    exp_month: string;
    exp_year: string;
    cvv: string;
}

interface CheckoutRequest {
    personId: string;
    products: ProductRequest[];
    payment: PaymentRequest;
    billingAddress?: any;
}

// Função de checkout
export const checkout = async (req: Request, res: Response, ): Promise<Response | void> => {
    try {
        authenticateToken(req, res, async () => {
            const { personId, products, payment, billingAddress }: CheckoutRequest = req.body;
            try {
                const personData = await Person.findByPk(personId);
                if (!personData) {
                    return res.status(404).json({ error: 'Pessoa não encontrada' });
                }

                // Buscar informações dos produtos
                const productIds = products.map(product => product.productId);
                const productInfo = await Product.findAll({
                    where: {
                        id: productIds
                    }
                });

                if (!productInfo.length) {
                    return res.status(404).json({ error: 'Produtos não encontrados' });
                }

                let creditTotal = 0;

                 // Verificação do limite de compras
                 for (const item of products) {
                    const isAllowed = await checkPurchaseLimit(personData.id, item.productId);
                    if (!isAllowed) {
                        return res.status(400).json({ 
                            success: false, 
                            message: `O produto ${item.productId} só pode ser comprado uma vez por usuário.` 
                        });
                    }
                }
                let productType = null

                // Mapear produtos para o formato de itens do checkout
                const items = products.map(item => {
                    
                    const product = productInfo.find(p => p.id.toString() === item.productId);
                    if (!product) {
                        throw new Error(`Produto com ID ${item.productId} não encontrado`);
                    }
                    creditTotal += product.credit;
                    const totalForCheckout = Math.round(product.value * 100); // 10500
                    productType = product.productTypeId
                    return {
                        itemId: product.id,
                        amount: totalForCheckout,  // Multiplica o preço pela quantidade
                        credit: product.credit,
                        description: product.name.replace(/[^a-zA-Z0-9 ]/g, ''),
                        productTypeId: product.productTypeId,
                        quantity: Number(item.quantity),
                        code: "EX123",
                    };
                });

                // ============================================
                // NOVO: Usar billingAddress se fornecido, senão usar dados do perfil
                // ============================================
                
                // Endereço de cobrança (prioriza billingAddress do request)
                const billingAddressData = {
                    line_1: billingAddress?.address || personData.address,
                    line_2: 'Casa',  // Pode ser expandido se necessário
                    zip_code: billingAddress?.zipCode || personData.zipCode,
                    city: billingAddress?.city || personData.city,
                    state: billingAddress?.state || personData.state,
                    country: 'BR'
                };

                // Telefone de cobrança (prioriza billingAddress do request)
                const phoneNumber = billingAddress?.phone || personData.phone || '999999999';
                
                // Extrair código de área e número (assumindo formato brasileiro)
                let areaCode = '21';  // padrão
                let number = phoneNumber;
                
                // Tentar extrair código de área se estiver no formato (XX) XXXXX-XXXX ou similar
                const phoneMatch = phoneNumber.replace(/\D/g, ''); // Remove não-dígitos
                if (phoneMatch.length >= 10) {
                    areaCode = phoneMatch.substring(0, 2);
                    number = phoneMatch.substring(2);
                }

                const checkout = {
                    closed: true,
                    customer: {
                        name: personData.name,
                        type: 'individual',
                        email: personData.email,
                        document: personData.identity,
                        address: billingAddressData,  // ATUALIZADO: Usa dados de cobrança
                        phones: {
                            mobile_phone: {
                                country_code: '55',
                                area_code: areaCode,  // ATUALIZADO: Código de área extraído
                                number: number        // ATUALIZADO: Número extraído
                            }
                        }
                    },
                    items: items,
                    createdAt: new Date(),
                    payments: [
                        {
                            payment_method: 'credit_card',
                            credit_card: {
                                installments: 1,
                                statement_descriptor: 'AVENGERS',
                                card: {
                                    number: payment.number,
                                    holder_name: payment.holder_name,
                                    exp_month: payment.exp_month,
                                    exp_year: payment.exp_year,
                                    cvv: payment.cvv,
                                    billing_address: billingAddressData  // ATUALIZADO: Usa dados de cobrança
                                }
                            }
                        }
                    ]
                };

                // Chamar o paymentController para processar a transação
                //console.log("Checkout Payload:", JSON.stringify(checkout, null, 2));
                const result = await createTransaction(checkout);
                //console.log("Result Payload:", JSON.stringify(result, null, 2));
                if (!result.success || result.data.status !== 'paid') {
                    console.error('Falha ao criar transação2:', result.message);
                    return res.status(500).json({ success: false, error: 'Falha ao criar transação:', details: result.message });
                }

                const save = await saveTransaction(result.data, creditTotal, personData.id);
                if (save.success) {
                    const updateBalanceResult = await updateCustomerBalance(personData.id, creditTotal, result.data.id, true, productType);

                    try {
                        await createItemsAfterTransaction(result.data.id, personData.id, items);
                    } catch (error) {
                        console.error('Falha ao criar itens:', error);
                    }

                    if (updateBalanceResult.success) {
                        return res.status(200).json({ success: true, message: 'Transação concluída e saldo atualizado com sucesso', details: result.data });
                    } else {
                        return res.status(500).json({ success: false, error: 'Transação bem-sucedida, mas falha ao atualizar saldo', details: updateBalanceResult.message });
                    }
                } else {
                    return res.status(500).json({ success: false, error: 'Falha ao salvar transação', details: save.message });
                }

            } catch (fetchError) {
                console.error('Erro ao buscar pessoa ou produtos:', fetchError);
                return res.status(500).json({ success: false, error: 'Erro ao buscar pessoa ou produtos' });
            }
        });
    } catch (error) {
        console.error('Erro ao validar token:', error);
        return res.status(401).send('Token inválido');
    }
};

interface ProductRequest {
    productId: string;
    quantity: number;
}

interface CashPaymentRequest {
    description: string;
    confirm: boolean;
    metadata?: object;
}

interface CheckoutRequest {
    personId: string;
    products: ProductRequest[];
    discountType: string;
    discountPercent: string;
    cashPayment: CashPaymentRequest;
}

export const checkoutCash = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        authenticateToken(req, res, async () => {
            const { personId, products, cashPayment, discountType, discountPercent }: CheckoutRequest = req.body;
            
            try {
                const personData = await Person.findByPk(personId);
                if (!personData) {
                    return res.status(404).json({ error: 'Pessoa não encontrada' });
                }

                // Buscar informações dos produtos
                const productIds = products.map(product => product.productId);
                const productInfo = await Product.findAll({
                    where: {
                        id: productIds
                    }
                });

                if (!productInfo.length) {
                    return res.status(404).json({ error: 'Produtos não encontrados' });
                }

                let creditTotal = 0;
                let totalAmount = 0;

                // Verificação do limite de compras
                for (const item of products) {
                    const isAllowed = await checkPurchaseLimit(personData.id, item.productId);
                    if (!isAllowed) {
                        return res.status(400).json({ 
                            success: false, 
                            message: `O produto ${item.productId} só pode ser comprado uma vez por usuário.` 
                        });
                    }
                }

                let productType = null

                // Mapear produtos para o formato de itens do checkout
                const items = products.map(item => {
                    const product = productInfo.find(p => p.id === Number(item.productId));
                    if (!product) {
                        throw new Error(`Produto com ID ${item.productId} não encontrado`);
                    }
                    creditTotal += product.credit;
                    const total = product.value * item.quantity; 
                    totalAmount += total;  // Soma o valor total dos produtos

                    const totalForCheckout = Math.round(product.value * 100); // Converte para centavos
                    productType = product.productTypeId
                    return {
                        itemId: product.id,
                        amount: totalForCheckout,
                        credit: product.credit,
                        description: product.name.replace(/[^a-zA-Z0-9 ]/g, ''),
                        quantity: Number(item.quantity),
                        code: "EX123",
                    };
                });

                // Aplicar o desconto baseado no tipo de desconto
                if (Number(discountType) === 1 && discountPercent !== undefined) {
                    // Aplicar desconto percentual
                    const discountValue = (totalAmount * Number(discountPercent)) / 100;
                    totalAmount -= discountValue; // Subtrai o desconto do valor total
                }

                // Criar o objeto do checkout
                const checkout = {
                    closed: true,
                    customer: {
                        name: personData.name,
                        type: 'individual',
                        email: personData.email,
                        document: personData.identity,
                        address: {
                            line_1: personData.address,
                            line_2: 'Casa',
                            zip_code: personData.zipCode,
                            city: personData.city,
                            state: personData.state,
                            country: 'BR'
                        },
                        phones: {
                            mobile_phone: {
                                country_code: '55',
                                area_code: '21',
                                number: '999999999'
                            }
                        }
                    },
                    items: items,
                    payments: [
                        {
                            payment_method: 'cash',
                            cash: {
                                description: cashPayment.description || 'Pagamento em dinheiro',
                                confirm: cashPayment.confirm || false,
                                metadata: cashPayment.metadata || {}
                            }
                        }
                    ]
                };

                // Chamar o paymentController para processar a transação
                const result = await createTransaction(checkout);
                if (!result.success || result.data.status !== 'paid') {
                    console.error('Falha ao criar transação:', result.message);
                    return res.status(500).json({ success: false, error: 'Falha ao criar transação:', details: result.message, data: result.data });
                }

                // Salvar transação e atualizar o saldo
                const save = await saveTransaction(result.data, creditTotal, personData.id);
                if (save.success) {
                    const updateBalanceResult = await updateCustomerBalance(personData.id, creditTotal, result.data.id, true, productType);

                    try {
                        await createItemsAfterTransaction(result.data.id, personData.id, items);
                    } catch (error) {
                        console.error('Falha ao criar itens:', error);
                    }

                    if (updateBalanceResult.success) {
                        return res.status(200).json({ success: true, message: 'Transação concluída e saldo atualizado com sucesso', details: result.data });
                    } else {
                        return res.status(500).json({ success: false, error: 'Transação bem-sucedida, mas falha ao atualizar saldo', details: updateBalanceResult.message });
                    }
                } else {
                    return res.status(500).json({ success: false, error: 'Falha ao salvar transação', details: save.message });
                }

            } catch (fetchError) {
                console.error('Erro ao buscar pessoa ou produtos:', fetchError);
                return res.status(500).json({ success: false, error: 'Erro ao buscar pessoa ou produtos' });
            }
        });
    } catch (error) {
        console.error('Erro ao validar token:', error);
        return res.status(401).send('Token inválido');
    }
};



// Função para criar transação
async function createTransaction(checkout: any) {
    
    try {
        const response = await fetch('https://api.pagar.me/core/v5/orders', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from("sk_test_ff6bdd05222244b48cf7a8544a86584c:").toString('base64'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(checkout)
        });
  
        const data = await response.json();
  
        if (!response.ok) {
            // Retornando erro como parte do objeto de resposta
            return {
                success: false,
                message: data.message || 'Erro na transação',
                data: data
            };
        }
  
        // Retornando sucesso com dados
        return {
            success: true,
            message: 'Transação criada com sucesso',
            data: data
        };
  
    } catch (error: any) {
        console.error('Erro na API Pagar.me:', error);
        return {
            success: false,
            message: error.message || 'Erro interno no servidor',
            data: error.response ? await error.response.json() : null
        };
    }
}

// Função de cancelamento de pagamento e reembolso integral
export const cancelPaymentAndRefund = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'O ID do pagamento é obrigatório' 
      });
    }

    // 1) Buscar transação
    const transaction = await Transactions.findOne({ 
      where: { transactionId: paymentId } 
    });
    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transação não encontrada' 
      });
    }

    // 2) NOVA VERIFICAÇÃO: Checar se há créditos vinculados a aulas
    const classesWithCredits = await ClassStudent.findAll({
      where: { 
        transactionId: paymentId,
        status: 1  // apenas aulas ativas
      },
      include: [{
        model: Class,
        attributes: ['id', 'date', 'time']
      }]
    });

    if (classesWithCredits.length > 0) {
      // Construir lista de aulas para exibir ao usuário
      const classList = classesWithCredits.map((cs: any) => {
        const classData = cs.Class;
        return `Aula #${classData.id} - ${classData.date} às ${classData.time}`;
      }).join(', ');

      return res.status(400).json({
        success: false,
        message: 'Não é possível cancelar esta compra pois você está matriculado em aulas. Por favor, cancele suas matrículas primeiro ou entre em contato com o suporte.',
        details: {
          enrolledClassesCount: classesWithCredits.length,
          classes: classList
        }
      });
    }

    // 3) Cancelar/reembolsar no provedor
    const cancelPaymentResult = await cancelPayment(transaction.chargeId);
    if (!cancelPaymentResult.success) {
      return res.status(500).json({ 
        success: false, 
        message: cancelPaymentResult.message 
      });
    }

    // 4) Atualizar status da transação
    await transaction.update({ status: 'canceled' });

    // 5) Atualizar itens associados
    const items = await Item.findAll({ 
      where: { transactionId: paymentId } 
    });
    if (items.length) {
      await Promise.all(
        items.map(item => item.update({ status: 'cancelado' }))
      );
    }

    // 6) Remover créditos (em modo strict para segurança extra)
    const creditsResult = await removeCreditsForBatch(
      String(paymentId), 
      { strict: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Pagamento cancelado e reembolsado com sucesso.',
      credits: creditsResult,
    });

  } catch (error) {
    console.error('Erro ao cancelar pagamento:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao processar cancelamento de pagamento',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};
  
  // Função que chama a API Pagar.me para cancelar o pagamento
  const cancelPayment = async (paymentId: string) => {
    try {
      const response = await fetch(`https://api.pagar.me/core/v5/charges/${paymentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Basic ' + Buffer.from("sk_test_ff6bdd05222244b48cf7a8544a86584c:").toString('base64'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'refunded' // O status de reembolso completo
        }),
      });
  
      const data = await response.json();
      console.log('AQUIII', data)
  
      if (response.ok && data.status === 'canceled') {
        return { success: true, data }; // Retorna o resultado da resposta com sucesso
      } else {
        return { success: false, message: data.message || 'Erro ao tentar reembolsar o pagamento' };
      }
    } catch (error) {
      console.error('Erro ao chamar a API de cancelamento de pagamento:', error);
      return { success: false, message: 'Erro ao chamar API de cancelamento' };
    }
  };