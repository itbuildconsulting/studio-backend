import { Request, Response } from 'express';
import Person from '../models/Person.model';
import Product from '../models/Product.model';
import { authenticateToken } from '../core/token/authenticateToken';
import { saveTransaction } from './transactionController';
import { updateCustomerBalance } from './balanceController';
import { checkPurchaseLimit, createItemsAfterTransaction } from './itemsController';

interface ProductRequest {
    productId: string;
    quantity: number;
}

interface PixPaymentRequest {
    expires_in?: number;
    expires_at?: string;
    additional_information?: Array<{
        name: string;
        value: string;
    }>;
}

interface CheckoutPixRequest {
    personId: string;
    products: ProductRequest[];
    pix: PixPaymentRequest;
    billingAddress?: any;
}

// Função de checkout PIX
export const checkoutPix = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        authenticateToken(req, res, async () => {
            const { personId, products, pix, billingAddress }: CheckoutPixRequest = req.body;
            
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

                let productType = null;

                // Mapear produtos para o formato de itens do checkout
                const items = products.map(item => {
                    const product = productInfo.find(p => p.id.toString() === item.productId);
                    if (!product) {
                        throw new Error(`Produto com ID ${item.productId} não encontrado`);
                    }
                    creditTotal += product.credit;
                    const totalForCheckout = Math.round(product.value * 100);
                    productType = product.productTypeId;
                    
                    return {
                        itemId: product.id,
                        amount: totalForCheckout,
                        credit: product.credit,
                        description: product.name.replace(/[^a-zA-Z0-9 ]/g, ''),
                        productTypeId: product.productTypeId,
                        quantity: Number(item.quantity),
                        code: "EX123",
                    };
                });

                // Endereço de cobrança
                const billingAddressData = {
                    line_1: billingAddress?.address || personData.address,
                    line_2: 'Casa',
                    zip_code: billingAddress?.zipCode || personData.zipCode,
                    city: billingAddress?.city || personData.city,
                    state: billingAddress?.state || personData.state,
                    country: 'BR'
                };

                // Telefone
                const phoneNumber = billingAddress?.phone || personData.phone || '999999999';
                let areaCode = '21';
                let number = phoneNumber;
                
                const phoneMatch = phoneNumber.replace(/\D/g, '');
                if (phoneMatch.length >= 10) {
                    areaCode = phoneMatch.substring(0, 2);
                    number = phoneMatch.substring(2);
                }

                // Montar checkout PIX
                const checkout = {
                    closed: true,
                    customer: {
                        name: personData.name,
                        type: 'individual',
                        email: personData.email,
                        document: personData.identity,
                        address: billingAddressData,
                        phones: {
                            mobile_phone: {
                                country_code: '55',
                                area_code: areaCode,
                                number: number
                            }
                        }
                    },
                    items: items,
                    createdAt: new Date(),
                    payments: [
                        {
                            payment_method: 'pix',
                            pix: {
                                expires_in: pix.expires_in || 3600, // padrão: 1 hora
                                ...(pix.expires_at && { expires_at: pix.expires_at }),
                                ...(pix.additional_information && { 
                                    additional_information: pix.additional_information 
                                })
                            }
                        }
                    ]
                };

                console.log('🔵 Criando pagamento PIX...');
                const result = await createTransaction(checkout);
                
                // PIX retorna status 'pending' ao invés de 'paid'
                if (!result.success) {
                    console.error('❌ Falha ao criar PIX:', result.message);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Falha ao criar PIX', 
                        details: result.message 
                    });
                }

                // Salvar transação PIX (status pending)
                const save = await saveTransaction(result.data, creditTotal, personData.id);
                
                if (save.success) {
                    // Criar itens vinculados à transação
                    try {
                        await createItemsAfterTransaction(result.data.id, personData.id, items);
                    } catch (error) {
                        console.error('⚠️ Falha ao criar itens:', error);
                    }

                    // Retornar dados do PIX para o frontend
                    const pixData = result.data.charges[0].last_transaction;
                    
                    return res.status(200).json({ 
                        success: true, 
                        message: 'PIX gerado com sucesso',
                        data: {
                            order_id: result.data.id,
                            charge_id: result.data.charges[0].id,
                            transaction_id: pixData.id,
                            qr_code: pixData.qr_code,
                            qr_code_url: pixData.qr_code_url,
                            expires_at: pixData.expires_at,
                            amount: result.data.amount,
                            status: result.data.status,
                            credits: creditTotal
                        }
                    });
                } else {
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Falha ao salvar transação PIX', 
                        details: save.message 
                    });
                }

            } catch (fetchError) {
                console.error('❌ Erro ao buscar pessoa ou produtos:', fetchError);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Erro ao buscar pessoa ou produtos' 
                });
            }
        });
    } catch (error) {
        console.error('❌ Erro ao validar token:', error);
        return res.status(401).send('Token inválido');
    }
};

