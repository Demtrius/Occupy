// Authentication Types

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  occupations: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user?: any;
}
