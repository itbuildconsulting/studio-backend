// services/credits.service.ts
import { Op, Transaction, WhereOptions, FindOptions, col, fn, literal } from 'sequelize';
import sequelize from '../config/database';
import ProductType from '../models/ProductType.model';
import Credit from '../models/Credit.model';

// ------------------------------
// Tipos de entrada/saída
// ------------------------------
export type PurchaseInput = {
  idCustomer: number;
  productTypeId: number;
  quantity: number;
  transactionId: string;  // creditBatch
  origin?: string;        // 'Compra', 'Bônus', etc.
  // opcional se você preferir pegar do ProductType:
  validityDays?: number;
};

export type ConsumeInput = {
  idCustomer: number;
  productTypeId: number;
  quantity: number;
  refId?: string; // id de reserva/aula para auditoria futura (ledger)
};

export type CancelBatchInput = {
  idCustomer: number;
  creditBatch: string;
};

export type ListCreditsFilter = {
  idCustomer: number;
  productTypeId?: number;
  status?: 'valid' | 'used' | 'expired' | string;
};

export type RevertConsumptionInput = {
  idCustomer: number;
  productTypeId: number;
  quantity: number;
  refId: string; // referência obrigatória (p.ex. id do agendamento cancelado)
};

// ------------------------------
// Helpers
// ------------------------------
async function withTx<T>(fn: (t: Transaction) => Promise<T>) {
  return sequelize.transaction(fn);
}

async function getValidityDaysForProductType(productTypeId: number): Promise<number> {
  const pt = await ProductType.findByPk(productTypeId);
  if (!pt) throw new Error('ProductType não encontrado.');

  // tenta validityDays, depois validity, por fim 365
  const raw = (pt as any).validityDays ?? (pt as any).validity ?? 365;

  const days = Number(raw);
  return Number.isFinite(days) ? days : 365;
}

function nowUtc(): Date {
  return new Date();
}

// ------------------------------
// Serviço: Purchase (criar 1 registro por transação/lote)
// ------------------------------
export async function purchaseCredits(input: PurchaseInput) {
  const {
    idCustomer,
    productTypeId,
    quantity,
    transactionId,
    origin = 'Compra',
    validityDays,
  } = input;

  if (quantity <= 0) throw new Error('quantity deve ser > 0.');

  return withTx(async (t) => {
    // (Opcional) idempotência: garanta unicidade por (idCustomer, productTypeId, creditBatch)
    // ou cheque duplicidade:
    // const existing = await Credit.findOne({ where: { idCustomer, productTypeId, creditBatch: transactionId }, transaction: t });
    // if (existing) return { success: true, message: 'Compra já registrada (idempotente).' };

    const days = validityDays ?? (await getValidityDaysForProductType(productTypeId));
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + days);

    await Credit.create(
      {
        idCustomer,
        productTypeId,
        availableCredits: quantity,
        usedCredits: 0,
        status: 'valid',
        expirationDate: expiration,
        creditBatch: transactionId,
        origin,
        // lastUpdated: nowUtc(), // se mantiver esse campo
      },
      { transaction: t }
    );

    return { success: true, message: 'Créditos adicionados com sucesso.' };
  });
}

