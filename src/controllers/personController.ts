import { Request, Response } from 'express';
import { Op } from 'sequelize'; // Operadores do Sequelize
import Person from '../models/Person.model';
import bcrypt from 'bcryptjs';
import OtpCode from '../models/OtpCode';
import { sendOtpFor } from '../core/email/opt';
import Level from '../models/Level.model';

// util: normalizar e-mail
const normalizeEmail = (e?: string) => String(e || '').trim().toLowerCase();

// CORREÇÃO: Adicionar validação de CPF duplicado no createPerson e createPersonInternal

export const createPerson = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      name,
      identity,
      email,
      phone,
      birthday,
      height,
      weight,
      other,
      password,
      rule,
      frequency,
      employee,
      employee_level,
      student_level,
      zipCode,
      state,
      city,
      address,
      country,
    } = req.body;

    // 1) validação básica
    const validationError = validatePersonData({ ...req.body, email, password }, false);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    // 2) normalizações
    const normalizedEmail = normalizeEmail(email);
    const document = String(identity || '').replace(/[.\-\/\s]/g, '');

    // 3) ✅ CORREÇÃO: Verificar AMBOS - e-mail E CPF
    const existingEmail = await Person.findOne({ where: { email: normalizedEmail } });
    const existingIdentity = await Person.findOne({ where: { identity: document } });

    // 3.1) Verificar se e-mail já existe
    if (existingEmail) {
      if (existingEmail.active === 1) {
        return res.status(409).json({ success: false, error: 'E-mail já registrado' });
      }
      // ainda pendente (active = 0) → reenviar OTP
      await sendOtpFor(existingEmail.id, normalizedEmail);
      return res.status(200).json({
        success: true,
        message: 'Conta pendente de verificação. Reenviamos um código para o seu e-mail.',
        id: existingEmail.id,
      });
    }

    // 3.2) ✅ NOVO: Verificar se CPF já existe
    if (existingIdentity) {
      return res.status(409).json({ 
        success: false, 
        error: 'CPF/Documento já cadastrado no sistema' 
      });
    }

    // 4) hash de senha
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    // ✅ Normalizar height e weight
    const normalizedHeight = height === '' || height === null || height === undefined 
    ? null 
    : Number(height);

    const normalizedWeight = weight === '' || weight === null || weight === undefined 
    ? null 
    : Number(weight);

    // 5) cria como pendente (active = 0)
    const newPerson = await Person.create({
      name,
      identity: document,
      email: normalizedEmail,
      phone,
      birthday,
      height: normalizedHeight,  // ✅ Usar valor normalizado
      weight: normalizedWeight,  // ✅ Usar valor normalizado
      other,
      password: passwordHash,
      rule,
      frequency,
      employee,
      employee_level,
      student_level,
      zipCode,
      state,
      city,
      address,
      country,
      active: 0,
    });

    // 6) envia OTP
    await sendOtpFor(newPerson.id, normalizedEmail);

    return res.status(201).json({
      success: true,
      message: 'Pessoa criada. Enviamos um código de verificação para seu e-mail.',
      id: newPerson.id,
    });
  } catch (error: any) {
    console.error('Erro ao criar pessoa:', error);
    return res.status(500).json({ success: false, error: 'Erro ao criar pessoa', message: error.message });
  }
};

// Cadastro INTERNO - também precisa da mesma validação
export const createPersonInternal = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      name,
      identity,
      email,
      phone,
      birthday,
      height,
      weight,
      other,
      password,
      rule,
      frequency,
      employee,
      employee_level,
      student_level,
      zipCode,
      state,
      city,
      address,
      country,
      active,
    } = req.body;

    // 1) Validação básica
    const validationError = validatePersonData({ ...req.body, email, password }, false);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    // 2) Normalizações
    const normalizedEmail = normalizeEmail(email);
    const document = String(identity || '').replace(/[.\-\/\s]/g, '');

    // 3) ✅ CORREÇÃO: Verificar AMBOS - e-mail E CPF
    const existingEmail = await Person.findOne({ where: { email: normalizedEmail } });
    const existingIdentity = await Person.findOne({ where: { identity: document } });

    // 3.1) Verificar se e-mail já existe
    if (existingEmail) {
      return res.status(409).json({ 
        success: false, 
        error: 'E-mail já registrado no sistema' 
      });
    }

    // 3.2) ✅ NOVO: Verificar se CPF já existe
    if (existingIdentity) {
      return res.status(409).json({ 
        success: false, 
        error: 'CPF/Documento já cadastrado no sistema' 
      });
    }

    // 4) Hash de senha
    if (!password || password.trim().length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Senha é obrigatória e deve ter pelo menos 6 caracteres' 
      });
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);

    // ✅ Normalizar height e weight
    const normalizedHeight = height === '' || height === null || height === undefined 
    ? null 
    : Number(height);

    const normalizedWeight = weight === '' || weight === null || weight === undefined 
    ? null 
    : Number(weight);

    // 5) Cria usuário JÁ ATIVO
    const newPerson = await Person.create({
      name,
      identity: document,
      email: normalizedEmail,
      phone,
      birthday,
      height: normalizedHeight,  // ✅ Usar valor normalizado
      weight: normalizedWeight,  // ✅ Usar valor normalizado
      other,
      password: passwordHash,
      rule,
      frequency,
      employee,
      employee_level,
      student_level,
      zipCode,
      state,
      city,
      address,
      country,
      active: active !== undefined ? active : 1,
    });

    return res.status(201).json({
      success: true,
      message: 'Pessoa criada com sucesso no sistema interno.',
      data: {
        id: newPerson.id,
        name: newPerson.name,
        email: newPerson.email,
        active: newPerson.active,
        employee: newPerson.employee,
      }
    });

  } catch (error: any) {
    console.error('Erro ao criar pessoa (interno):', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro ao criar pessoa', 
      message: error.message 
    });
  }
};

