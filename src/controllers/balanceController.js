const Balance = require('../models/balance.model.js'); // Importando o modelo de saldo

exports.updateCustomerBalance = async (idCustomer, transactionAmount, add) => {
  const existingBalance = await Balance.findByPk(idCustomer);
  if (existingBalance) {
      // Ajusta o saldo baseado no tipo de operação
      if (add) {
          existingBalance.balance += transactionAmount;
      } else {
          existingBalance.balance -= transactionAmount;
      }
      existingBalance.lastUpdated = new Date();  // Atualiza a data de última modificação
      await existingBalance.save();

      if (!existingBalance) {
        console.error('Falha ao salvar saldo:', transaction.message);
        
        return {
            success: false,
            message: 'Falha ao salvar saldo:',
        }

        } else {

            return {
                success: true,
                message: 'Saldo salvo com sucesso',
            };
        }
  } else {
      // Se adicionar um balance negativo, assuma que é uma operação de subtração inicial
      const initialBalance = add ? transactionAmount : -transactionAmount;
      await Balance.create({
          idCustomer: idCustomer,
          balance: initialBalance,
          lastUpdated: new Date()
      });

      if (!initialBalance) {
        console.error('Falha ao salvar saldo:', transaction.message);
        
        return {
            success: false,
            message: 'Falha ao salvar saldo:',
        }

        } else {

            return {
                success: true,
                message: 'Saldo salvo com sucesso',
            };
        }
  }
}
  