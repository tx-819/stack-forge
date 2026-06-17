import type { AuthAction, MenuRecord } from './permission.js';
import type { User } from './user.js';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface WechatAuthResponse extends LoginResponse {
  refreshToken?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nickname?: string | null;
  avatar?: string | null;
}

export type RegisterResponse = User;

export interface SendLoginEmailRequest {
  email: string;
}

export interface AuthBootstrap {
  user: User;
  menus: MenuRecord[];
  actions: AuthAction[];
}
