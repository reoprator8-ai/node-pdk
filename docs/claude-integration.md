# Claude integration

This project already provides the bridge between Claude and PDK: an MCP
server over stdio. Claude starts `src/mcp/index.js`, discovers its tools, and
calls the server for read-only PDK data. There is no direct API connection
between two AI models.

## Claude Desktop

Build/install the project first:

```powershell
npm install
```

Add a server entry to Claude Desktop's `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pdk-readonly": {
      "command": "node",
      "args": [
        "C:\\path\\to\\node-pdk\\src\\mcp\\index.js"
      ],
      "env": {
        "PDK_AUTH_STRATEGY": "userauth",
        "PDK_CLIENT_ID": "replace-with-pdk-oauth-client-id",
        "PDK_CLIENT_SECRET": "replace-with-pdk-oauth-client-secret",
        "PDK_SCOPE": "openid offline_access"
      }
    }
  }
}
```

Restart Claude Desktop after saving the file. With `userauth`, the PDK OAuth
browser flow opens when the server first authenticates. For unattended use,
configure `PDK_REFRESH_TOKEN` through a local secret manager or environment
variable instead of committing it.

## Claude Code

From the repository root, add the same server with:

```sh
claude mcp add pdk-readonly -- node src/mcp/index.js
```

Set the PDK environment variables in the shell or Claude Code MCP
configuration. Do not put passwords, refresh tokens, or client secrets in
this repository.

## Available read-only tools

* `getPanel` — retrieve panel metadata.
* `listEntities` — list and search people, doors, sites, groups, or
  credentials with pagination.
* `getEntity` — retrieve one entity.
* `getEventStream` — collect live events for a bounded duration.

The command-sending tool is intentionally not registered. Claude cannot unlock
doors, activate relays, send commands, or modify PDK configuration through
this server.

## Example Claude requests

After the MCP server appears as connected in Claude:

```text
List the first 25 people on panel 10702GA.
```

```text
Search panel 10702GA for people named Smith and show their IDs.
```

```text
Read live events from panel 10702GA for 10 seconds. Do not send commands.
```

MCP tool failures are returned with structured codes such as
`UNAUTHENTICATED`, `NOT_FOUND`, `RATE_LIMITED`, and `UPSTREAM_ERROR`.
