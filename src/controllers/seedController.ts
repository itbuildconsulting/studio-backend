import { Request, Response, NextFunction } from 'express';
import Place from '../models/Place.model';
import ProductType from '../models/ProductType.model';
import Person from '../models/Person.model';
import Product from '../models/Product.model';
import Balance from '../models/Balance.model';
import Bike from '../models/Bike.model';
import Class from '../models/Class.model';
import ClassStudent from '../models/ClassStudent.model';
import Item from '../models/Item.model';
import Transactions from '../models/Transaction.model';
import Level from '../models/Level.model';
import Credit from '../models/Credit.model';
import Config from '../models/Config.model';
import WaitingList from '../models/WaitingList.model';
import sequelize from '../config/database';
import NotificationToken from '../models/NotificationToken.model';
import OtpCode from '../models/OtpCode';

// Definir funções do controlador
export const seedController = {
    // Sincronizar tabelas
    async post(_req: Request, res: Response, _next: NextFunction): Promise<Response | void> {
        try {
            await Place.sync();
            await ProductType.sync();
            await Person.sync();
            await Product.sync();
            await Balance.sync();            
            await Class.sync();
            await Bike.sync();
            await ClassStudent.sync();            
            await Transactions.sync();
            await Item.sync();
            await Level.sync();
            await Credit.sync(); 
            await Config.sync(); 
            await WaitingList.sync();
            await NotificationToken.sync();
            await OtpCode.sync();

            //await sequelize.sync({ alter: true });
            
            return res.status(201).send('Todas as tabelas sincronizadas com o banco de dados');
        } catch (err) {
            console.error('Erro ao sincronizar tabelas:', err);
            return res.status(400).send('Erro ao sincronizar tabelas: ' + err);
        }
    },

    // Adicionar dados iniciais
    async addFirstData(_req: Request, res: Response, _next: NextFunction): Promise<Response | void> {
        try {
            const person = await Person.create({
                name: "admin",
                identity: "000000000",
                email: "admin@example.com",
                phone: "00000000",
                birthday: new Date("1994-05-17"),
                active: 1,
                address: "7221, Avenida Dra Ruth Cardoso, Pinheiro",
                zipCode: "05425070",
                city: "São Paulo",
                state: "SP",
                country: "BR",
                height: 160,
                weight: 100,
                other: "41",
                password: "testing",
                rule: "",
                frequency: "",
                employee: 1,
                employee_level: '1',
            });

            return res.status(201).send('Usuário criado com sucesso' + person);
        } catch (err) {
            console.error('Erro ao adicionar dados iniciais:', err);
            return res.status(400).send('Erro ao adicionar dados iniciais: ' + err);
        }
    }
};

export default seedController;
