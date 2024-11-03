import { Request, Response } from 'express';
import Person from '../models/Person.model';
import Product from '../models/Product.model';
import { authenticateToken } from '../core/token/authenticateToken';
import { saveTransaction } from './transactionController';
import { updateCustomerBalance } from './balanceController';
import { createItemsAfterTransaction } from './itemsController';

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
}

// Função de checkout
export const checkout = async (req: Request, res: Response, ): Promise<Response | void> => {
    try {
        authenticateToken(req, res, async () => {
            const { personId, products, payment }: CheckoutRequest = req.body;

            try {
                const personData = await Person.findByPk(personId);
                if (!personData) {
                    return res.status(404).json({ message: 'Pessoa não encontrada' });
                }

                // Buscar informações dos produtos
                const productIds = products.map(product => product.productId);
                const productInfo = await Product.findAll({
                    where: {
                        id: productIds
                    }
                });

                if (!productInfo.length) {
                    return res.status(404).json({ message: 'Produtos não encontrados' });
                }

                let creditTotal = 0;

                // Mapear produtos para o formato de itens do checkout
                const items = products.map(item => {
                    const product = productInfo.find(p => p.id.toString() === item.productId);
                    if (!product) {
                        throw new Error(`Produto com ID ${item.productId} não encontrado`);
                    }
                    creditTotal += product.credit;
                    return {
                        itemId: product.id,
                        amount: product.value * item.quantity,  // Multiplica o preço pela quantidade
                        credit: product.credit,
                        description: product.name,
                        quantity: Number(item.quantity),
                        code: "EX123",
                    };
                });

                const checkout = {
                    closed: true,
                    customer: {
                        name: personData.name,
                        type: 'individual',
                        email: personData.email,
                        document: personData.identity,
                        address: {
                            line_1: personData.address,
                            line_2: 'Casa',  // Assumindo que line_2 não está disponível
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
                                    billing_address: {
                                        line_1: personData.address,
                                        line_2: 'Casa',
                                        zip_code: personData.zipCode,
                                        city: personData.city,
                                        state: personData.state,
                                        country: 'BR'
                                    }
                                }
                            }
                        }
                    ]
                };

                // Chamar o paymentController para processar a transação
                console.log("Checkout Payload:", JSON.stringify(checkout, null, 2));
                const result = await createTransaction(checkout);
                console.log(result)
                if (!result.success) {
                    console.error('Falha ao criar transação2:', result.message);
                    return res.status(500).json({ success: false, error: 'Falha ao criar transação:', details: result.message });
                }

                const save = await saveTransaction(result.data, creditTotal);
                if (save.success) {
                    const updateBalanceResult = await updateCustomerBalance(personData.id, creditTotal, true);

                    try {
                        await createItemsAfterTransaction(result.data.id, items);
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
    console.log('AQUIII')
    console.log(checkout)
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
                data: null
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