// READ ALL
export const getAllPersons = async (_req: Request, res: Response): Promise<Response> => {
    try {
        const persons = await Person.findAll();
        return res.status(200).json(persons);
    } catch (error) {
        console.error('Erro ao buscar pessoas:', error);
        return res.status(500).json({
            success: false,
            data: error,
            error: 'Erro ao buscar pessoas',
        });
    }
};

// READ BY ID
export const getPersonById = async (req: Request, res: Response): Promise<Response> => {
    try {
        const id = Number(req.params.id);
        const person = await Person.findByPk(id, {
            attributes: { exclude: ['password', 'resetToken', 'tokenVersion'] }, // ajuste a lista
        });
        if (!person) return res.status(404).send('Pessoa não encontrada');
        
        let levelInfo = null;
        if (person.student_level) {
            const level = await Level.findByPk(person.student_level);
            if (level) {
                levelInfo = {
                    id: level.id,
                    name: level.name,
                    color: level.color,
                    numberOfClasses: level.numberOfClasses,
                };
            }
        }
        
        return res.status(200).json({
            ...person.toJSON(),
            levelInfo, // ✅ Adiciona info do nível
        });
        
    } catch (error) {
        console.error('Erro ao buscar pessoa:', error);
        return res.status(500).send('Erro ao buscar pessoa');
    }
};

// FILTRAR FUNCIONÁRIOS
export const getByCriteriaEmployee = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, name, identity, page = 1, pageSize = 10, active } = req.body;

        // Critérios básicos: Apenas funcionários
        const criteria: any = { employee: true };

        if (email && email.trim() !== "") criteria.email = email;
        if (name && name.trim() !== "") criteria.name = { [Op.like]: `%${name}%` };
        if (identity && identity.trim() !== "") criteria.identity = identity;
        if (active !== undefined) criteria.active = active;

        const limit = parseInt(pageSize, 10);
        const offset = (parseInt(page, 10) - 1) * limit;

        const { count, rows } = await Person.findAndCountAll({
            where: criteria,
            attributes: { exclude: ['password', 'resetToken', 'tokenVersion'] },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });

        const totalPages = Math.ceil(count / limit);

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page, 10),
                pageSize: limit,
                totalPages,
            },
        });
    } catch (error) {
        console.error('Erro ao buscar funcionários:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao buscar funcionários'
        });
    }
};

// FILTRAR ESTUDANTES
export const getByCriteriaStudent = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, name, identity, page = 1, pageSize = 10, active } = req.body;

        // Critérios básicos: Apenas estudantes
        const criteria: any = { employee: false };

        // Adicionar filtros dinâmicos com busca parcial
        if (email && email.trim() !== "") criteria.email = { [Op.like]: `%${email}%` }; // Busca parcial por e-mail
        if (name && name.trim() !== "") criteria.name = { [Op.like]: `%${name}%` }; // Busca parcial por nome
        if (identity && identity.trim() !== "") criteria.identity = { [Op.like]: `%${identity}%` }; // Busca parcial por identidade
        if (active !== undefined) criteria.active = active; // Filtro por status ativo/inativo

        // Configurar paginação
        const limit = parseInt(pageSize, 10); // Número de registros por página
        const offset = (parseInt(page, 10) - 1) * limit; // Deslocamento

        // Busca os registros com paginação
        const { rows: students, count: totalRecords } = await Person.findAndCountAll({
            where: criteria,
            limit,
            offset,
        });

        if (!students || students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Nenhum estudante encontrado com os critérios fornecidos',
            });
        }

        return res.status(200).json({
            success: true,
            data: students,
            pagination: {
                totalRecords,
                totalPages: Math.ceil(totalRecords / limit),
                currentPage: parseInt(page, 10),
                pageSize: limit,
            },
        });
    } catch (error) {
        console.error('Erro ao buscar estudantes:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao buscar estudantes',
        });
    }
};

