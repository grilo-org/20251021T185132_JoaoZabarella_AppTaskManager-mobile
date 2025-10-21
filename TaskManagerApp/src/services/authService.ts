import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from './config';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
}

export default {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('=== INICIANDO LOGIN ===');
      console.log('URL Base:', api.api.defaults.baseURL);
      console.log('Email:', credentials.email);
      
      
      await AsyncStorage.removeItem(config.TOKEN_KEY);
      delete api.api.defaults.headers.common['Authorization'];
      
      const response = await api.api.post<LoginResponse>('/auth/login', credentials);
      
      console.log('Login bem sucedido!');
      
      await AsyncStorage.setItem(config.TOKEN_KEY, response.data.token);
      api.api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      return response.data;
    } catch (error: any) {
      console.error('=== ERRO NO LOGIN ===', error);
      
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Email ou senha incorretos. Verifique suas credenciais.');
          case 403:
            throw new Error('Acesso negado. Sua conta pode estar desativada.');
          case 404:
            throw new Error('Serviço de autenticação não encontrado. Verifique a conexão.');
          case 500:
            throw new Error('Erro no servidor. Tente novamente mais tarde.');
          default:
            throw new Error(`Erro ${error.response.status}: ${error.response.data?.message || 'Erro desconhecido'}`);
        }
      }
      
      throw new Error('Erro de conexão. Verifique sua internet.');
    }
  },

  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('@TaskManager:token');
      delete api.api.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('@TaskManager:token');
      return !!token;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  }
};