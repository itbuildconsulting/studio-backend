import { Request, Response } from 'express';
import {
  purchaseCredits,
  consumeCredits,
  cancelBatchIfUnused,
  refundRemainingByBatch,
  expireDueCredits,
  getBalanceByProduct,
  listCustomerCredits,           // implementa uma consulta simples no model
  checkAvailability,             // função simples para somar válidos >= qty
  revertConsumption,             // requer ledger
} from '../services/credits.service';

// 1) Comprar créditos (cria 1 registro por transação)
export async function purchaseCreditsController(req: Request, res: Response) {
  try {
    const { idCustomer, productTypeId, quantity, transactionId, validityDays, origin } = req.body;
    if (!idCustomer || !productTypeId || !quantity || !transactionId || !validityDays) {
      return res.status(400).json({ success: false, message: 'Parâmetros obrigatórios ausentes.' });
    }

    const result = await purchaseCredits({ idCustomer, productTypeId, quantity, transactionId, origin, validityDays });
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// 2) Consumir créditos (FEFO)
export async function consumeCreditsController(req: Request, res: Response) {
  try {
    const { idCustomer, productTypeId, quantity, refId } = req.body;
    if (!idCustomer || !productTypeId || !quantity) {
      return res.status(400).json({ success: false, message: 'Parâmetros obrigatórios ausentes.' });
    }

    const result = await consumeCredits({ idCustomer, productTypeId, quantity, refId });
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

type CancelBatchDTO = { idCustomer: number; creditBatch: string };
export async function cancelBatchIfUnusedController(
  req: Request<{}, {}, CancelBatchDTO>,
  res: Response
) {
  try {
    const { idCustomer, creditBatch } = req.body;
    if (!idCustomer || !creditBatch) {
      return res.status(400).json({ success: false, message: 'idCustomer e creditBatch são obrigatórios.' });
    }

    // ✅ passa como objeto (um único argumento)
    const result = await cancelBatchIfUnused({ idCustomer, creditBatch });

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// 4) Estornar saldo remanescente do batch (parcialmente usado)+
type RefundBatchDTO = { idCustomer: number; creditBatch: string };
export async function refundRemainingByBatchController(
  req: Request<{}, {}, RefundBatchDTO>,
  res: Response
) {
  try {
    const { idCustomer, creditBatch } = req.body;
    if (!idCustomer || !creditBatch) {
      return res.status(400).json({ success: false, message: 'idCustomer e creditBatch são obrigatórios.' });
    }

    // ✅ passa como objeto
    const result = await refundRemainingByBatch({ idCustomer, creditBatch });

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// 5) Rodar expiração (cron/admin)
export async function expireDueCreditsController(_req: Request, res: Response) {
  try {
    await expireDueCredits();
    return res.status(200).json({ success: true, message: 'Expiração processada.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// 6) Saldo por produto
export async function getBalanceByProductController(req: Request, res: Response) {
  try {
    const idCustomer = Number(req.params.customerId);
    if (!idCustomer) return res.status(400).json({ success: false, message: 'customerId inválido.' });

    const balance = await getBalanceByProduct(idCustomer);
    return res.status(200).json({ success: true, balance });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// 7) Listar créditos do cliente
export async function listCustomerCreditsController(req: Request, res: Response) {
  try {
    const idCustomer = Number(req.params.customerId);
    const { productTypeId, status } = req.query;

    if (!idCustomer) return res.status(400).json({ success: false, message: 'customerId inválido.' });

    const result = await listCustomerCredits({
      idCustomer,
      productTypeId: productTypeId ? Number(productTypeId) : undefined,
      status: status ? String(status) : undefined,
    });
    return res.status(200).json({ success: true, credits: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// 9) Checar disponibilidade (antes de reservar/consumir)
export async function checkAvailabilityController(req: Request, res: Response) {
  try {
    const { idCustomer, productTypeId, quantity } = req.body;
    if (!idCustomer || !productTypeId || !quantity) {
      return res.status(400).json({ success: false, message: 'Parâmetros obrigatórios ausentes.' });
    }

    const available = await checkAvailability({ idCustomer, productTypeId, quantity });
    return res.status(200).json({ success: true, available });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// 10) Reverter consumo (opcional, requer ledger)
export async function revertConsumptionController(req: Request, res: Response) {
  try {
    const { idCustomer, productTypeId, quantity, refId } = req.body;
    if (!idCustomer || !productTypeId || !quantity || !refId) {
      return res.status(400).json({ success: false, message: 'Parâmetros obrigatórios ausentes.' });
    }

    const result = await revertConsumption({ idCustomer, productTypeId, quantity, refId });
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
}
