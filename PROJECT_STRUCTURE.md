# CITI KMS Project Structure (Updated)

**Last Updated:** 2025-01-10

## Architecture Overview

**Type:** Distributed Multi-Node RAG System
**Orchestration:** Mac (Flask backend)
**Compute:** 4 Remote GPU Nodes
**Connection:** Tailscale VPN Mesh
**Environment:** Prototype (no active users, full access)

---

## Physical Deployment

### Orchestration Machine (Mac - Development)
**Role:** Backend coordination, frontend UI, development
- Flask backend (port 5000) - orchestrates all remote services
- Next.js frontend (port 3000)
- PostgreSQL (port 5432) - optional, can be on separate node
- Git operations, code editing
- **Access:** Local, full control

### Remote GPU Nodes (4 Nodes - CITI Infrastructure)
**Connection:** All accessible via SSH with sudo, connected via Tailscale VPN

#### Node 1 - vLLM Server
- **Service:** vLLM (OpenAI-compatible API)
- **Model:** YannQi/R-4B (4B parameter LLM)
- **Port:** 8000
- **Container:** `lkc-vlm-model`
- **GPU:** NVIDIA device 0
- **Deploy:** `cd infra/vlm-model && docker compose up -d`
- **Purpose:** Primary LLM inference for generation

#### Node 2 - LLM Server
- **Service:** LocalAI
- **Model:** Gemma3-4b-qat (quantized)
- **Port:** 8080
- **Container:** `lkc-llm-model`
- **GPU:** NVIDIA device 0
- **Deploy:** `cd infra/llm-model && docker compose up -d`
- **Purpose:** Alternative LLM, HyDE generation

#### Node 3 - Embedding Server
- **Service:** BGE-M3 Embedding API
- **Model:** BAAI/bge-m3 (hybrid dense + sparse embeddings, 1024-dim)
- **Port:** 1234
- **Container:** `lkc-bge-m3-embedding-service`
- **GPU:** NVIDIA device 0
- **Deploy:** `cd infra/embedding-model && make setup && make up`
- **Purpose:** Document and query embeddings

#### Node 4 - Vector Database
- **Service:** Milvus (standalone) + etcd + MinIO
- **Ports:** 19530 (Milvus), 9091 (health), 9000/9001 (MinIO)
- **Containers:** `lkc-milvus-standalone`, `lkc-milvus-etcd`, `lkc-milvus-minio`
- **Deploy:** `cd infra/milvus && docker compose up -d`
- **Purpose:** Hybrid vector search (dense + sparse)

---

## Repository Structure

```
thesis/
├── src/                        # Thesis-specific Python code (in git)
├── pyproject.toml              # uv dependency management (in git)
├── CLAUDE.md                   # Project instructions for Claude Code (in git)
├── PROJECT_STRUCTURE.md        # This file (in git)
├── 0-docs/                     # Documentation (NOT in git)
│   ├── roadmap/               # Gantt, proposal, timeline
│   ├── implementation/        # Phase-based work logs (000-800)
│   └── research/              # Papers, notes
├── 1-theory/                   # Literature review materials (NOT in git)
└── 2-citi-kms/                 # CITI repos - reference only (NOT in git)
    ├── llm-rag-citi/          # Flask RAG backend (main orchestrator)
    ├── front-end/             # Next.js UI
    ├── admin-interface/       # Admin dashboard
    ├── LightRAG-Implementation/ # Graph-based RAG alternative
    ├── ragas-local-implementation/ # Evaluation framework
    └── infra/                 # Infrastructure deployment configs
        ├── Makefile           # Service orchestration commands
        ├── vlm-model/         # vLLM deployment
        ├── llm-model/         # LocalAI deployment
        ├── embedding-model/   # BGE-M3 deployment
        ├── milvus/            # Milvus vector DB deployment
        └── postgresql/        # PostgreSQL deployment (optional)
```

---

## Data Flow

### Document Ingestion
```
Frontend (Mac)
  → Flask API (Mac)
  → Parse document
  → Embedding service (Node 3)
  → Milvus storage (Node 4)
```

### Query Processing (Standard RAG)
```
Frontend (Mac)
  → Flask API (Mac)
  → Embed query (Node 3)
  → Milvus hybrid search (Node 4)
  → LLM generation (Node 1)
  → Stream response to frontend
```

### Query Processing (with HyDE)
```
Frontend (Mac)
  → Flask API (Mac)
  → Generate hypothetical doc via LocalAI (Node 2)
  → Embed hypothetical doc (Node 3)
  → Milvus hybrid search (Node 4)
  → LLM generation (Node 1)
  → Stream response to frontend
```

