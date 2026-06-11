import { Request, Response } from 'express';
import crypto from 'crypto';
import Transactions from '../models/Transaction.model';
import Person from '../models/Person.model';
import { updateCustomerBalance } from './balanceController';
import Item from '../models/Item.model';

// POST /webhook/pagarme
export const pagarmeWebhook = async (req: Request, res: Response): Promise<Response> => {

  const event = req.body;
  const type: string = event?.type ?? '';

  // 2) Responde 200 imediatamente (boa prática — Pagar.me espera resposta rápida)
  res.status(200).json({ received: true });

  // 3) Só processa o evento order.paid, ignora o resto
  if (type !== 'order.paid') {
    console.log(`[webhook] Evento ignorado: ${type}`);
    return res;
  }

  const orderId: string = event?.data?.id;
  if (!orderId) {
    console.error('[webhook] order.paid recebido sem orderId');
    return res;
  }

  console.log(`[webhook] Processando order.paid – orderId: ${orderId}`);

  try {
    // 4) Busca a transação no banco pelo transactionId
    const transaction = await Transactions.findOne({ where: { transactionId: orderId } });

    if (!transaction) {
      console.error(`[webhook] Transação não encontrada: ${orderId}`);
      return res;
    }

    // 5) Evita processar duas vezes
    if (transaction.status === 'paid') {
      console.log(`[webhook] Transação ${orderId} já estava paga. Ignorando.`);
      return res;
    }

    // 6) Atualiza status para paid
    await transaction.update({
      status: 'paid',
      closed: true,
      closedAt: new Date(),
    });

    console.log(`[webhook] Status da transação ${orderId} atualizado para "paid"`);

    // 7) Busca o productTypeId nos itens da transação
    let productTypeId: number = 1; // fallback
    const item = await Item.findOne({ where: { transactionId: orderId } });
    if (item && (item as any).productTypeId) {
      productTypeId = (item as any).productTypeId;
    }

    // 8) Adiciona os créditos ao aluno
    // transaction.balance = quantidade de créditos que foi salva no checkout
    const balanceResult = await updateCustomerBalance(
      transaction.studentId,
      transaction.balance,
      orderId,
      true,
      productTypeId,
    );

    if (!balanceResult.success) {
      console.error(`[webhook] Falha ao creditar saldo para aluno ${transaction.studentId}:`, balanceResult.message);
      return res;
    }

    console.log(`[webhook] ✅ ${transaction.balance} crédito(s) adicionado(s) ao aluno ${transaction.studentId} (${transaction.customerName})`);

  } catch (error: any) {
    console.error('[webhook] Erro ao processar order.paid:', error.message ?? error);
  }

  return res;
};