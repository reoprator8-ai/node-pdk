# Team package

This repository can be distributed as an npm package. It contains the
read-only PDK MCP server, the local credential setup command, and the
sanitized triage report command.

## Build the package

From the repository root:

```powershell
npm install
npm pack
```

This creates a versioned `.tgz` file. Share that file with the team through
your approved internal software distribution channel. The package does not
contain `.env` files, credentials, tokens, or local reports.

## Install on a team workstation

```powershell
npm install --global .\pdk-client-0.8.0.tgz
New-Item -ItemType Directory -Force "$HOME\.pdk" | Out-Null
Set-Location "$HOME\.pdk"
pdk-setup
pdk-mcp
```

`pdk-setup` asks for credentials in the local terminal and writes `.env` in
the current folder. Each team member should use their own PDK OAuth
credentials; credentials must not be copied into chat, source control, or the
package archive.

The same folder can run a sanitized lookup:

```powershell
pdk-triage --panel 1072FW4 --entity persons --search "Groups Issue" --output report.json
```

The MCP client configuration should launch the installed command:

```json
{
  "mcpServers": {
    "pdk": {
      "command": "pdk-mcp",
      "cwd": "C:\\Users\\team-member\\.pdk"
    }
  }
}
```

Copy `claude-desktop.json.example` into Claude Desktop's configuration file,
replace `YOUR-NAME` with the Windows user name, and restart Claude Desktop.
This is the Claude plugin connection: Claude starts the packaged `pdk-mcp`
command over MCP. It receives only the read-only tools; no credentials are
placed in this JSON file.

All exposed operations are read-only. The package does not create or delete
people, add cards, assign groups, send commands, unlock doors, or change PDK
configuration.
