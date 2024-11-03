// src/types/express/index.d.ts
import { Request } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: number;
      [key: string]: any; // Outras propriedades, se houver
    };
  }
}