export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

/** Respuesta de POST /v1/refresh: solo tokens, sin usuario. */
export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}
