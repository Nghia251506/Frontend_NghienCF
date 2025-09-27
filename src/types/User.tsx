export interface User{
    userName: string;
    role: string;
}

export interface LoginDto {
  userName: string;
  passWord: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    userName: string;
    role: string;
  };
}