// DROPDOWN FUNCIONÁRIOS
export const getDropdownEmployee = async (_req: Request, res: Response): Promise<Response> => {
    try {
        const employees = await Person.findAll({
            where: { employee: true },
            attributes: ['id', 'name'], // Apenas 'id' e 'name' do funcionário
        });

        if (employees.length === 0) {
            return res.status(404).json({ message: 'Nenhum funcionário encontrado' });
        }

        return res.status(200).json(employees);
    } catch (error) {
        console.error('Erro ao buscar funcionários:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao buscar funcionários',
        });
    }
};

// DROPDOWN ESTUDANTES
export const getDropdownStudent = async (_req: Request, res: Response): Promise<Response> => {
    try {
        const students = await Person.findAll({
            where: { employee: false },
            attributes: ['id', 'name'], // Apenas 'id' e 'name' do estudante
        });

        if (students.length === 0) {
            return res.status(404).json({ message: 'Nenhum estudante encontrado' });
        }

        return res.status(200).json(students);
    } catch (error) {
        console.error('Erro ao buscar estudantes:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao buscar estudantes',
        });
    }
};

// UPDATE
export const updatePerson = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const {
            name,
            identity,
            email,
            phone,
            birthday,
            height,
            weight,
            employee_level,
            zipCode,
            state,
            city,
            address,
            country,
            active
        } = req.body;

        const person = await Person.findByPk(id);
        if (!person) {
            return res.status(404).json({ success: false, error: 'Pessoa não encontrada' });
        }

        // Validação dos dados de atualização
        const validationError = validatePersonData(req.body, true);
        if (validationError) {
            return res.status(400).json({ success: false, error: validationError });
        }

        const document = identity.replace(/[.\-\/]/g, '');

        // Atualização dos campos da pessoa
        person.name = name;
        person.identity = document;
        person.email = email;
        person.phone = phone;
        person.birthday = birthday;
        person.active = active;
        person.address = address;
        person.zipCode = zipCode;
        person.city = city;
        person.state = state;
        person.country = country;
        person.employee_level = employee_level;

        person.height = height === '' || height === null || height === undefined 
        ? null 
        : Number(height);

        person.weight = weight === '' || weight === null || weight === undefined 
        ? null 
        : Number(weight);

        // Salva as mudanças
        await person.save();

        return res.status(200).json({
            success: true,
            message: 'Pessoa atualizada com sucesso',
            data: {
                id: person.id,
                name: person.name,
                email: person.email,
                phone: person.phone,
                birthday: person.birthday,
                address: person.address,
                zipCode: person.zipCode,
                city: person.city,
                state: person.state,
                country: person.country,
                height: person.height,
                weight: person.weight,
                active: person.active,
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar pessoa:', error);
        return res.status(500).json({ success: false, error: 'Erro ao atualizar pessoa' });
    }
};

// Deletar (anonimizar) pessoa (professor ou aluno)
export const deletePerson = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;

        // Verifica se a pessoa existe
        const person = await Person.findByPk(id);
        if (!person) {
            return res.status(404).json({
                success: false,
                error: 'Pessoa não encontrada'
            });
        }

        // Anonimização dos dados sensíveis
        person.name = 'Anônimo';
        person.email = `anonimo+${person.id}@domain.com`; // Gera um email anonimo com o id do usuário
        person.identity = 'REMOVIDO'; // Ou você pode definir como '000000000'
        person.phone = undefined; // Usa undefined para apagar o telefone
        person.address = undefined; // Usa undefined para apagar o endereço
        person.zipCode = undefined; // Usa undefined para apagar o CEP
        person.city = undefined; // Usa undefined para apagar a cidade
        person.state = undefined; // Usa undefined para apagar o estado
        person.country = undefined; // Usa undefined para apagar o país
        person.height = undefined; // Remove dados não necessários
        person.weight = undefined; // Remove dados não necessários
        person.active = 0; // Marca a pessoa como inativa

        // Salva as alterações
        await person.save();

        return res.status(200).json({
            success: true,
            message: `Pessoa anonimizada com sucesso (ID: ${person.id})`
        });
    } catch (error) {
        console.error('Erro ao anonimizar pessoa:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao anonimizar pessoa'
        });
    }
};

