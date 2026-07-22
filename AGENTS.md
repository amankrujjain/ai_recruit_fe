# Frontend note — AI agents

For full project governance, read (workspace root or sibling backend clone):

1. `../AGENTS.md` or `../server/AGENTS.md`
2. `../docs/01_MEMORY.md` or `../server/docs/governance/01_MEMORY.md`
3. `../docs/17_SUGGESTIONS.md` or `../server/docs/governance/17_SUGGESTIONS.md` (Accepted = agreed direction)
4. Security / AI guardrails / privacy / definition of done in the same `docs` or `server/docs/governance` folders

When working **only** in this frontend repo, still respect:

- No building autonomous hire/reject UX
- Candidate magic-link pages stay public (token auth)
- Reuse `components/ui` and existing slices/APIs
- Mirror status enums in `src/lib/`
- **Simplicity:** smallest correct change; no rewrites or new UI frameworks; extend existing patterns like an excellent React/Vite engineer would
