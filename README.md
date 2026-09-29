# Factory Maintenance Copilot

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://python.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-StateGraph%20v0.2.35%2B-orange.svg)](https://langchain-ai.github.io/langgraph/)
[![Ollama](https://img.shields.io/badge/Ollama-Qwen2.5--7B-green.svg)](https://ollama.ai)
[![Azure OpenAI](https://img.shields.io/badge/Azure%20OpenAI-Supported-blue.svg)](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
[![FAISS](https://img.shields.io/badge/FAISS-Hybrid%20Dense%20%2B%20BM25-red.svg)](https://github.com/facebookresearch/faiss)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Kustomize%20Manifests-326ce5.svg)](https://kubernetes.io)
[![Observability](https://img.shields.io/badge/Observability-OTel%20%2B%20Prometheus-purple.svg)](https://prometheus.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-brightgreen.svg)](./.github/workflows/ci.yml)

A human-in-the-loop AI maintenance copilot for factories and semiconductor fabs. Technicians ask about a machine, alarm, or fault code; the copilot answers from the plant's own manuals and SOPs, reads live telemetry, and drafts work orders that a supervisor must approve before anything changes.

Under the hood: a LangGraph multi-agent graph (retrieval, diagnostic, maintenance), hybrid FAISS + BM25 retrieval with Reciprocal Rank Fusion, role-based access control, HMAC-signed REST/MQTT telemetry, and SQLite or PostgreSQL persistence. Sample documentation covers CNC lathes, hydraulic presses, plasma etchers, PECVD, lithography scanners, CMP polishers, and LOTO SOPs.

Runs fully offline on a single workstation (tested on an RTX 3070, 8 GB VRAM) with Ollama `qwen2.5:7b-instruct` and `BAAI/bge-large-en-v1.5`, or switches to Azure OpenAI with one setting.

---

## Outcomes

- Retrieved the right manual section in the top 3 results for 94.0% of 50 labeled plant queries (98.0% Recall@5, 0.793 MRR) at 202 ms p95, by fusing FAISS dense and BM25 search with Reciprocal Rank Fusion across 5 plant domains.
- Blocked 100% of unsafe and off-topic prompts on a 100-case benchmark (97.0% guardrail accuracy, 94.3% abstention precision), so the copilot declines instead of guessing.
- Gated every AI-proposed work order, inspection, and alarm change behind supervisor approval, orchestrating retrieval, diagnostic, and maintenance agents with a LangGraph `interrupt()` checkpoint and 3 RBAC roles.
- Eliminated LLM spend, cutting modeled cost from $74.50 to $0.00 per 10,000 queries by serving Qwen2.5-7B on local Ollama, with Azure OpenAI kept as a one-switch cloud fallback.
- Secured live sensor feeds over REST and MQTT (QoS 1) with HMAC SHA-256 signatures and 300 s replay protection; telemetry raises alarms but can never create work orders on its own.
- Packaged the platform for plant and cloud rollout with 4 Docker Compose profiles, Kubernetes Kustomize manifests, and GitHub Actions CI over 82 pytest tests.

---

## Contents

- [Outcomes](#outcomes)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Human-in-the-Loop Approval Workflow](#human-in-the-loop-approval-workflow)
- [Persistence](#persistence)
- [Benchmark Results](#benchmark-results)
- [Technology Stack](#technology-stack)
- [Repository Layout](#repository-layout)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Local Development Accounts](#local-development-accounts)
- [Tests and Benchmarks](#tests-and-benchmarks)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Multi-agent LangGraph StateGraph:** supervisor router + retrieval / diagnostic / maintenance specialists + prototype embedding guardrail.
- **Human-in-the-Loop safety:** state-changing actions pause via `interrupt()` until a supervisor approves (`backend/app/agents/approval.py`).
- **RBAC:** `technician < supervisor < admin` with Argon2id hashing, JWT HttpOnly cookies, CSRF token (`backend/app/auth/security.py`).
- **Telemetry ingestion:** HMAC SHA-256 REST + MQTT QoS 1 with 300s clock-skew replay protection; telemetry creates alarms only, never auto work orders.
- **Hybrid RAG:** FAISS dense + BM25 lexical with Reciprocal Rank Fusion (`k=60`), header-aware semantic chunking, metadata filters.
- **Dual persistence:** SQLite (WAL, edge default) and PostgreSQL (production) via SQLAlchemy 2.0 + Alembic; `SqliteSaver` / `PostgresSaver` checkpoints.
- **Multi-provider LLM:** local Ollama (zero marginal cost) or Azure OpenAI with token telemetry (`backend/app/llm/factory.py`).
- **Observability & deploy:** OpenTelemetry tracing, Prometheus `/metrics`, Docker Compose profiles, Kubernetes Kustomize manifests.

---

## System Architecture

```mermaid
flowchart TD
    User([Maintenance Technician / Supervisor]) -->|Bearer JWT / HttpOnly Cookie| API[FastAPI Security Gateway & RBAC]
    TelemetrySource[Sensors / PLCs / Simulators] -->|HMAC SHA-256 Signed JSON| API
    MQTTBroker[MQTT Broker: Mosquitto QoS 1] -->|Topic: factory/equipment/+/telemetry| MQTTClient[Async MQTT Ingestion Worker]
    MQTTClient --> IngestionService[Telemetry & Threshold Engine]
    API --> IngestionService

    IngestionService -->|Insert Event & Automated Alarms| PlantDB[(Dual DB: SQLite / PostgreSQL)]
    IngestionService -.->|Strict HITL Isolation: NO AUTO WORK ORDERS| PlantDB

    API -->|Prompt & Thread ID| Checkpointer[(Dual Checkpointer: SqliteSaver / PostgresSaver)]

    subgraph MultiAgentGraph [LangGraph Autonomous State Machine & HITL Protocol]
        Router[Supervisor Agent - Router Node]
        Router -->|Manual Specs & LOTO| Retrieval[Retrieval Agent]
        Router -->|Telemetry, Alarms, Logs| Diagnostic[Diagnostic Agent]
        Router -->|Repair SOPs & Work Orders| Maintenance[Maintenance Agent]
        Router -->|Out of Domain / Injection| Guardrail[Prototype Embedding Guardrail - 97% Accuracy]

        Diagnostic -->|State Mutation: Acknowledge Alarm| ApprovalNode[Approval Node: interrupt()]
        Maintenance -->|State Mutation: Create WO / Inspection| ApprovalNode

        ApprovalNode -.->|Thread Paused / State Saved| Checkpointer
        HumanReviewer([Supervisor Reviewer]) -->|POST /api/v1/actions/{id}/approve| ApprovalNode
        ApprovalNode -->|Command(resume=...)| MutationExecution[Execute Mutation & Log Audit]
    end

    subgraph DataAndVectorLayer [Data Persistence & Hybrid Retrieval]
        Retrieval -->|Reciprocal Rank Fusion| RRFRetriever[Hybrid RRF Retriever + Metadata Filters]
        RRFRetriever -->|Dense Cosine Search| FAISS[(FAISS Native C++ Index + SHA-256 Manifest)]
        RRFRetriever -->|Sparse Lexical Match| BM25[(Rank-BM25 Lexical Store)]

        Diagnostic -->|SQLAlchemy 2.0 ORM / SQL| PlantDB
        Maintenance -->|SQLAlchemy 2.0 ORM / SQL| PlantDB
        MutationExecution -->|Idempotent Transactions| PlantDB
        MutationExecution -->|Immutable Trail| AuditDB[(action_audit Table)]
    end

    subgraph ObservabilityLayer [Observability & Telemetry]
        API -.-> OTel[OpenTelemetry Distributed Tracing]
        MultiAgentGraph -.-> Prom[Prometheus Metrics: /metrics]
        LLMFactory[LLM Factory: Ollama / Azure OpenAI] -.-> TokenMetrics[Token Usage & Cost Accounting]
    end

    MultiAgentGraph --> Stream[Server-Sent Events SSE Token Stream]
    Stream --> UI[React 19 Dashboard + Supervisor Approval Cards]
```


---

## Human-in-the-Loop Approval Workflow

State-changing actions in plant environments (creating work orders, booking machinery inspections, acknowledging critical safety alarms) require Human-in-the-Loop (HITL) authorization before database mutation:

```mermaid
sequenceDiagram
    autonumber
    actor Tech as Maintenance Technician (tech1)
    participant UI as React 19 Frontend
    participant API as FastAPI Gateway
    participant LG as LangGraph StateGraph
    participant DB as SQLite / Postgres
    actor Sup as Supervisor (supervisor1)

    Tech->>UI: "Create critical work order for EQ-2001 RF matchbox failure"
    UI->>API: POST /api/chat/stream (Thread: session-xyz)
    API->>LG: graph.astream_events(thread_id="session-xyz")
    LG->>LG: Maintenance Agent creates pending action ACT-9A8B
    LG->>LG: Approval node invokes interrupt(pending_action)
    LG->>DB: Record action_audit (decision='requested', state saved in checkpointer)
    LG-->>UI: SSE event: {"type": "approval_required", "action_id": "ACT-9A8B"}
    UI->>UI: Render ActionApprovalCard (Action Paused, Pending Supervisor)

    Sup->>UI: Log In as Supervisor
    UI->>API: POST /api/v1/auth/login (supervisor1 / local seed credential)
    API-->>UI: HttpOnly JWT Cookie (Role: supervisor)
    Sup->>UI: Click "Approve & Execute"
    UI->>API: POST /api/v1/actions/ACT-9A8B/approve
    API->>LG: graph.invoke(Command(resume={'approved': True, 'approver': 'supervisor1'}))
    LG->>DB: INSERT INTO work_orders (status='approved', approved_by='supervisor1')
    LG->>DB: UPDATE action_audit (decision='approved')
    API-->>UI: {"status": "approved", "work_order_id": "WO-2026-0004"}
    UI->>UI: Update card to Approved with live confirmation
```

> The login uses a local development seed. Never reuse development credentials in shared or production environments.


---

## Persistence

1. **SQLite Mode (Default)**:
   - Zero-dependency local persistence using WAL mode (`PRAGMA journal_mode=WAL;`) with busy timeouts.
   - Ideal for isolated plant workstations, edge IPCs, and offline edge gateways.
2. **PostgreSQL Mode**:
   - Production multi-worker persistence using SQLAlchemy 2.0 ORM and connection pooling.
   - LangGraph checkpoints stored via `PostgresSaver`.
   - Migration CLI provided: `python scripts/migrate_sqlite_to_postgres.py --verify-counts`

---

## Benchmark Results

Evaluated on **100 test cases** covering Mechanical, Hydraulic, Pneumatic, Thermal, and Semiconductor domains. Retrieval metrics are measured on the **50 labeled retrieval queries within the 100-case benchmark** (guardrail metrics use all 100 cases), via 5 warm-ups + 3 measured passes per configuration with fixed query order and CUDA synchronization on RTX 3070 (see `reports/retrieval_opt/FINAL_retrieval_optimization_report.md`):

### 1. Domain Guardrail & Safety Abstention
| Metric | Target | Measured Empirical Result | Status |
| :--- | :---: | :---: | :---: |
| **Domain Classification Accuracy** | $\ge 95.0\%$ | **97.0%** (97 / 100 test cases) | Passed |
| **Abstention Precision** | $\ge 90.0\%$ | **94.3%** | Passed |
| **Abstention Recall** | $\ge 90.0\%$ | **100.0%** (0 false negatives) | Passed |
| **F1-Score** | $\ge 90.0\%$ | **97.1%** | Passed |

![Guardrail confusion matrix: 97.0% accuracy, zero false negatives on 100 cases](reports/figures/01_guardrail_confusion_matrix.png)

### 2. Hybrid Retrieval Across 5 Domains (50 labeled retrieval queries; E1b semantic-block chunking, FAISS + BM25 RRF)
| Domain | Queries | Recall@3 | MRR | Latency p50 | Latency p95 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Mechanical (ApexMill CNC)** | 12 | **100.0%** | **0.903** | 156.1 ms | 202.4 ms |
| **Hydraulic (TitanPress-3000)** | 12 | **83.3%** | **0.576** | 156.1 ms | 202.4 ms |
| **Pneumatic (Air Handling)** | 1 | **100.0%** | **1.000** | 156.1 ms | 202.4 ms |
| **Semiconductor (Plasma/PECVD/Litho/CMP)** | 22 | **95.5%** | **0.867** | 156.1 ms | 202.4 ms |
| **Thermal (Spindle Chiller)** | 3 | **100.0%** | **0.611** | 156.1 ms | 202.4 ms |
| **Overall Dataset (50 RAG queries)** | **50** | **94.0%** (Recall@5: **98.0%**) | **0.793** | **156.1 ms** | **202.4 ms** |

![Per-domain Recall@3 with MRR annotations, E1b chunking, 50 queries](reports/figures/04_per_domain_recall_at_3.png)

### 3. LLM Provider Cost Modeling
| Provider | Setup | Marginal Monthly Cost (10k queries) | Latency |
| :--- | :--- | :---: | :---: |
| **Ollama (Qwen2.5:7B / Llama 3.1:8B)** | On-Premise GPU / CPU | **$0.00** | ~1.2s - 2.5s |
| **Azure OpenAI (GPT-4o-mini)** | Managed Cloud Endpoint | **$74.50** | ~0.6s - 1.2s |

![Marginal monthly LLM cost for 10k queries: Ollama $0.00 vs Azure OpenAI $74.50](reports/figures/06_llm_cost_comparison.png)

Source of truth for numbers: `reports/README.md`, `reports/benchmark_report.md`, `reports/retrieval_opt/FINAL_retrieval_optimization_report.md`, charts in `reports/figures/`.

---

## Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **LLM Providers** | `Ollama` (`qwen2.5:7b`) / `Azure OpenAI` (`gpt-4o-mini`) | Multi-agent reasoning, fault diagnosis, procedure synthesis |
| **Agent Orchestration** | `LangGraph v0.2.35+` | State machine routing, `interrupt()` HITL approval gates |
| **State Persistence** | `SqliteSaver` / `PostgresSaver` | Crash-resilient thread state and paused execution resumption |
| **Database ORM** | `SQLAlchemy 2.0` + `Alembic` | Type-safe dual persistence across SQLite and PostgreSQL |
| **Telemetry Ingestion** | `FastAPI` (REST + HMAC SHA-256) + `Paho MQTT` (QoS 1) | High-throughput sensor data ingestion and automated alarm mapping |
| **Vector Indexing** | `FAISS` (Native C++ index) + `rank-bm25` | Hybrid dense semantic similarity + sparse lexical search |
| **Embeddings** | `BAAI/bge-large-en-v1.5` | 1024-dimensional dense text embedding |
| **Security & RBAC** | `Argon2id` + `PyJWT` + `HMAC SHA-256` | Password hashing, JWT auth, and machine payload integrity verification |
| **Observability** | `OpenTelemetry` + `Prometheus` (`/metrics`) | Distributed tracing, agent execution latencies, and token usage accounting |
| **Deployment** | `Docker Compose` + `Kubernetes Kustomize` | Production containerization, GPU node scheduling, and reverse proxying |
| **Frontend UI** | `React 19` + `Vite` + `Tailwind CSS 4` | Real-time diagnostic workspace, DAG trace, supervisor approval modal |

---

## Repository Layout

```
backend/            FastAPI gateway, LangGraph agents, RAG, guardrails, DB repos, MQTT, LLM factory
frontend/           React 19 + Vite dashboard (src/api/types.ts contract, ActionApprovalCard)
data/manuals+sops/ Sample plant docs ingested into FAISS (CNC, hydraulic, semi, LOTO SOPs)
deploy/k8s/         Kustomize base + GPU overlay
docker/             Prometheus + Grafana provisioning
docs/               Docs map (docs/README.md), ADRs, equipment/fault taxonomy, runbooks, API reference
scripts/            DB seed/migrate, telemetry simulator, benchmark harnesses
reports/            Benchmark truth (FINAL_* + figures); intermediates are git-ignored
.github/workflows/ CI: backend fast/slow, postgres, frontend, kustomize
```

Docs entry point: `docs/README.md`. API reference: `docs/api/README.md` + `docs/api/openapi.json` (generated, do not hand-edit).

---

## Quick Start

### 1. Prerequisites
- Python 3.10+ (see `pyproject.toml`)
- Node.js 20+ (see `.github/workflows/ci.yml`)
- [Ollama](https://ollama.ai) installed locally: `ollama pull qwen2.5:7b`

### 2. Environment file (required)
```bash
# Windows (PowerShell)
Copy-Item .env.example .env
# macOS / Linux
cp .env.example .env
```
Fill `JWT_SECRET` and `TELEMETRY_HMAC_SECRET` (32+ chars). Generate with `python -c "import secrets; print(secrets.token_hex(32))"`. Never commit `.env` — only `.env.example` is tracked.

### 3. Backend setup
```bash
# Clone and enter directory
git clone https://github.com/luqshzeeq3601-art/Factory-Maintenance-Copilot.git
cd Factory-Maintenance-Copilot

# Activate environment and install dependencies
uv venv
.venv\Scripts\activate
uv pip install -e .

# Run SQLite migrations (seeds equipment, fault codes, maintenance logs)
python -m backend.app.database.migrations

# Ingest technical manuals into FAISS vector store (regenerates git-ignored vector_store/)
python -m backend.app.rag.ingest

# Launch FastAPI server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API docs: [http://localhost:8000/docs](http://localhost:8000/docs). Metrics: [http://localhost:8000/metrics](http://localhost:8000/metrics).

### 4. Frontend setup
```bash
cd frontend
npm ci
npm run dev
```
Open [http://localhost:3000](http://localhost:3000). Set `VITE_API_URL=http://localhost:8000` if the API is remote. Refresh the typed contract with `npm run openapi` (regenerates from `/openapi.json` into `src/api/types.ts`).

The UI requires sign-in. Routes: `/` dashboard, `/assets` (asset table + copilot), `/assets/:id/:tab?`, `/diagnostics/:id?/:tab?`, `/sops`, `/work-orders/:id?` (supervisors and admins also get a **Pending approval** tab), `/history`, `/settings/:section?`, `/login`. Filters, sort, and page live in the URL.

In development, labelled sample data stands in when the API is unreachable. Production builds show the real error instead; set `VITE_DEMO_DATA=true` (sample data) or `VITE_DEMO_SIGNIN=true` (one-click demo accounts) only for demo deployments. Run the UI tests with `npm test`.

### 5. Docker Compose profiles
```bash
docker compose up --build                                   # backend + frontend + ollama
docker compose --profile mqtt up --build                    # + Mosquitto broker
docker compose --profile observability up --build           # + Prometheus :9090, Grafana :3001
docker compose --profile postgres up --build                # + PostgreSQL :5432 (requires POSTGRES_PASSWORD in .env)
docker compose --profile all up --build                     # everything
```

---

## Configuration

Key settings (`backend/app/config.py`, defaults overridable via `.env`):

| Variable | Default | Notes |
| :--- | :--- | :--- |
| `ENV` | `development` | `production` refuses to boot on default secrets (`validate_prod_secrets()`) |
| `LLM_PROVIDER` | `ollama` | `ollama` or `azure_openai` |
| `OLLAMA_BASE_URL` / `LLM_MODEL` | `http://localhost:11434` / `qwen2.5:7b` | Local inference |
| `AZURE_OPENAI_ENDPOINT` / `DEPLOYMENT` / `API_KEY` | empty | Required when `LLM_PROVIDER=azure_openai` |
| `EMBEDDING_MODEL_NAME` | `BAAI/bge-large-en-v1.5` | Downloaded from HuggingFace on first ingest |
| `DATABASE_PATH` / `VECTOR_STORE_DIR` / `DOCS_DIR` | `backend/app/database/maintenance.db` / `vector_store` / `data` | Local paths |
| `JWT_SECRET` | dev default | Must be 32+ chars, non-default in prod |
| `TELEMETRY_HMAC_SECRET` / `TELEMETRY_HMAC_REQUIRED` | dev default / `False` | Prod requires override + `True` |
| `PERSISTENCE_BACKEND` / `DATABASE_URL` | `sqlite` | Set `postgres` + `DATABASE_URL` for production |
| `MQTT_ENABLED` / `MQTT_BROKER_HOST` | `False` / `localhost` | Enable with `--profile mqtt` |
| `VECTOR_BACKEND` | `faiss` | `faiss` today; `milvus` / `azure_search` on roadmap |

Secrets are never stored in the repository. Locally they live in `.env`; in Kubernetes they come from a `copilot-secrets` Secret you create yourself (see [Deployment](#deployment)).

---

## Local Development Accounts

> [!WARNING]
> These are **local dev seeds only** created by `scripts/seed_db.py` / migrations. Password values are intentionally not published here. Change or remove them in any shared or production environment. Technicians cannot approve actions; only `supervisor`/`admin` can.

| Username | Role | Privileges |
| :--- | :---: | :--- |
| `tech1` | `technician` | Query chat, request work orders, initiate inspections |
| `supervisor1` | `supervisor` | Authorize / reject pending work orders, alarms, inspections |
| `admin1` | `admin` | Full plant registry access and system administration |

---

## Tests and Benchmarks

```bash
# Fast subset (<60s, no model download)
pytest backend/tests/ -q -m "not slow"

# Full suite (embedding/LLM marked slow, HF cache required)
pytest backend/tests/ -v

# Contract + API slice (same as CI backend-fast)
pytest backend/tests/test_api_contract.py backend/tests/test_v1_api.py backend/tests/test_design_spec_api.py -q -m "not slow"

# 100-case extended evaluation benchmark
python scripts/evaluate_extended.py

# Fast 50-case CI benchmark
python scripts/evaluate_ci.py
```

### Machine telemetry simulation
```bash
# Mechanical vibration & thermal REST telemetry with HMAC signing
python scripts/simulate_telemetry.py --transport rest --scenario mechanical --rate 2.0

# Semiconductor plasma RF power deviation via MQTT (QoS 1)
python scripts/simulate_telemetry.py --transport mqtt --scenario semiconductor --rate 1.0
```

```bash
# Backfill 24 h of simulated continuous sensor samples (spindle speed, temperature, vibration, motor current)
# for the Diagnostics "Live data" charts
python scripts/simulate_telemetry.py --samples --machines EQ-1000,EQ-1001 --hours 24 --step-minutes 10
```

Postgres live check: `python scripts/verify_postgres.py --verify-counts`.

---

## Deployment

```bash
# 1. Create the runtime secret (values come from your secret manager, never from git)
kubectl create namespace industrial-copilot
kubectl -n industrial-copilot create secret generic copilot-secrets   --from-literal=DATABASE_URL=...   --from-literal=CHECKPOINT_DATABASE_URL=...   --from-literal=JWT_SECRET=...   --from-literal=TELEMETRY_HMAC_SECRET=...

# 2. Deploy base manifests (ConfigMap, PVC, backend, frontend, ingress)
kubectl apply -k deploy/k8s/base/

# 3. Optional: GPU-accelerated Ollama overlay
kubectl apply -k deploy/k8s/overlays/gpu/
```

In production, prefer ExternalSecrets or Azure Key Vault (`AZURE_KEYVAULT_URL`) over hand-created secrets. CI validates the manifests with `kubectl kustomize deploy/k8s/base` + `kubeconform`. Edge install notes: `docs/runbooks/edge-deploy.md`.

Files that stay local and are never committed (`.env`, databases, the FAISS index, build output) are listed in `.gitignore`.

---

## Contributing

- Branch from `master` and keep PRs focused.
- Before opening a PR, run `pytest backend/tests/ -q -m "not slow"`, and for UI changes `npm run lint`, `npm test`, and `npm run build` in `frontend/`.
- API changes: regenerate `docs/api/openapi.json` and `frontend/src/api/types.ts` (`npm run openapi`); the contract is checked by `backend/tests/test_api_contract.py`.
- Architecture decisions live in `docs/adr/`; notable changes in `CHANGELOG.md`.
- Please report security issues privately to the maintainer rather than in a public issue.

---

## License

MIT, see [`LICENSE`](LICENSE). Changelog: [`CHANGELOG.md`](CHANGELOG.md).