// Webhook para receber notificação de pagamento PIX confirmado
export const pixWebhook = async (req: Request, res: Response): Promise<Response> => {
    try {
        const event = req.body;
        
        console.log('📨 Webhook PIX recebido:', JSON.stringify(event, null, 2));

        // Validar assinatura do webhook (recomendado em produção)
        // const signature = req.headers['x-hub-signature'];
        // if (!validateWebhookSignature(signature, req.body)) {
        //     return res.status(401).json({ error: 'Assinatura inválida' });
        // }

        switch (event.type) {
            case 'charge.paid':
                await handlePixPaid(event.data);
                break;

            case 'charge.refunded':
                await handlePixRefunded(event.data);
                break;

            case 'charge.pending':
                console.log('⏳ PIX pendente:', event.data.id);
                break;

            case 'charge.failed':
                await handlePixFailed(event.data);
                break;

            default:
                console.log('ℹ️ Evento não tratado:', event.type);
        }

        return res.status(200).json({ received: true });

    } catch (error: any) {
        console.error('❌ Erro ao processar webhook:', error);
        return res.status(500).json({ 
            error: 'Erro ao processar webhook',
            message: error.message 
        });
    }
};

// Handler quando PIX é pago
async function handlePixPaid(chargeData: any) {
    try {
        console.log('✅ PIX pago:', chargeData.id);
        
        const Transactions = require('../models/Transaction.model').default;
        
        // Buscar transação pelo chargeId
        const transaction = await Transactions.findOne({
            where: { chargeId: chargeData.id }
        });

        if (!transaction) {
            console.error('❌ Transação não encontrada para charge:', chargeData.id);
            return;
        }

        // Atualizar status da transação
        await transaction.update({ 
            status: 'paid',
            paidAt: new Date()
        });

        // Atualizar saldo do cliente (agora que o pagamento foi confirmado)
        const { updateCustomerBalance } = require('./balanceController');
        
        const updateBalanceResult = await updateCustomerBalance(
            transaction.personId,
            transaction.credit,
            transaction.transactionId,
            true, // adicionar créditos
            transaction.productTypeId
        );

        if (updateBalanceResult.success) {
            console.log('✅ Saldo atualizado com sucesso');
            
            // Atualizar status dos itens
            const Item = require('../models/Item.model').default;
            await Item.update(
                { status: 'ativo' },
                { where: { transactionId: transaction.transactionId } }
            );
        } else {
            console.error('❌ Erro ao atualizar saldo:', updateBalanceResult.message);
        }

        // Aqui você pode adicionar:
        // - Envio de email de confirmação
        // - Notificação push
        // - Logs adicionais
        
    } catch (error) {
        console.error('❌ Erro ao processar pagamento PIX:', error);
    }
}

// Handler quando PIX é estornado
async function handlePixRefunded(chargeData: any) {
    try {
        console.log('🔄 PIX estornado:', chargeData.id);
        
        const Transactions = require('../models/Transaction.model').default;
        
        const transaction = await Transactions.findOne({
            where: { chargeId: chargeData.id }
        });

        if (!transaction) {
            console.error('❌ Transação não encontrada');
            return;
        }

        // Atualizar status
        await transaction.update({ status: 'refunded' });

        // Remover créditos do usuário
        const { updateCustomerBalance } = require('./balanceController');
        await updateCustomerBalance(
            transaction.personId,
            transaction.credit,
            transaction.transactionId,
            false, // remover créditos
            transaction.productTypeId
        );

        console.log('✅ Estorno processado com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao processar estorno:', error);
    }
}

// Handler quando PIX falha
async function handlePixFailed(chargeData: any) {
    try {
        console.log('❌ PIX falhou:', chargeData.id);
        
        const Transactions = require('../models/Transaction.model').default;
        
        const transaction = await Transactions.findOne({
            where: { chargeId: chargeData.id }
        });

        if (transaction) {
            await transaction.update({ status: 'failed' });
        }
        
    } catch (error) {
        console.error('❌ Erro ao processar falha:', error);
    }
}

