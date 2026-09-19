<!-- WORKSPAI:PROJECT-GROUNDING:START -->
# Workspai agent entry gate (mandatory)

- Project: `playwright-mcp`
- Workspace identity: `workspai` (logical name, not a filesystem path)
- Entry contract: `.workspai/agent-entry.v1.json`

Before broad repository discovery, architecture claims, planning, or mutation:

1. Read `.workspai/agent-entry.v1.json`.
2. Run `workspai agent bootstrap --for-agent generic --strict --json`.
3. Follow the receipt's `requiredReadOrder` exactly.
4. If a Goal is active, read its immutable Goal Pack and handoff before acting.
5. Read the compact workspace Skills index and load only a matching playbook.
6. Query the bounded Workspace Graph with the user's task, then inspect only returned proofs and targeted live source.

Receipt policy: `ready` may proceed; `degraded` must disclose limitations and may not claim complete architecture or verification; `blocked` must stop governed claims, execute `nextActions`, and rerun bootstrap.

`workspace:` paths belong to the canonical workspace, not this project's `.workspai` directory. Resolve their machine-local root at runtime with `workspai project workspace status --json`. That output is machine-local: never copy it into answers, shared logs, commits, or portable artifacts.

Authority: Workspai evidence owns identity, topology, goals, readiness, and verification. Live source and repository-authored rules own exact implementation and source conventions.
<!-- WORKSPAI:PROJECT-GROUNDING:END -->