export const validateUserExistsEmail = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, identity } = req.body;  // Recebendo email e CPF (identity)

        // Verificar se o email já está cadastrado
        const existingEmail = await Person.findOne({
            where: { email }
        });

        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'O email informado já está cadastrado.'
            });
        }

      

        // Caso nenhum dos dados existam, continuar com o cadastro
        return res.status(200).json({
            success: true,
            message: 'Email disponível para cadastro.'
        });

    } catch (error) {
        console.error('Erro ao validar email:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao validar email.'
        });
    }
};

export const validateUserExistsIdentity = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { identity } = req.body;  // Recebendo email e CPF (identity)

              // Verificar se o CPF já está cadastrado
        const existingIdentity = await Person.findOne({
            where: { identity }
        });

        if (existingIdentity) {
            return res.status(400).json({
                success: false,
                message: 'O CPF informado já está cadastrado.'
            });
        }

        // Caso nenhum dos dados existam, continuar com o cadastro
        return res.status(200).json({
            success: true,
            message: 'CPF disponível para cadastro.'
        });

    } catch (error) {
        console.error('Erro ao validar CPF:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao validar CPF.'
        });
    }
};

export const updateStudentLevel = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { student_level } = req.body;

    if (!student_level) {
      return res.status(400).json({ 
        success: false, 
        error: 'student_level é obrigatório' 
      });
    }

    const person = await Person.findByPk(id);
    if (!person) {
      return res.status(404).json({ 
        success: false, 
        error: 'Pessoa não encontrada' 
      });
    }

    // Verificar se o nível existe
    const level = await Level.findByPk(student_level);
    if (!level) {
      return res.status(404).json({ 
        success: false, 
        error: 'Nível não encontrado' 
      });
    }

    // Atualizar apenas o student_level
    person.student_level = student_level;
    await person.save();

    return res.status(200).json({
      success: true,
      message: 'Nível do aluno atualizado com sucesso',
      data: {
        id: person.id,
        name: person.name,
        student_level: person.student_level,
        level_name: level.name,
        level_color: level.color,
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar nível do aluno:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro ao atualizar nível do aluno' 
    });
  }
};



export const validatePersonData = (data: any, edit: boolean): string | null => {
    const {
        name,
        identity,
        email,
        phone,
        birthday,
        password,
        employee,
        employee_level,
        zipCode,
        state,
        city,
        address,
        country,
        active,
    } = data;

    // Nome
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return 'Nome é obrigatório e deve ser um texto válido.';
    }

    // Documento (CPF ou CNPJ)
    if (!identity || typeof identity !== 'string' || identity.trim() === '') {
        return 'Documento é obrigatório.';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return 'Email é obrigatório e deve ser válido.';
    }

    // Telefone
    /*if (!phone || typeof phone !== 'string' || phone.trim() === '') {
        return 'Telefone é obrigatório.';
    }*/

    // Data de nascimento
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // Formato esperado: YYYY-MM-DD
    if (!birthday || !dateRegex.test(birthday)) {
        return 'Data de nascimento é obrigatória e deve estar no formato YYYY-MM-DD.';
    }

    if(!edit){
    // Senha
        if (!password || typeof password !== 'string' || password.length < 6) {
            return 'Senha é obrigatória e deve ter pelo menos 6 caracteres.';
        }
    }

    

    // Funcionário e Nível de Funcionário
    if (employee !== undefined && typeof employee !== 'boolean') {
        return 'O campo employee deve ser um valor booleano.';
    }

    if (employee && (!employee_level || typeof employee_level !== 'string')) {
        return 'O campo employee_level é obrigatório para funcionários e deve ser uma string.';
    }

    // Endereço
    /*if (!zipCode || typeof zipCode !== 'string' || zipCode.trim() === '') {
        return 'CEP é obrigatório.';
    }

    if (!state || typeof state !== 'string' || state.trim() === '') {
        return 'Estado é obrigatório.';
    }

    if (!city || typeof city !== 'string' || city.trim() === '') {
        return 'Cidade é obrigatória.';
    }

    if (!address || typeof address !== 'string' || address.trim() === '') {
        return 'Endereço é obrigatório.';
    }

    if (!country || typeof country !== 'string' || country.trim() === '') {
        return 'País é obrigatório.';
    }*/

    // Ativo
    if (active !== undefined && typeof active !== 'number') {
        return 'O campo active deve ser um valor 0 / 1.';
    }

    // Se todas as validações passarem
    return null;
};
