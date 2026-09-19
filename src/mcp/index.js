#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config.js';
import { SessionManager } from './sessionManager.js';
import { registerTools } from './tools.js';

const log = message => process.stderr.write(`[pdk-mcp] ${message}\n`);

async function main() {
  const config = loadConfig();
  const sessions = new SessionManager(config);
  const server = new McpServer({ name: 'pdk-mcp', version: '1.0.0' });
  registerTools(server, sessions, config, log);

  const shutdown = async signal => {
    log(`Received ${signal}, shutting down`);
    await sessions.close();
    await server.close();
    process.exit(0);
  };
  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));

  await server.connect(new StdioServerTransport());
  log('MCP server is ready');
}

main().catch(error => {
  log(`Fatal error: ${error.message}`);
  process.exitCode = 1;
});
