
import { LoggingConfig } from '../config/logging';

export const sanitizeForLogging = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };
  const sensitiveKeys = LoggingConfig.SENSITIVE_FIELDS;

  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    )) {
  
      if (key.toLowerCase() === 'email' && !LoggingConfig.MASK_EMAIL) {
        
        continue;
      } else if (key.toLowerCase() === 'token') {
     
        const value = sanitized[key];
        if (typeof value === 'string' && value.length > 10) {
          sanitized[key] = `${value.substring(0, 10)}...***REDACTED***`;
        } else {
          sanitized[key] = '***REDACTED***';
        }
      } else {
       
        sanitized[key] = '***REDACTED***';
      }
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }


  if (sanitized.headers && sanitized.headers.Authorization) {
    sanitized.headers.Authorization = '***REDACTED***';
  }

  return sanitized;
};

export const secureLog = (message: string, data?: any) => {
  if (!__DEV__) return; 
  
  console.log(message, data ? sanitizeForLogging(data) : '');
};

 
export const secureError = (message: string, error: any) => {
  if (!__DEV__) return;
  
  const sanitizedError = {
    message: error.message,
    stack: error.stack,
    response: error.response ? sanitizeForLogging(error.response) : undefined,
    request: error.request ? sanitizeForLogging(error.request) : undefined,
  };
  
  console.error(message, sanitizedError);
};


export const secureAuthLog = (action: string) => {
  if (!__DEV__) return;
  
  console.log(`[AUTH] ${action} - Details hidden for security`);
};