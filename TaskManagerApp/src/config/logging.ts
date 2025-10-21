

export const LoggingConfig = {
  
  LOG_LEVEL: __DEV__ ? 'debug' : 'error',
  

  LOG_REQUESTS: __DEV__,
  LOG_RESPONSES: __DEV__,
  LOG_ERRORS: true,
  
 
  SENSITIVE_FIELDS: [
    'senha',
    'password',
    'token',
    'confirmaSenha',
    'senhaAtual',
    'novaSenha',
    'authorization',
    'cpf',
    'creditCard',
    'cvv'
  ],
  
  
  MASK_EMAIL: false,
  MASK_PHONE: true,  
};

export const shouldLog = (level: string): boolean => {
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevel = levels.indexOf(LoggingConfig.LOG_LEVEL);
  const requestedLevel = levels.indexOf(level);
  
  return requestedLevel >= currentLevel;
};