import { spawn } from 'child_process';
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';

const GARMIN_BASE_URL = 'https://connect.garmin.com';
const GARMIN_PROXY_URL = 'https://sso.garmin.com';

// OAuth endpoints
const AUTH_URL = `${GARMIN_PROXY_URL}/cssls/oauth/authorization?response_type=code&client_id=3541974&scope=activity:read-all+activity:read-write+digital_wellness:read-all+social:read&redirect_uri=https%3A%2F%2Fconnect.garmin.com%2Fmodern&state=${uuidv4()}`;
const TOKEN_URL = `${GARMIN_PROXY_URL}/cssls/oauth/token`;
const REFRESH_URL = `${GARMIN_PROXY_URL}/cssls/oauth/refresh`;

// API endpoints
const ACTIVITY_URL = `${GARMIN_BASE_URL}/modern/proxy/activity-service/activity`;
const WELLNESS_URL = `${GARMIN_BASE_URL}/modern/proxy/wellness-service/wellness-daily-summary`;

// Secure storage keys
const STORAGE_KEYS = {
  AUTH_CODE: '@garmin_auth_code',
  ACCESS_TOKEN: '@garmin_access_token',
  REFRESH_TOKEN: '@garmin_refresh_token',
  EXPIRES_AT: '@garmin_expires_at',
};

// Get user data directory
const getUserDataDir = (): string => {
  const home = os.homedir();
  const userDataDir = `${home}/.garmin-health`;
  if (!existsSync(userDataDir)) {
    import('fs').then(fs => fs.mkdirSync(userDataDir, { recursive: true }));
  }
  return userDataDir;
};

const getStoragePath = (key: string): string => {
  return `${getUserDataDir()}/${key.replace('@', '')}`;
};

export interface GarminAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
}

export interface Activity {
  summary: {
    totalCalories: number;
    activeCalories: number;
    timeInZone: any[];
  };
  startDateLocal: string;
  duration: number;
  startTimeInSeconds: number;
  [key: string]: any;
}

export interface WellnessData {
  restingHeartRate: number | null;
  bodyBattery: number | null;
  sleep: {
    duration: number;
    stages: any[];
  };
  [key: string]: any;
}

export interface GarminActivitiesResponse {
  activities: Activity[];
  totalResults: number;
}

export class GarminService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number | null = null;

  async init() {
    // Load tokens from file
    this.accessToken = await readFile(getStoragePath(STORAGE_KEYS.ACCESS_TOKEN), 'utf8').catch(() => null);
    this.refreshToken = await readFile(getStoragePath(STORAGE_KEYS.REFRESH_TOKEN), 'utf8').catch(() => null);
    const expiresAt = await readFile(getStoragePath(STORAGE_KEYS.EXPIRES_AT), 'utf8').catch(() => null);
    if (expiresAt) {
      this.expiresAt = parseInt(expiresAt, 10);
    }

    // Check if tokens are still valid
    if (this.accessToken && this.expiresAt && this.expiresAt > Date.now()) {
      return true;
    }
    return false;
  }

  // Get authorization URL for OAuth2
  getAuthorizationUrl() {
    return AUTH_URL;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(authCode: string): Promise<void> {
    try {
      const formData = new URLSearchParams();
      formData.append('client_id', '3541974');
      formData.append('code', authCode);
      formData.append('redirect_uri', 'https://connect.garmin.com/modern');
      formData.append('grant_type', 'authorization_code');

      const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get tokens: ${error}`);
      }

      const data = await response.json();

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.expiresAt = Date.now() + (data.expires_in * 1000);

      // Save to file
      await Promise.all([
        writeFile(getStoragePath(STORAGE_KEYS.ACCESS_TOKEN), this.accessToken!),
        writeFile(getStoragePath(STORAGE_KEYS.REFRESH_TOKEN), this.refreshToken!),
        writeFile(getStoragePath(STORAGE_KEYS.EXPIRES_AT), this.expiresAt.toString()),
      ]);
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('client_id', '3541974');
      formData.append('refresh_token', this.refreshToken);
      formData.append('grant_type', 'refresh_token');

      const response = await fetch(REFRESH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to refresh token: ${error}`);
      }

      const data = await response.json();

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.expiresAt = Date.now() + (data.expires_in * 1000);

      // Update file
      await Promise.all([
        writeFile(getStoragePath(STORAGE_KEYS.ACCESS_TOKEN), this.accessToken!),
        writeFile(getStoragePath(STORAGE_KEYS.REFRESH_TOKEN), this.refreshToken!),
        writeFile(getStoragePath(STORAGE_KEYS.EXPIRES_AT), this.expiresAt.toString()),
      ]);

      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Clear expired tokens
      await this.clearTokens();
      return false;
    }
  }

  // Clear all stored tokens
  async clearTokens(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
    await Promise.all([
      Promise.resolve(writeFile(getStoragePath(STORAGE_KEYS.ACCESS_TOKEN), '')).catch(() => {}),
      Promise.resolve(writeFile(getStoragePath(STORAGE_KEYS.REFRESH_TOKEN), '')).catch(() => {}),
      Promise.resolve(writeFile(getStoragePath(STORAGE_KEYS.EXPIRES_AT), '')).catch(() => {}),
    ]);
  }

  // Get activities from Garmin Connect
  async getActivities(days: number = 30): Promise<Activity[]> {
    // Ensure we have a valid access token
    if (!this.accessToken || (this.expiresAt && this.expiresAt <= Date.now())) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        throw new Error('Not authenticated. Please authorize with Garmin Connect.');
      }
    }

    try {
      const response = await fetch(`${ACTIVITY_URL}?start=0&limit=${days * 5}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshed = await this.refreshAccessToken();
          if (!refreshed) {
            throw new Error('Authentication expired. Please re-authorize with Garmin Connect.');
          }
          // Retry with new token
          return await this.getActivities(days);
        }
        throw new Error(`Failed to get activities: ${response.statusText}`);
      }

      const data: GarminActivitiesResponse = await response.json();
      return data.activities || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  }

  // Get wellness data from Garmin Connect
  async getWellnessData(date: string): Promise<WellnessData> {
    // Ensure we have a valid access token
    if (!this.accessToken || (this.expiresAt && this.expiresAt <= Date.now())) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        throw new Error('Not authenticated. Please authorize with Garmin Connect.');
      }
    }

    try {
      const response = await fetch(`${WELLNESS_URL}/${date}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshed = await this.refreshAccessToken();
          if (!refreshed) {
            throw new Error('Authentication expired. Please re-authorize with Garmin Connect.');
          }
          // Retry with new token
          return await this.getWellnessData(date);
        }
        // 404 means no data for that date, return empty object
        if (response.status === 404) {
          return {
            restingHeartRate: null,
            bodyBattery: null,
            sleep: {
              duration: 0,
              stages: [],
            },
          };
        }
        throw new Error(`Failed to get wellness data: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching wellness data:', error);
      throw error;
    }
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!(this.accessToken && this.expiresAt && this.expiresAt > Date.now());
  }

  // Authorize using a system browser (external app)
  async authorize(): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = this.getAuthorizationUrl();
      
      // Open the browser
      const child = spawn('open', [url], {
        stdio: 'ignore',
      });

      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) {
          resolve('Opened browser for authorization');
        } else {
          reject(new Error(`Browser process exited with code ${code}`));
        }
      });

      // Set a timeout after 5 minutes
      setTimeout(() => {
        resolve('Opened browser for authorization (timeout)');
      }, 5 * 60 * 1000);
    });
  }
}

export const garminService = new GarminService();
