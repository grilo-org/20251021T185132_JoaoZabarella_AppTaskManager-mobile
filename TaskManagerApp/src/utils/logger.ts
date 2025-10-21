

const isDev = __DEV__;

export const log = {
  debug: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`🔍 [DEBUG] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (isDev) {
      console.info(`ℹ️ [INFO] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (isDev) {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
  },
  
  error: (message: string, ...args: any[]) => {
    
    console.error(`❌ [ERROR] ${message}`, ...args);
  },
  
  success: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`✅ [SUCCESS] ${message}`, ...args);
    }
  },
  
  
  api: (method: string, url: string, data?: any) => {
    if (isDev) {
      console.log(`🌐 [API] ${method} ${url}`, data || '');
    }
  },
  
  
  time: (label: string) => {
    if (isDev) {
      console.time(`⏱️ [TIME] ${label}`);
    }
  },
  
  timeEnd: (label: string) => {
    if (isDev) {
      console.timeEnd(`⏱️ [TIME] ${label}`);
    }
  },
  

  group: (label: string) => {
    if (isDev) {
      console.group(`📁 ${label}`);
    }
  },
  
  groupEnd: () => {
    if (isDev) {
      console.groupEnd();
    }
  },
  

  table: (data: any) => {
    if (isDev) {
      console.table(data);
    }
  }
};


if (!isDev) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.debug = () => {};
 
}


export const logPretty = (label: string, obj: any) => {
  if (isDev) {
    console.log(`📋 [${label}]`, JSON.stringify(obj, null, 2));
  }
};


export const logState = (componentName: string, state: any) => {
  if (isDev) {
    console.log(`🔄 [STATE: ${componentName}]`, state);
  }
};


export const logRender = (componentName: string) => {
  if (isDev) {
    console.log(`🎨 [RENDER] ${componentName} rendered at ${new Date().toISOString()}`);
  }
};


export const logAction = (action: string, details?: any) => {
  if (isDev) {
    console.log(`👤 [ACTION] ${action}`, details || '');
  }
};