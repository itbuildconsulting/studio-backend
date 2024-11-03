import jwt from 'jsonwebtoken';

interface ResetTokenPayload {
  id: number;
  email: string;
}

const generateResetToken = (person: ResetTokenPayload): string => {
  const token = jwt.sign(
    {
      id: person.id,
      email: person.email,
    },
    '6a78e7df-0a0d-4a3f-897f-de1ae0f5b9c3', // Chave secreta
    {
      expiresIn: '1h', // O token de redefinição expira em 1 hora
    }
  );
  return token;
};

export default generateResetToken;
