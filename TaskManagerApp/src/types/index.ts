
export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
}

export interface User {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
}