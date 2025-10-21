

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from './config';

const log = (...args: any[]) => {
  if (__DEV__) {
    console.log(...args);
  }
};

const errorLog = (...args: any[]) => {
  if (__DEV__) {
    console.error(...args);
  }
};

const axiosInstance = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@TaskManager:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    log('Resposta:', response.status);
    return response;
  },
  (error) => {
    errorLog('Erro:', error.message);

    if (error.response) {
      switch (error.response.status) {
        case 401:
          error.message = 'Não autorizado. Faça login novamente.';
          break;
        case 403:
          error.message = 'Acesso negado.';
          break;
        case 404:
          error.message = 'Recurso não encontrado.';
          break;
        case 500:
          error.message = 'Erro interno do servidor.';
          break;
        default:
          error.message = 'Erro desconhecido. Tente novamente.';
      }
    } else if (error.request) {
      error.message = 'Erro de conexão. Verifique sua internet.';
    }

    return Promise.reject(error);
  }
);


interface LoginRequest {
  email: string;
  senha: string;
}

interface LoginResponse {
  token: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  novaSenha: string;
  confirmaSenha: string;
}

interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  confirmaSenha: string;
}

interface UserResponse {
  id: number;
  nome: string;
  email: string;
  dataCriacao: string;
  ativo: boolean;
  roles: string[];
  statusEmoji?: string;
}

interface UpdateUserRequest {
  nome?: string;
  email?: string;
}

interface ChangePasswordRequest {
  senhaAtual: string;
  novaSenha: string;
  confirmaSenha: string;
}

interface FilterTasksOptions {
  statusId: number | null;
  prioridadeId: number | null;
  categoriaId: number | null;
}

interface BulkTaskRequest {
  tarefasId: number[];
}

interface CreateTaskRequest {
  titulo: string;
  descricao?: string;
  statusId: number;
  prioridadeId: number;
  prazo?: string | null;
  categoriaId?: number | null;
}

interface UpdateTaskRequest {
  id: number;
  titulo?: string;
  descricao?: string;
  statusId?: number;
  prioridadeId?: number;
  prazo?: string | null;
  categoriaId?: number | null;
}

interface CreateCategoryRequest {
  nome: string;
}

interface UpdateCategoryRequest {
  nome?: string;
}


const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await axiosInstance.post<LoginResponse>('/auth/login', credentials);
      await AsyncStorage.setItem('@TaskManager:token', response.data.token);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Credenciais inválidas. Verifique seu email e senha.');
      }
      throw new Error('Erro ao fazer login. Tente novamente mais tarde.');
    }
  },

  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('@TaskManager:token');
      delete axiosInstance.defaults.headers.common['Authorization'];
      log('Logout realizado com sucesso');
    } catch (error) {
      errorLog('Erro ao fazer logout:', error);
      throw error;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('@TaskManager:token');
      if (!token) return false;
      const isTokenValid = await this.refreshToken();
      return isTokenValid;
    } catch (error) {
      errorLog('Erro ao verificar autenticação:', error);
      return false;
    }
  },

  async refreshToken(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('@TaskManager:token');
      if (token) {
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return true;
      }
      return false;
    } catch (error) {
      errorLog('Erro ao renovar token:', error);
      return false;
    }
  }
};


