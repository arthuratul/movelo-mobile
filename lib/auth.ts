import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { saveTokens, getAccessToken, getRefreshToken, clearTokens, isAccessTokenExpired } from './tokens';

export { getAccessToken, getRefreshToken, clearTokens };

const BASE_URL     = process.env.EXPO_PUBLIC_API_URL            ?? 'http://10.0.2.2:8000';
const API_URL      = `${BASE_URL}/api/v1`;
const AUTH_URL     = `${BASE_URL}/auth`;
const CLIENT_ID    = process.env.EXPO_PUBLIC_OAUTH_CLIENT_ID    ?? '';
const REDIRECT_URI = process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI ?? 'movelo://callback';

export class AuthError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'AuthError';
  }
}

// ── PKCE utilities ─────────────────────────────────────────────────────────────

function base64urlEncode(buffer: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  while (i < buffer.length) {
    const a = buffer[i++];
    const b = i < buffer.length ? buffer[i++] : 0;
    const c = i < buffer.length ? buffer[i++] : 0;
    result += chars[a >> 2];
    result += chars[((a & 3) << 4) | (b >> 4)];
    result += i - 2 < buffer.length ? chars[((b & 15) << 2) | (c >> 6)] : '=';
    result += i - 1 < buffer.length ? chars[c & 63] : '=';
  }
  return result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateCodeVerifier(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  return base64urlEncode(new Uint8Array(bytes));
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  return digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ── Token API ──────────────────────────────────────────────────────────────────

interface AuthTokenResponse {
  access_token:  string;
  refresh_token: string;
  token_type:    'Bearer';
  expires_in:    number;
}

async function apiExchangeCode(code: string, codeVerifier: string): Promise<AuthTokenResponse> {
  const res = await fetch(`${AUTH_URL}/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      client_id:     CLIENT_ID,
      grant_type:    'authorization_code',
      code,
      redirect_uri:  REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });
  if (res.ok) return res.json() as Promise<AuthTokenResponse>;
  throw new AuthError('Authentication failed. Please try again.', res.status);
}

export async function apiRefreshToken(refreshToken: string): Promise<AuthTokenResponse> {
  const res = await fetch(`${AUTH_URL}/refresh`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ client_id: CLIENT_ID, refresh_token: refreshToken }),
  });
  if (res.ok) return res.json() as Promise<AuthTokenResponse>;
  throw new AuthError('Session expired. Please sign in again.', res.status);
}

async function apiLogout(refreshToken: string): Promise<void> {
  await fetch(`${AUTH_URL}/logout`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refresh_token: refreshToken }),
  });
}

// ── Shared browser-based PKCE launcher ────────────────────────────────────────
// Opens authUrl in the system browser, waits for redirect back to REDIRECT_URI,
// then exchanges the authorization code for tokens.

async function runPkceSession(authUrl: string): Promise<'success' | 'cancelled' | 'error'> {
  const codeVerifier  = await generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const separator = authUrl.includes('?') ? '&' : '?';
  const fullUrl   = `${authUrl}${separator}code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`;

  const result = await WebBrowser.openAuthSessionAsync(fullUrl, REDIRECT_URI);

  if (result.type !== 'success') return result.type === 'cancel' ? 'cancelled' : 'error';

  const callbackUrl = new URL(result.url);
  const code        = callbackUrl.searchParams.get('code');
  if (!code) throw new AuthError('Sign-in failed: no authorization code returned', 500);

  const tokens = await apiExchangeCode(code, codeVerifier);
  await saveTokens({
    accessToken:  tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt:    Date.now() + tokens.expires_in * 1000,
  });
  return 'success';
}

// ── Public auth actions ────────────────────────────────────────────────────────

export async function initiateLogin(): Promise<'success' | 'cancelled' | 'error'> {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
  });
  return runPkceSession(`${AUTH_URL}/authorize?${params}`);
}

export async function loginWithGoogle(): Promise<'success' | 'cancelled' | 'error'> {
  const params = new URLSearchParams({
    client_id:    CLIENT_ID,
    redirect_uri: REDIRECT_URI,
  });
  return runPkceSession(`${AUTH_URL}/google?${params}`);
}

// Opens the backend signup form in the browser. After the user submits,
// the backend redirects to REDIRECT_URI and the browser session closes.
export async function initiateSignup(): Promise<'success' | 'cancelled' | 'error'> {
  const params = new URLSearchParams({
    client_id:    CLIENT_ID,
    redirect_uri: REDIRECT_URI,
  });
  const result = await WebBrowser.openAuthSessionAsync(
    `${AUTH_URL}/signup?${params}`,
    REDIRECT_URI,
  );
  if (result.type === 'success') return 'success';
  if (result.type === 'cancel') return 'cancelled';
  return 'error';
}

export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) await apiLogout(refreshToken);
  await clearTokens();
}

export async function getAuthUser(): Promise<{ userId: string; email: string } | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const b64     = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64)) as { sub?: string; email?: string };
    if (!payload.sub || !payload.email) return null;
    return { userId: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const expired = await isAccessTokenExpired();
  if (!expired) return getAccessToken();

  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const tokens = await apiRefreshToken(refreshToken);
    await saveTokens({
      accessToken:  tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt:    Date.now() + tokens.expires_in * 1000,
    });
    return tokens.access_token;
  } catch {
    await clearTokens();
    return null;
  }
}