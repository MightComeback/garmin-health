import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_SYNC_URL = 'http://127.0.0.1:17890';
const SYNC_URL_KEY = '@garmin_sync_url';

let cachedUrl: string | null = null;

export async function getSyncUrl(): Promise<string> {
  if (cachedUrl) return cachedUrl;
  
  try {
    const url = await AsyncStorage.getItem(SYNC_URL_KEY);
    cachedUrl = url || DEFAULT_SYNC_URL;
    return cachedUrl;
  } catch {
    return DEFAULT_SYNC_URL;
  }
}

export function clearSyncUrlCache(): void {
  cachedUrl = null;
}

export { DEFAULT_SYNC_URL, SYNC_URL_KEY };
