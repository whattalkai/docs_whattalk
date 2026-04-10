# CLAUDE.md

## Project Path

All terminal commands must be given relative to the user's local project path:

```
C:\Users\ASUS\github\docs_whattalk
```

When providing terminal instructions (PowerShell, cmd, etc.), always use this as the base directory. For example:

```powershell
cd C:\Users\ASUS\github\docs_whattalk
cd agent-ui
npm install
npm run dev
```

## Repository Structure

- `api-reference/` — AutoCalls API documentation (MDX)
- `ai-assistants/` — AI assistant configuration guides
- `automation-platform/` — Automation flow documentation
- `whatsapp/` — WhatsApp integration docs
- `agent-ui/` — Agent Manager web UI (Next.js)
- `.claude/agents/` — Claude Code agent definitions
- `tr/` — Turkish translations

## Agent UI

The Agent Manager UI is in `agent-ui/`. To run:

```powershell
cd C:\Users\ASUS\github\docs_whattalk\agent-ui
npm install
npm run dev
```

Opens at `http://localhost:3000`.

## Git Branch

Development branch: `claude/ghl-autocalls-workflow-wadv6`
