import jwt from 'jsonwebtoken';

interface PersonPayload {
  id: number;
  name: string;
  employee_level: string | undefined; // Usamos employee_level ao invés de role
}

const generateAuthToken = (person: PersonPayload): string => {
  const token = jwt.sign(
    {
      id: person.id,
      name: person.name,
      employee_level: person.employee_level || 'user', // Incluímos employee_level no token
    },
    '6a78e7df-0a0d-4a3f-897f-de1ae0f5b9c3', // Chave secreta
    {
      expiresIn: '3666660h', // Expiração do token
    }
  );
  return token;
};

export default generateAuthToken;