const userService = {
  async registerUser(userData: RegisterRequest): Promise<UserResponse> {
    if (!userData.nome || !userData.email || !userData.senha || !userData.confirmaSenha) {
      throw new Error('Todos os campos são obrigatórios.');
    }

    if (userData.senha !== userData.confirmaSenha) {
      throw new Error('As senhas não coincidem.');
    }

    try {
      const response = await axiosInstance.post<UserResponse>('/usuario', userData);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error('Erro nos dados enviados. Verifique e tente novamente.');
      }
      throw error;
    }
  },

  async getProfile(): Promise<UserResponse> {
    try {
      const response = await axiosInstance.get<UserResponse>('/usuario/me');
      return response.data;
    } catch (error) {
      errorLog('Erro ao buscar perfil:', error);
      throw error;
    }
  },

  async updateProfile(userData: UpdateUserRequest): Promise<UserResponse> {
    try {
      const response = await axiosInstance.put<UserResponse>('/usuario/me', userData);
      return response.data;
    } catch (error) {
      errorLog('Erro ao atualizar perfil:', error);
      throw error;
    }
  },

  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    try {
      await axiosInstance.put('/usuario/me/alterar-senha', passwordData);
      log('Senha alterada com sucesso');
    } catch (error) {
      errorLog('Erro ao alterar senha:', error);
      throw error;
    }
  },

  async deactivateAccount(): Promise<void> {
    try {
      await axiosInstance.delete('/usuario/me');
      await AsyncStorage.removeItem('@TaskManager:token');
      log('Conta desativada com sucesso');
    } catch (error) {
      errorLog('Erro ao desativar conta:', error);
      throw error;
    }
  }
};


