import api from './api';
import authService from './authService';
import userService from './usuarioService';


const apiService = {
  api,
  auth: authService,
  user: userService,
};

export default apiService;