---

## Key Technologies

### Backend Stack (Flask)
- **Framework:** Flask + Flask-CORS
- **LLM Integration:** LlamaIndex (OpenAI-compatible clients)
- **Vector DB:** PyMilvus
- **Document Processing:** PyPDF, MinerU, LangChain text splitters
- **Embeddings:** Custom BGE-M3 hybrid (dense + sparse)

### Frontend Stack (Next.js)
- **Framework:** Next.js 15 (React 19)
- **Auth:** Clerk
- **Database:** Prisma ORM + PostgreSQL
- **UI:** Radix UI + Tailwind CSS
- **State:** Zustand

### Model Services
- **vLLM:** Fast LLM inference with paged attention
- **LocalAI:** Alternative LLM server with CUDA support
- **BGE-M3:** Multi-vector embedding (dense, sparse, ColBERT)
- **Milvus:** Hybrid vector search with HNSW index

---

## Configuration Management

### Environment Files (.env)
**NOT tracked in git** - machine-specific

**Mac .env (Flask backend):**
```env
LLM_URL=http://<node1-tailscale-ip>:8000
HYDE_LLM_URL=http://<node2-tailscale-ip>:8080
EMBEDDING_URL=http://<node3-tailscale-ip>:1234
MILVUS_URI=http://<node4-tailscale-ip>:19530
MILVUS_USERNAME=<username>
MILVUS_PASSWORD=<password>
DOCUMENT_DIR=/path/to/documents
TAILSCALE_IP=<mac-tailscale-ip>
```

**Remote Node .env (GPU services):**
```env
HUGGING_FACE_HUB_TOKEN=<token>
NVIDIA_VISIBLE_DEVICES=0
```

**Template:** `.env.example` tracked in git (no secrets)

---

## Deployment Commands

### Start All Services (from infra/)
```bash
cd ~/Documents/Master/thesis/2-citi-kms/infra

# Deploy each service (assumes SSH keys configured)
make run-vlm-model      # vLLM on Node 1
make run-llm-model      # LocalAI on Node 2
make run-embedding-model # BGE-M3 on Node 3
make run-milvus         # Milvus on Node 4
```

### Start Mac Services
```bash
# Backend
cd ~/Documents/Master/thesis/2-citi-kms/llm-rag-citi
python runner.py

# Frontend (separate terminal)
cd ~/Documents/Master/thesis/2-citi-kms/front-end
npm run dev
```

### Health Checks
```bash
# Test each remote service
curl http://<node1-ip>:8000/v1/models    # vLLM
curl http://<node2-ip>:8080/v1/models    # LocalAI
curl http://<node3-ip>:1234/health       # Embedding
curl http://<node4-ip>:9091/healthz      # Milvus
```

### Debugging
```bash
# Check GPU usage on remote nodes
ssh <node> 'nvidia-smi'

# View container logs
ssh <node> 'docker logs -f <container-name>'

# Check running containers
ssh <node> 'docker ps'
```

---

## Research Focus

**Thesis Goal:** Optimize CITI KMS specifically

**Research Phases (Gantt-aligned):**
- **Phase 300 (Dec 1-23):** CITI Baseline & Analysis
- **Phase 400 (Jan 3-31):** Optimization Modules
- **Phase 500 (Jan 15-Feb 15):** Integration & Testing
- **Phase 600 (Feb 1-28):** Evaluation & Experiments

**Optimization Areas:**
1. Distributed tracing & telemetry
2. Latency profiling (E2E, network, service-level)
3. Energy efficiency (GPU power, J/token)
4. Memory optimization (KV cache, VRAM usage)
5. Retrieval efficiency (top-k, hybrid search, HyDE gating)
6. Prompt optimization (token reduction)
7. Model quantization experiments
8. Multi-node coordination overhead analysis

---

## Development Workflow

1. **Code on Mac** - Edit Flask backend, frontend, thesis code
2. **Git on Mac** - Commit, push, version control
3. **Deploy to nodes** - SSH + Docker commands to update services
4. **Test locally** - Flask orchestrates remote services via Tailscale
5. **Monitor remotely** - SSH logs, nvidia-smi, docker stats
6. **Experiment** - Full control, no production constraints

---

## Critical Notes

- **Prototype environment:** No active users, safe for experiments
- **Full access:** SSH + sudo on all 4 GPU nodes
- **Self-managed:** No approval process for changes
- **Manual deployment:** Docker commands (no CI/CD)
- **Tailscale mesh:** Persistent VPN, survives IP changes
- **CITI repos NOT in thesis git:** Gitignored, updated separately
- **Version tracking:** Log CITI repo commits before each experiment
