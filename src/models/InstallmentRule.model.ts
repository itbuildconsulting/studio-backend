import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

// Interface que descreve os atributos de uma regra de parcelamento
interface InstallmentRuleAttributes {
  id: number;
  min_amount: number;
  max_amount: number;
  max_installments: number;
  interest_free_installments: number;
  description: string;
  is_active: boolean;
}

// Interface para criação (sem o campo `id`)
interface InstallmentRuleCreationAttributes extends Omit<InstallmentRuleAttributes, 'id'> {}

class InstallmentRule extends Model<InstallmentRuleAttributes, InstallmentRuleCreationAttributes> implements InstallmentRuleAttributes {
  public id!: number;
  public min_amount!: number;
  public max_amount!: number;
  public max_installments!: number;
  public interest_free_installments!: number;
  public description!: string;
  public is_active!: boolean;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Criando o modelo InstallmentRule
InstallmentRule.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    min_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    max_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    max_installments: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    interest_free_installments: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'installment_rules',
    timestamps: true, // Cria createdAt e updatedAt automaticamente
  }
);

// Criar tabela se não existir e popular com dados iniciais
// Descomentar apenas na primeira vez:

/*InstallmentRule.sync({ alter: true }).then(async () => {
  const count = await InstallmentRule.count();
  
  if (count === 0) {
    await InstallmentRule.bulkCreate([
      {
        min_amount: 0,
        max_amount: 10000,
        max_installments: 1,
        interest_free_installments: 1,
        description: 'Até R$ 100 - À vista',
        is_active: true,
      },
      {
        min_amount: 10001,
        max_amount: 30000,
        max_installments: 2,
        interest_free_installments: 2,
        description: 'R$ 100 a R$ 300 - Até 2x sem juros',
        is_active: true,
      },
      {
        min_amount: 30001,
        max_amount: 50000,
        max_installments: 4,
        interest_free_installments: 4,
        description: 'R$ 300 a R$ 500 - Até 4x sem juros',
        is_active: true,
      },
      {
        min_amount: 50001,
        max_amount: 100000,
        max_installments: 6,
        interest_free_installments: 6,
        description: 'R$ 500 a R$ 1.000 - Até 6x sem juros',
        is_active: true,
      },
      {
        min_amount: 100001,
        max_amount: 999999999,
        max_installments: 12,
        interest_free_installments: 3,
        description: 'Acima de R$ 1.000 - Até 12x (3x sem juros)',
        is_active: true,
      },
    ]);
    console.log('✅ Regras de parcelamento criadas com sucesso!');
  }
});*/


export default InstallmentRule;