const taskService = {
  
  async getTasks(page = 0, size = 99) {
    try {
      const response = await axiosInstance.get(`/tarefas/paginado?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      errorLog('Erro ao buscar tarefas:', error);
      throw error;
    }
  },
  
  
  async createTask(taskData: CreateTaskRequest) {
    try {
      const response = await axiosInstance.post('/tarefas', taskData);
      return response.data;
    } catch (error) {
      errorLog('Erro ao criar tarefa:', error);
      throw error;
    }
  },

  
  async getTaskStats() {
    try {
      const response = await axiosInstance.get('/tarefas/estatisticas');
      return response.data;
    } catch (error) {
      errorLog('Erro ao buscar estatísticas das tarefas:', error);
      throw error;
    }
  },

  
  async getTaskById(taskId: number) {
    try {
      const response = await axiosInstance.get(`/tarefas/${taskId}`);
      return response.data;
    } catch (error) {
      errorLog('Erro ao buscar tarefa por ID:', error);
      throw error;
    }
  },

 
  async updateTask(taskData: UpdateTaskRequest) {
    try {
      const response = await axiosInstance.put(`/tarefas/${taskData.id}`, taskData);
      return response.data;
    } catch (error) {
      errorLog('Erro ao atualizar tarefa:', error);
      throw error;
    }
  },
  
 
  async filterTasks(filterOptions: FilterTasksOptions, page = 0, size = 10) {
    const { statusId, prioridadeId, categoriaId } = filterOptions;
    let url = `/tarefas/filtrar?page=${page}&size=${size}`;
    
    if (statusId !== null) url += `&statusId=${statusId}`;
    if (prioridadeId !== null) url += `&prioridadeId=${prioridadeId}`;
    if (categoriaId !== null) url += `&categoriaId=${categoriaId}`;
    
    try {
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      errorLog('Erro ao filtrar tarefas:', error);
      throw error;
    }
  },
  
  async searchTasks(query: string, page = 0, size = 10) {
    try {
      const response = await axiosInstance.get(`/tarefas/filtrar/palavra?palavraChave=${query}&page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      errorLog('Erro ao buscar tarefas por palavra-chave:', error);
      throw error;
    }
  },
  
 
  async completeTask(taskId: number) {
    try {
      const response = await axiosInstance.patch(`/tarefas/concluir/${taskId}`);
      return response.data;
    } catch (error) {
      errorLog('Erro ao concluir tarefa:', error);
      throw error;
    }
  },

  
  async completeMultipleTasks(data: BulkTaskRequest) {
    try {
      const response = await axiosInstance.patch('/tarefas/concluir', data);
      return response.data;
    } catch (error) {
      errorLog('Erro ao concluir múltiplas tarefas:', error);
      throw error;
    }
  },
  

  async reopenTask(taskId: number) {
    try {
      const response = await axiosInstance.patch(`/tarefas/reabrir/${taskId}`);
      return response.data;
    } catch (error) {
      errorLog('Erro ao reabrir tarefa:', error);
      throw error;
    }
  },


  async reopenMultipleTasks(data: BulkTaskRequest) {
    try {
      const response = await axiosInstance.patch('/tarefas/reabrir', data);
      return response.data;
    } catch (error) {
      errorLog('Erro ao reabrir múltiplas tarefas:', error);
      throw error;
    }
  },
  

  

  async archiveTask(taskId: number) {
    try {
      await axiosInstance.delete(`/tarefas/arquivar/${taskId}`);
      log(`Tarefa ${taskId} arquivada com sucesso`);
    } catch (error) {
      errorLog('Erro ao arquivar tarefa:', error);
      throw error;
    }
  },


  async arquivarMultiplasTarefas(data: BulkTaskRequest) {
    try {
      await axiosInstance.patch('/tarefas/arquivar', data);
      log(`${data.tarefasId.length} tarefas arquivadas com sucesso`);
    } catch (error) {
      errorLog('Erro ao arquivar múltiplas tarefas:', error);
      throw error;
    }
  },


  async getArchivedTasks(page = 0, size = 99) {
    try {
      const response = await axiosInstance.get(`/tarefas/arquivadas?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      errorLog('Erro ao buscar tarefas arquivadas:', error);
      throw error;
    }
  },


  async restoreTask(taskId: number) {
    try {
      const response = await axiosInstance.patch(`/tarefas/restaurar/${taskId}`);
      return response.data;
    } catch (error) {
      errorLog('Erro ao restaurar tarefa:', error);
      throw error;
    }
  },

  
  async restoreMultipleTasks(data: BulkTaskRequest) {
    try {
      const response = await axiosInstance.patch('/tarefas/restaurar', data);
      return response.data;
    } catch (error) {
      errorLog('Erro ao restaurar múltiplas tarefas:', error);
      throw error;
    }
  },

  
  
 
  async deletarTarefa(taskId: number) {
    try {
      await axiosInstance.delete(`/tarefas/deletar/${taskId}`);
      log(`Tarefa ${taskId} excluída permanentemente`);
    } catch (error) {
      errorLog('Erro ao excluir tarefa:', error);
      throw error;
    }
  },

  
  async excluirMultiplasTarefas(data: BulkTaskRequest) {
    try {
      await axiosInstance.delete('/tarefas/deletar/multiplas', {
        data: data
      });
      log(`${data.tarefasId.length} tarefas excluídas permanentemente`);
    } catch (error) {
      errorLog('Erro ao excluir múltiplas tarefas:', error);
      throw error;
    }
  },

  
  async deleteTask(taskId: number) {
    console.warn('deleteTask está deprecated, use deletarTarefa');
    return this.deletarTarefa(taskId);
  },

  async deleteBulkTasks(taskIds: number[]) {
    console.warn('deleteBulkTasks está deprecated, use excluirMultiplasTarefas');
    return this.excluirMultiplasTarefas({ tarefasId: taskIds });
  }
};


const categoryService = {

  async getCategories() {
    try {
      const response = await axiosInstance.get('/categorias');
      return response.data;
    } catch (error) {
      errorLog('Erro ao buscar categorias:', error);
      throw error;
    }
  },
  
  
  async createCategory(categoryData: CreateCategoryRequest) {
    try {
      const response = await axiosInstance.post('/categorias', categoryData);
      return response.data;
    } catch (error) {
      errorLog('Erro ao criar categoria:', error);
      throw error;
    }
  },
  
 
  async updateCategory(categoryId: number, categoryData: UpdateCategoryRequest) {
    try {
      const response = await axiosInstance.put(`/categorias/${categoryId}`, categoryData);
      return response.data;
    } catch (error) {
      errorLog('Erro ao atualizar categoria:', error);
      throw error;
    }
  },
  
 
  async deleteCategory(categoryId: number) {
    try {
      await axiosInstance.delete(`/categorias/${categoryId}`);
      log(`Categoria ${categoryId} excluída com sucesso`);
    } catch (error) {
      errorLog('Erro ao excluir categoria:', error);
      throw error;
    }
  }
};


export default {
  api: axiosInstance,
  auth: authService,
  user: userService,
  task: taskService,
  category: categoryService
};


export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserResponse,
  UpdateUserRequest,
  ChangePasswordRequest,
  FilterTasksOptions,
  BulkTaskRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest
};