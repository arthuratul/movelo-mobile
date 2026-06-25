import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY  = 'movelo_access_token';
const REFRESH_TOKEN_KEY = 'movelo_refresh_token';
const TOKEN_EXPIRY_KEY  = 'movelo_token_expiry';

export interface TokenSet {
  accessToken:  string;
  refreshToken: string;
  expiresAt:    number;
}

export async function saveTokens(tokens: TokenSet): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY,  tokens.accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
  await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY,  String(tokens.expiresAt));
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
}

export async function isAccessTokenExpired(): Promise<boolean> {
  const expiry = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
  if (!expiry) return true;
  return Date.now() >= Number(expiry) - 30_000;
}