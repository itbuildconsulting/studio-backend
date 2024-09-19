const Person = require('../models/person.model.js');
const Product = require('../models/product.model.js');
const validateToken = require('../core/token/authenticateToken.js');
const paymentController = require('./paymentController');
const { saveTransaction } = require('./transactionController.js');

const {updateCustomerBalance} = require('./balanceController.js');

const itemsController = require('./itemsController.js')


// READ
module.exports.checkout = async (req, res, next) => {
  try {
      validateToken(req, res, async () => {
          const { personId, products, payment } = req.body;

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
                  creditTotal = creditTotal + product.credit;
                  return {
                      itemId: product.id,
                      amount: product.value * parseInt(item.quantity),  // Multiplica o preço pelo quantidade
                      credit: product.credit,
                      description: product.name,
                      quantity: parseInt(item.quantity),  // Certifica-se que a quantidade é um número inteiro
                      code: product.id,
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
                    line_2: "Casa",  // Assumindo que line_2 não está disponível
                    zip_code: personData.zipCode,
                    city: personData.city,
                    state: personData.state,
                    country: personData.country
                  },
                  "phones": {
                    "mobile_phone": {
                      "country_code": "55",
                      "area_code": "21",
                      number: personData.phone
                    }
                  }
                },
                "items": items,
                "payments": [
                  {
                    "payment_method": "credit_card",
                    "credit_card": {
                      "installments": 1,
                      "statement_descriptor": "AVENGERS",
                      "card": {
                        number: payment.number,
                        holder_name: payment.holder_name,
                        exp_month: payment.exp_month,
                        exp_year: payment.exp_year,
                        cvv: payment.cvv,
                        "billing_address": {
                            line_1: personData.address,
                            "line_2": "Casa",
                            zip_code: personData.zipCode,
                            city: personData.city,
                            state: personData.state,
                            country: personData.country
                        }
                      }
                    }
                  }
                ]
              }

              //res.status(200).json(checkout);

              // Chamar o paymentController para processar a transação

              const result = await createTransaction(checkout);
              if (!result.success) {
                  console.error('Falha ao criar transação:', result.message);
                  res.status(500).json({ success: false, error: 'Falha ao criar transação:', details: result.message});
              } else {
                  console.log('Transação criada com sucesso:', result.data);
                  const save = await saveTransaction(result.data, creditTotal);
                  if (save.success) {
                      // Supondo que `amount` deve ser adicionado ao saldo
                      const updateBalanceResult = await updateCustomerBalance(personData.id, creditTotal, true);

                      itemsController.createItemsAfterTransaction(result.data.id, items)
                        .then(result => console.log(result.message))
                        .catch(error => console.error("Falha ao criar itens:", error));


                      if (updateBalanceResult.success) {
                          res.status(200).json({ success: true, message: 'Transação concluída e saldo atualizado com sucesso', details: result.data});
                      } else {
                          res.status(500).json({ success: false, error: 'Transação bem-sucedida, mas falha ao atualizar saldo', details: updateBalanceResult.message});
                      }
                  } else {
                      res.status(500).json({ success: false, error: 'Falha ao salvar transação', details: save.message});
                  }
              }
              

          } catch (fetchError) {
              console.error('Erro ao buscar pessoa ou produtos:', fetchError);
              res.status(500).json({ success: false, error: 'Erro ao buscar pessoa ou produtos' });
          }
      });
  } catch (error) {
      console.error('Erro ao validar token:', error);
      res.status(401).send('Token inválido');
  }
};


async function createTransaction(checkout) {
  

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

  } catch (error) {
      console.error('Erro na API Pagar.me:', error);
      // Retornando erro com detalhes adicionais se disponíveis
      return {
          success: false,
          message: error.message || 'Erro interno no servidor',
          data: error.response ? await error.response.json() : null
      };
  }
}