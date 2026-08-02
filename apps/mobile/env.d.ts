declare const __DEV__: boolean;

namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_SOCKET_URL?: string;
    NODE_ENV?: 'development' | 'production' | 'test';
  }
}
