# PDK MCP server

The PDK MCP server exposes the existing `@pdk/client` API to MCP-compatible
clients such as Claude. It uses stdio, so credentials stay in the server
process and are never sent as tool arguments.

## Run

Node.js 18 or newer is required.

```sh
npm install
npm run setup
npm start
```

`npm run setup` asks for the OAuth values locally and writes `.env` in this
project folder. The startup process loads that file automatically. Credentials
are never tool arguments, logs, reports, or chat messages; `.env` is ignored by
Git. Run setup again only when replacing credentials.

MCP clients usually launch the process directly. Example Claude Desktop
configuration:

```json
{
  "mcpServers": {
    "pdk": {
      "command": "node",
      "args": ["C:\\path\\to\\node-pdk\\src\\mcp\\index.js"],
      "env": {
        "PDK_AUTH_STRATEGY": "clientauth",
        "PDK_CLIENT_ID": "replace-me",
        "PDK_CLIENT_SECRET": "replace-me"
      }
    }
  }
}
```

`clientauth` uses the OAuth client-credentials flow. `userauth` opens the PDK
browser flow on first use so you can manually sign in to PDK, or can run
unattended with `PDK_REFRESH_TOKEN`. Both flows still require the OAuth
application's `PDK_CLIENT_ID` and `PDK_CLIENT_SECRET`; the server does not
collect or store the website password.

## Tools

* `getPanel({ panelId })` retrieves panel metadata.
* `listEntities({ entityType, panelId, page, perPage, cursor, search, filters })`
  lists `persons`, `people`, `doors`, `sites`, `groups`, or `credentials`.
  `search` is passed to the PDK API for server-side text search. The response
  includes `items`, `count`, and API pagination `links`.
* `getEntity({ entityType, entityId, panelId })` retrieves one entity.
* `getGroupMembers({ panelId, groupId })` reads the people assigned to a group.
* `listPersonCards({ panelId, personId })` reads cards assigned to a person.
* `getEventStream({ panelId, durationMs })` collects live events for a bounded
  period (100–60000 ms), then returns them as an array. MCP tool calls are
  request/response operations, so this bounded collection avoids leaving a
  stdio request hanging indefinitely.

Errors are returned as MCP `isError` results with stable codes such as
`INVALID_ARGUMENT`, `UNAUTHENTICATED`, `NOT_FOUND`, `RATE_LIMITED`, and
`UPSTREAM_ERROR`. Logs go to stderr and never include credentials.

This server is read-only. It does not register or implement command-sending
tools or mutation endpoints, so MCP clients cannot create/delete people, assign
groups, add cards, unlock doors, activate relays, or change PDK configuration
through this process.

## Deployment

## Local read-only triage reports

The same authenticated client can produce a sanitized report without exposing
credentials or changing PDK data:

```powershell
$env:PDK_AUTH_STRATEGY = "clientauth"
$env:PDK_CLIENT_ID = "your-client-id"
$env:PDK_CLIENT_SECRET = "your-client-secret"
npm run triage -- --panel 1072FW4 --entity persons --search "Groups Issue" --output report.json
```

The report includes request duration, query details, panel metadata, result
records, and pagination metadata. Sensitive fields such as tokens, secrets,
authorization headers, and card numbers are replaced with `[REDACTED]`.

Run the server alongside the triage tool as a separate process. Keep OAuth
secrets in the host secret manager or process environment, not in the MCP
client configuration committed to source control. Send SIGINT or SIGTERM for
graceful shutdown; active Socket.IO streams are closed and the auth token is
revoked when supported.