// Consultar status do PIX (para polling do frontend)
export const checkPixStatus = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { chargeId } = req.params;

        const response = await fetch(
            `https://api.pagar.me/core/v5/charges/${chargeId}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${process.env.PAGARME_SECRET_KEY}:`).toString('base64'),
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({
                success: true,
                data: {
                    status: data.status,
                    paid_at: data.paid_at,
                    amount: data.amount,
                    last_transaction: data.last_transaction
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                error: data.message || 'Erro ao consultar status do PIX'
            });
        }

    } catch (error: any) {
        console.error('❌ Erro ao consultar PIX:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || 'Erro interno no servidor' 
        });
    }
};

async function createTransaction(checkout: any) {
    try {
        console.log('🔵 Iniciando transação PIX na Pagar.me...');
        console.log('📦 Payload enviado:', JSON.stringify(checkout, null, 2));
        
        const response = await fetch('https://api.pagar.me/core/v5/orders', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${process.env.PAGARME_SECRET_KEY}:`).toString('base64'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(checkout)
        });
  
        const data = await response.json();
        
        console.log('📊 Status da resposta HTTP:', response.status);
        console.log('📄 Resposta completa:', JSON.stringify(data, null, 2));
  
        // CRÍTICO: Verificar gateway_response ANTES de considerar sucesso
        const lastTransaction = data.charges?.[0]?.last_transaction;
        const gatewayResponse = lastTransaction?.gateway_response;
        const transactionStatus = lastTransaction?.status;
        
        // Verificar se houve erro HTTP
        if (!response.ok) {
            console.error('❌ Falha HTTP ao criar transação PIX');
            console.error('Status HTTP:', response.status);
            console.error('Mensagem:', data.message || 'Sem mensagem');
            console.error('Erros detalhados:', JSON.stringify(data.errors || data, null, 2));
            
            return {
                success: false,
                error: data.message || 'Erro na comunicação com Pagar.me',
                details: data.errors || data,
                statusCode: response.status
            };
        }
        
        // Verificar se transaction falhou (mesmo com HTTP 200)
        if (transactionStatus === 'failed') {
            console.error('❌ Transação PIX falhou no gateway');
            console.error('Status da transação:', transactionStatus);
            
            // Se houver erro no gateway_response
            if (gatewayResponse?.errors && gatewayResponse.errors.length > 0) {
                console.error('⚠️ Erros do Gateway da Pagar.me:');
                gatewayResponse.errors.forEach((error: any) => {
                    console.error(`   • ${error.message}`);
                });
                
                // Verificar erro específico de conta não ativada
                const isNotActivated = gatewayResponse.errors.some((e: any) => 
                    e.message.includes('não ativada para modo live') || 
                    e.message.includes('action_forbidden')
                );
                
                if (isNotActivated) {
                    return {
                        success: false,
                        error: 'Conta Pagar.me não ativada para produção',
                        //message: 'SOLUÇÃO: Use a chave de TESTE (sk_test_...) no arquivo .env, ou ative sua conta para produção no dashboard da Pagar.me',
                        details: gatewayResponse.errors
                    };
                }
                
                // Retornar erro genérico do gateway
                return {
                    success: false,
                    error: 'Falha no gateway de pagamento',
                    message: gatewayResponse.errors[0].message,
                    details: gatewayResponse.errors
                };
            }
            
            // Transação falhou mas sem detalhes no gateway_response
            return {
                success: false,
                error: 'Transação PIX falhou',
                message: 'A transação foi rejeitada pelo gateway de pagamento',
                details: { status: transactionStatus, gateway_response: gatewayResponse }
            };
        }
        
        // Verificar se QR Code foi gerado
        const qrCode = lastTransaction?.qr_code;
        if (!qrCode) {
            console.error('❌ QR Code não foi gerado');
            return {
                success: false,
                error: 'QR Code não gerado',
                message: 'A transação foi criada mas o QR Code não foi gerado',
                details: lastTransaction
            };
        }
  
        // TUDO OK! Transação criada com sucesso
        console.log('✅ Transação PIX criada com sucesso');
        console.log('ID da Order:', data.id);
        console.log('Status da transação:', transactionStatus);
        console.log('QR Code gerado:', qrCode ? '✅ Sim' : '❌ Não');
        
        return {
            success: true,
            message: 'Transação PIX criada com sucesso',
            data: data
        };
  
    } catch (error: any) {
        console.error('💥 Erro crítico na API Pagar.me:', error);
        console.error('Stack trace:', error.stack);
        
        return {
            success: false,
            message: error.message || 'Erro interno no servidor',
        };
    }
}