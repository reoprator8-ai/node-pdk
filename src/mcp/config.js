import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

loadDotEnv();

/**
 * Load MCP server configuration from environment variables.
 *
 * Secrets are intentionally read at startup and never included in logs or tool
 * responses.
 */
export function loadConfig(env = process.env) {
  const strategy = env.PDK_AUTH_STRATEGY || 'clientauth';
  if (!['clientauth', 'userauth'].includes(strategy)) {
    throw new Error('PDK_AUTH_STRATEGY must be either "clientauth" or "userauth"');
  }

  const required = ['PDK_CLIENT_ID', 'PDK_CLIENT_SECRET'];
  for (const name of required) {
    if (!env[name]) throw new Error(`${name} is required`);
  }

  return {
    strategy,
    clientId: env.PDK_CLIENT_ID,
    clientSecret: env.PDK_CLIENT_SECRET,
    issuer: env.PDK_ISSUER || 'https://accounts.pdk.io',
    scope: env.PDK_SCOPE || 'openid offline_access',
    refreshToken: env.PDK_REFRESH_TOKEN,
    apiBaseUrl: env.PDK_API_BASE_URL || 'https://accounts.pdk.io/api/',
    streamTimeoutMs: parsePositiveInt(env.PDK_STREAM_TIMEOUT_MS, 10000),
    readOnly: true,
  };
}

function parsePositiveInt(value, fallback) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('PDK_STREAM_TIMEOUT_MS must be a positive integer');
  }

  return parsed;
}

export function loadDotEnv(filePaths = [
  resolve(process.cwd(), '.env'),
  resolve(homedir(), '.pdk', '.env'),
]) {
  for (const filePath of filePaths) {
    if (!existsSync(filePath)) continue;
    for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
}
