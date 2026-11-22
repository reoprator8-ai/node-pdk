#!/usr/bin/env node

import { writeFile } from 'node:fs/promises';
import { makePanelSession, makeSession } from '../src/index.js';
import { createAuthStrategy } from '../src/mcp/auth.js';
import { loadDotEnv } from '../src/mcp/config.js';

loadDotEnv();

const SENSITIVE_KEYS = /token|secret|password|authorization|cookie|card(number)?|credential/i;

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) throw new Error(`Unexpected argument: ${value}`);
    const key = value.slice(2);
    const next = argv[index + 1];
    args[key] = next && !next.startsWith('--') ? next : true;
    if (args[key] !== true) index += 1;
  }
  return args;
}

function redact(value, key = '') {
  if (SENSITIVE_KEYS.test(key)) return '[REDACTED]';
  if (Array.isArray(value)) return value.map(item => redact(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, redact(item, name)]));
  }
  return value;
}

function required(args, name) {
  if (!args[name] || typeof args[name] !== 'string') {
    throw new Error(`Missing required option --${name}`);
  }
  return args[name];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const panelId = required(args, 'panel');
  const entityType = args.entity || 'persons';
  const startedAt = Date.now();
  const auth = createAuthStrategy({
    strategy: process.env.PDK_AUTH_STRATEGY || 'clientauth',
    clientId: process.env.PDK_CLIENT_ID,
    clientSecret: process.env.PDK_CLIENT_SECRET,
    issuer: process.env.PDK_ISSUER || 'https://accounts.pdk.io',
    scope: process.env.PDK_SCOPE,
    refreshToken: process.env.PDK_REFRESH_TOKEN,
  });
  const account = await makeSession(auth);
  const panel = await account(`panels/${encodeURIComponent(panelId)}`);
  const panelSession = await makePanelSession(account, panel);
  const searchParams = {
    page: Number(args.page || 1),
    perPage: Math.min(Number(args.perPage || 25), 100),
  };
  if (args.search) searchParams.search = args.search;
  const result = await panelSession(entityType, { searchParams });
  const report = redact({
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    panel: { id: panelId, name: panel.name },
    query: { entityType, ...searchParams },
    result: {
      items: Array.isArray(result) ? result : result?.items || result,
      count: result?.count,
      links: result?.link || null,
    },
  });
  const output = args.output || '-';
  if (output === '-') console.log(JSON.stringify(report, null, 2));
  else await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

main().catch(error => {
  console.error(JSON.stringify({
    error: error.message,
    statusCode: error.response?.statusCode,
  }));
  process.exitCode = 1;
});
