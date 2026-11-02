export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}