import { Request, Response, NextFunction } from 'express';
import Place from '../models/Place.model';
import ProductType from '../models/ProductType.model';
import Person from '../models/Person.model';
import Product from '../models/Product.model';

// Definir funções do controlador
export const seedController = {
    // Sincronizar tabelas
    async post(_req: Request, res: Response, _next: NextFunction): Promise<Response | void> {
        try {
            await Place.sync();
            await ProductType.sync();
            await Person.sync();
            await Product.sync();
            
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
                employee_level: "admin"
            });

            return res.status(201).send('Usuário criado com sucesso' + person);
        } catch (err) {
            console.error('Erro ao adicionar dados iniciais:', err);
            return res.status(400).send('Erro ao adicionar dados iniciais: ' + err);
        }
    }
};

export default seedController;
