export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
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
