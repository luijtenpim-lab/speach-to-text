# claude.md — Project Constitution
# Speech-to-Text SaaS

> This file is LAW. Update only when: schema changes, rules are added, or architecture is modified.

---

## Data Schema
_To be defined after Discovery phase_

### Input Schema
```json
{}
```

### Output Schema (Payload)
```json
{}
```

---

## Behavioral Rules
_To be defined after Discovery phase_

---

## Architectural Invariants
- All intermediate files go in `.tmp/`
- All secrets/tokens go in `.env` — never hardcoded
- Tools in `tools/` are atomic, deterministic Python scripts
- Architecture SOPs live in `architecture/`
- A project is only "Complete" when the payload reaches its cloud destination

---

## Maintenance Log
_Populated during Trigger phase_
