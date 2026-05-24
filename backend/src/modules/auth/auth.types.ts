export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  plan?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RefreshDTO {
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  plan: string;
  password_hash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}
