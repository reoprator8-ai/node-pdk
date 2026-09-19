#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { chmod, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

async function main() {
  const prompt = createInterface({ input, output });
  const ask = question => prompt.question(question);
  try {
    if (existsSync('.env')) {
      const replace = (await ask('A .env file already exists. Replace it? (y/N) ')).toLowerCase();
      if (replace !== 'y') {
        console.log('Setup cancelled; existing credentials were not changed.');
        return;
      }
    }
    await configure(ask);
  } finally {
    prompt.close();
  }
}

async function configure(ask) {
  const strategy = (await ask('Authentication strategy (clientauth/userauth) [clientauth]: ')) || 'clientauth';
  if (!['clientauth', 'userauth'].includes(strategy)) throw new Error('Strategy must be clientauth or userauth');
  const clientId = await ask('PDK client ID: ');
  const clientSecret = await ask('PDK client secret: ');
  if (!clientId || !clientSecret) throw new Error('Client ID and client secret are required');
  const refreshToken = strategy === 'userauth' ? await ask('Refresh token (optional): ') : '';
  const content = [
    `PDK_AUTH_STRATEGY=${strategy}`,
    `PDK_CLIENT_ID=${clientId}`,
    `PDK_CLIENT_SECRET=${clientSecret}`,
    'PDK_ISSUER=https://accounts.pdk.io',
    'PDK_SCOPE=openid offline_access',
    `PDK_REFRESH_TOKEN=${refreshToken}`,
    'PDK_API_BASE_URL=https://accounts.pdk.io/api/',
    'PDK_STREAM_TIMEOUT_MS=10000',
    '',
  ].join('\n');
  await writeFile('.env', content, { encoding: 'utf8', flag: 'w' });
  try { await chmod('.env', 0o600); } catch { /* Windows ACLs govern access. */ }
  console.log('PDK credentials saved locally in .env (never share or commit this file).');
  console.log('Run npm start to launch the read-only MCP server.');
}

main().catch(error => {
  console.error(`Setup failed: ${error.message}`);
  process.exitCode = 1;
});
