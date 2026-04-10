# Claude Code Instructions

## Git Push Rules

- All push operations must be pushed to the `main` branch. Regardless of the working branch, changes must always be merged into `main` and pushed there.

## Project Path

All terminal commands must be given relative to the user's local project path:

```
C:\Users\ASUS\github\docs_whattalk
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

## Documentation URLs

When referencing documentation pages, always use the full production URL with the base domain `https://yardim.whattalk.ai`. Never use relative paths like `/tr/releases`.

Examples:
- `https://yardim.whattalk.ai/tr/releases`
- `https://yardim.whattalk.ai/tr/api-reference/assistants/create-assistant`
