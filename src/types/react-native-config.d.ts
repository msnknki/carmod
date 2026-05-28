declare module 'react-native-config' {
  export interface NativeConfig {
    API_BASE_URL?: string;
    USE_LOCAL_API?: string;
  }

  const Config: NativeConfig;
  export default Config;
}
