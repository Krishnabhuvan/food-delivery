export type Role = 'CUSTOMER' | 'RESTAURANT' | 'RIDER' | 'ADMIN';

export interface JwtPayload {
  id: string;
  role: Role;
  iat: number;
  exp: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}