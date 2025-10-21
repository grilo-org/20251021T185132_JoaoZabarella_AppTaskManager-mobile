export const config = {
 
  NGROK_URL: 'https://f597-2804-14c-190-8ef0-a9da-bf42-a0a9-c601.ngrok-free.app',
 
  API_BASE_URL: __DEV__ 
    ? 'https://f597-2804-14c-190-8ef0-a9da-bf42-a0a9-c601.ngrok-free.app' 
    : 'https://api.taskmanager.com',
  

  TOKEN_KEY: '@TaskManager:token',
  USER_KEY: '@TaskManager:user',
  

  REQUEST_TIMEOUT: 30000,
  

  API_VERSION: 'v1',
};

export function getApiUrl() {
  return config.API_BASE_URL;
}