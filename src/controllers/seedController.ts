import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
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
import ContractSignature from '../models/ContractSignature';
import ContractVersion from '../models/ContractVersion';
import ParQ from '../models/ParQ.model';

// Definir funções do controlador
export const seedController = {
    // Sincronizar tabelas
    async post(_req: Request, res: Response, _next: NextFunction): Promise<Response | void> {
        try {
            await Place.sync(); //OK
            await ProductType.sync(); //OK
            await Person.sync(); //OK
            await Product.sync(); //OK
            await Balance.sync(); //OK           
            await Class.sync(); //OK
            await Bike.sync(); //OK
            await ClassStudent.sync();//OK
            await Transactions.sync(); //OK
            await Item.sync(); //OK
            await Level.sync(); //OK
            await Credit.sync(); //OK
            await Config.sync(); //OK
            await WaitingList.sync(); //OK
            await NotificationToken.sync(); //OK
            await OtpCode.sync(); //OK
            await ContractSignature.sync();//OK
            await ContractVersion.sync()//OK
            await ParQ.sync() //OK

            //await sequelize.sync({ alter: true });
            
            return res.status(201).send('Todas as tabelas sincronizadas com o banco de dados');
        } catch (err) {
            console.error('Erro ao sincronizar tabelas:', err);
            return res.status(400).send('Erro ao sincronizar tabelas: ' + err);
        }
    },

    // Adicionar dados iniciais
    async addFirstData(_req: Request, res: Response, _next: NextFunction): Promise<Response | void> {
        const passwordHash = await bcrypt.hash('C2rio@2021', 10);
        try {
            const person = await Person.create({
                name: "Richard Salles",
                identity: "05552131703",
                email: "richard.danielcs@gmail.com",
                phone: "21969167953",
                birthday: new Date("1994-03-28"),
                active: 1,
                address: "Avenida José Cortes Junior",
                zipCode: "24340300",
                city: "Niteroi",
                state: "RJ",
                country: "BR",
                height: 160,
                weight: 100,
                other: "41",
                password: passwordHash,
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
