import { consumeCredits } from "../services/credits.service";
import { purchaseCredits } from "../services/credits.service";

// compat: mesma assinatura antiga
export async function updateCustomerBalance(
  idCustomer: number,
  quantity: number,
  transactionId: string,
  add: boolean,
  productTypeId: number
) {
  if (add) {
    return purchaseCredits({ idCustomer, productTypeId, quantity, transactionId, origin: 'Compra' });
  }
  // débito usa consumeCredits
  return consumeCredits({ idCustomer, productTypeId, quantity });
}