// ------------------------------
// Serviço: Consume (FEFO + lock)
// ------------------------------
export async function consumeCredits(input: ConsumeInput) {
  const { idCustomer, productTypeId, quantity } = input;
  if (quantity <= 0) throw new Error('quantity deve ser > 0.');

  return withTx(async (t) => {
    const now = nowUtc();

    // busca lotes válidos, não vencidos e com saldo
    const lots = await Credit.findAll({
      where: {
        idCustomer,
        productTypeId,
        status: 'valid',
        expirationDate: { [Op.gte]: now },
        availableCredits: { [Op.gt]: 0 },
      },
      order: [
        ['expirationDate', 'ASC'],
        ['id', 'ASC'],
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    let remaining = quantity;

    for (const lot of lots) {
      if (remaining <= 0) break;
      const take = Math.min(lot.availableCredits, remaining);
      lot.availableCredits -= take;
      lot.usedCredits += take;
      if (lot.availableCredits === 0) lot.status = 'used';
      // lot.lastUpdated = now;
      await lot.save({ transaction: t });
      remaining -= take;

      // TODO (quando tiver ledger):
      // await CreditLedger.create({ creditId: lot.id, idCustomer, productTypeId, delta: -take, reason: 'consume', refId: input.refId }, { transaction: t });
    }

    if (remaining > 0) {
      throw new Error('Créditos insuficientes para este produto.');
    }

    return { success: true, message: 'Créditos consumidos com sucesso.' };
  });
}

// ------------------------------
// Serviço: Cancelar batch sem uso
// ------------------------------
export async function cancelBatchIfUnused({ idCustomer, creditBatch }: CancelBatchInput) {
  return withTx(async (t) => {
    const lot = await Credit.findOne({
      where: { idCustomer, creditBatch },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!lot) throw new Error('Lote não encontrado.');

    if (lot.usedCredits > 0) {
      throw new Error('Lote já possui consumo; não pode ser removido integralmente.');
    }

    await lot.destroy({ transaction: t });
    return { success: true, message: 'Lote cancelado (sem uso) e removido.' };
  });
}

// ------------------------------
// Serviço: Estornar saldo remanescente do batch (parcialmente usado)
// Política simples: zera o available e marca used
// ------------------------------
export async function refundRemainingByBatch({ idCustomer, creditBatch }: CancelBatchInput) {
  return withTx(async (t) => {
    const lot = await Credit.findOne({
      where: { idCustomer, creditBatch },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!lot) throw new Error('Lote não encontrado.');

    const refund = lot.availableCredits;
    lot.availableCredits = 0;
    lot.status = 'used';
    await lot.save({ transaction: t });

    // TODO ledger: delta = -refund, reason = 'refund', refId = creditBatch

    return { success: true, message: `Estornado saldo de ${refund} créditos do lote.` };
  });
}

// ------------------------------
// Serviço: Expirar créditos (cron/admin)
// ------------------------------
export async function expireDueCredits() {
  const now = nowUtc();
  const [affected] = await Credit.update(
    { status: 'expired' /*, lastUpdated: now*/ },
    {
      where: {
        status: 'valid',
        expirationDate: { [Op.lt]: now },
        availableCredits: { [Op.gt]: 0 },
      },
    }
  );
  return { success: true, message: `Expiração processada. Lotes afetados: ${affected}.` };
}

// ------------------------------
// Serviço: Saldo por produto (apenas válidos e não vencidos)
// ------------------------------
export async function getBalanceByProduct(idCustomer: number) {
  const now = nowUtc();

  const rows = await Credit.findAll({
    attributes: [
      'productTypeId',
      [fn('SUM', col('availableCredits')), 'available'],
    ],
    where: {
      idCustomer,
      status: 'valid',
      expirationDate: { [Op.gte]: now },
      availableCredits: { [Op.gt]: 0 },
    },
    group: ['productTypeId'],
  });

  return rows.map((r: any) => ({
    productTypeId: r.get('productTypeId'),
    available: Number(r.get('available') ?? 0),
  }));
}

// ------------------------------
// Serviço: Listar créditos do cliente (com filtros opcionais)
// ------------------------------
export async function listCustomerCredits(filter: ListCreditsFilter) {
  const where: WhereOptions = { idCustomer: filter.idCustomer };

  if (filter.productTypeId) (where as any).productTypeId = filter.productTypeId;
  if (filter.status) (where as any).status = filter.status;

  const options: FindOptions = {
    where,
    order: [
      ['status', 'ASC'],
      ['expirationDate', 'ASC'],
      ['id', 'ASC'],
    ],
  };

  return Credit.findAll(options);
}

// ------------------------------
// Serviço: Checar disponibilidade antes de reservar/consumir
// ------------------------------
export async function checkAvailability(input: ConsumeInput): Promise<boolean> {
  const { idCustomer, productTypeId, quantity } = input;
  if (quantity <= 0) return true;

  const now = nowUtc();

  const row = await Credit.findOne({
    attributes: [[fn('SUM', col('availableCredits')), 'available']],
    where: {
      idCustomer,
      productTypeId,
      status: 'valid',
      expirationDate: { [Op.gte]: now },
      availableCredits: { [Op.gt]: 0 },
    },
    raw: true,
  });

  const available = Number((row as any)?.available ?? 0);
  return available >= quantity;
}

export async function removeCreditsForBatch(
  creditBatch: string,
  opts?: { strict?: boolean }
) {
  return sequelize.transaction(async (t: Transaction) => {
    const lots = await Credit.findAll({
      where: { creditBatch },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!lots.length) {
      return { success: true, message: 'Nenhum crédito encontrado para este batch.', deleted: 0, zeroed: 0, withUsage: 0 };
    }

    let deleted = 0;
    let zeroed = 0;
    let withUsage = 0;

    for (const lot of lots) {
      if (lot.usedCredits > 0) {
        withUsage++;

        if (opts?.strict) {
          throw new Error(`Cancelamento bloqueado: lote ${lot.id} já possui consumo (usedCredits=${lot.usedCredits}).`);
        }

        if (lot.availableCredits > 0) {
          lot.availableCredits = 0;
          lot.status = 'used';
          await lot.save({ transaction: t });
          zeroed++;
        }
        // se available já era 0, apenas contabiliza withUsage
      } else {
        await lot.destroy({ transaction: t });
        deleted++;
      }
    }

    const message =
      deleted && zeroed
        ? `Lotes removidos: ${deleted}; lotes com saldo zerado (consumo prévio): ${zeroed}.`
        : deleted
        ? `Lotes removidos: ${deleted}.`
        : zeroed
        ? `Lotes com saldo zerado (consumo prévio): ${zeroed}.`
        : 'Nenhuma alteração necessária.';

    return { success: true, message, deleted, zeroed, withUsage };
  });
}


// ------------------------------
// (Opcional) Reverter consumo
// Aviso: para reversão fiel por lote, é recomendado manter um LEDGER
// que registre de qual lote saiu cada crédito (por refId).
// Abaixo um stub que apenas informa a limitação.
// ------------------------------
export async function revertConsumption(_input: RevertConsumptionInput) {
  // Implementação correta depende de um CreditLedger que diga:
  // - para a refId X, em quais lotes e quantidades consumimos;
  // então reverte em ordem inversa (LIFO do consumo real).
  throw new Error('revertConsumption requer ledger de consumo para reconstituir os lotes.');
}
