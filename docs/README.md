# Docs Map (Diataxis)

| Need | Go to |
|---|---|
| New here, run it locally | `../README.md` Quick Start + `runbooks/edge-deploy.md` |
| How-to: ingest manuals | `context/ingestion_runbook.md` |
| How-to: verify Postgres live | `../scripts/verify_postgres.py --verify-counts` |
| Reference: API | `api/openapi.json` + `api/README.md` (generated, do not hand-edit) |
| Reference: equipment/fault taxonomy | `context/equipment_taxonomy.md`, `context/fault_ontology.md` |
| Explanation: why repo split / vector abstraction | `adr/ADR-001-repository-split.md`, `adr/ADR-002-vector-abstraction.md` |
| Reports: which numbers are current | `../reports/README.md` |

Conventions: docs are Markdown, ASCII headings (no emoji in H1/H2), paths use forward slashes,
code refs use `file:line` (e.g. `backend/app/main.py:152`).
