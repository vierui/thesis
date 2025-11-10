# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Master's thesis investigating Knowledge Management Systems using RAG (Retrieval-Augmented Generation) technology, building upon the CITI KMS implementation.

**Repository Structure:**
- `src/` - Python source code
- `0-docs/roadmap/` - High-level planning (Gantt, roadmap, proposal) (NOT in git)
- `0-docs/implementation/` - **Phase-based implementation work aligned with Gantt** (NOT in git)
- `0-docs/research/` - Generic research materials (papers, notes) (NOT in git)
- `1-theory/` - Literature and theoretical foundations (NOT in git)
- `2-citi-kms/` - CITI KMS repositories - read-only reference (NOT in git)
- `pyproject.toml` - Project config using **uv** for dependency management

## Distributed Multi-Node Architecture

**This project runs on MULTIPLE machines connected via Tailscale VPN mesh:**

**Mac (Orchestration Machine - Development):**
- Role: Backend orchestration, frontend UI, development
- Services: Flask backend (5000), Next.js frontend (3000), PostgreSQL (5432)
- Activities: Code editing, git operations, orchestrating calls to remote model nodes
- Tailscale IP: Check with `tailscale ip -4`
- **Orchestrates all model services running on remote GPU nodes**

**Remote GPU Nodes (4 nodes - CITI Infrastructure):**

All nodes connected via Tailscale VPN, accessible via SSH with sudo access.

**Node 1 - vLLM Server:**
- Service: vLLM serving YannQi/R-4B model
- Port: `8000` (OpenAI-compatible API)
- Container: `lkc-vlm-model`
- GPU: NVIDIA (device 0)
- Deploy: `cd 2-citi-kms/infra/vlm-model && docker compose up -d`

**Node 2 - LLM Server:**
- Service: LocalAI with Gemma3-4b-qat
- Port: `8080`
- Container: `lkc-llm-model`
- GPU: NVIDIA (device 0)
- Deploy: `cd 2-citi-kms/infra/llm-model && docker compose up -d`

**Node 3 - Embedding Server:**
- Service: BGE-M3 embedding model
- Port: `1234`
- Container: `lkc-bge-m3-embedding-service`
- GPU: NVIDIA (device 0)
- Deploy: `cd 2-citi-kms/infra/embedding-model && make setup && make up`
- Note: Clones from separate `bge-ma012` repository

**Node 4 - Vector Database:**
- Service: Milvus (+ etcd + MinIO)
- Ports: `19530` (Milvus), `9091` (health), `9000/9001` (MinIO)
- Containers: `lkc-milvus-standalone`, `lkc-milvus-etcd`, `lkc-milvus-minio`
- Deploy: `cd 2-citi-kms/infra/milvus && docker compose up -d`
- Network: Custom bridge `lkc-milvus`

**Connection: Tailscale VPN Mesh**
- All nodes (Mac + 4 GPU nodes) in same Tailscale network
- Secure, encrypted, peer-to-peer
- Survives dynamic IP changes
- No exposed ports, firewall-friendly
- Flask on Mac orchestrates calls to all remote services

**Architecture Rationale:**
- **Mac**: Development agility, orchestration logic, UI, git operations
- **Distributed GPU nodes**: Dedicated resources per model, service isolation, no GPU contention
- **Prototype environment**: No active users, full control for experimentation

## Strict Workflow Control

**ALL changes must follow:**

1. **Plan First** - Analyze thoroughly, identify all affected files, potential side effects
2. **Present Plan** - Show what, why, risks
3. **Wait for "yes"** - Never proceed without explicit approval
4. **Implement Only Approved Changes** - Don't change anything else, don't break anything
5. **Verify Safety** - Check gitignore, staged files, no secrets before commit

**Golden Rule:** When in doubt, ASK. No assumptions, no proactive changes.

## Development Setup

**Python:** ≥3.10.12 | **Package Manager:** uv

```bash
uv sync                    # Install dependencies
uv run src/main.py         # Run main script
uv add <package>           # Add dependency
uv add --dev <package>     # Add dev dependency
```

## Development Workflow - Multi-Node System

**Code Changes (Primary: Mac):**
- Edit code on Mac (VSCode, preferred)
- Run Flask backend on Mac (orchestrates calls to remote GPU nodes via Tailscale)
- Run Next.js frontend on Mac
- Git operations on Mac (commit, push)
- Remote node services restart only if Docker config changes

**Configuration Files:**
- `.env` files are machine-specific (NOT in git)
- Mac `.env`: Points to remote node Tailscale IPs for each service
  - `LLM_URL=http://<node1-ip>:8000` (vLLM)
  - `HYDE_LLM_URL=http://<node2-ip>:8080` (LocalAI)
  - `EMBEDDING_URL=http://<node3-ip>:1234` (BGE-M3)
  - `MILVUS_URI=http://<node4-ip>:19530` (Milvus)
- Remote node `.env`: Contains HuggingFace tokens, GPU configs
- Template: `.env.example` tracked in git (without secrets)

**Running Services:**

*On Mac (development):*
```bash
# Start local services
cd ~/Documents/Master/thesis/2-citi-kms/llm-rag-citi
# Start Flask backend (orchestrator)
python runner.py

# Start frontend (separate terminal)
cd ~/Documents/Master/thesis/2-citi-kms/front-end
npm run dev
```

*On Remote GPU Nodes (via SSH):*
```bash
# Node 1 - vLLM
ssh <node1> 'cd /path/to/infra/vlm-model && docker compose up -d'

# Node 2 - LLM
ssh <node2> 'cd /path/to/infra/llm-model && docker compose up -d'

# Node 3 - Embedding
ssh <node3> 'cd /path/to/infra/embedding-model && make up'

# Node 4 - Milvus
ssh <node4> 'cd /path/to/infra/milvus && docker compose up -d'

# Check status on any node
ssh <node> 'docker ps'
```

**Quick Deploy All Services:**
```bash
# From infra/ directory
make run-vlm-model
make run-llm-model
make run-embedding-model
make run-milvus
```

**Debugging:**
- Mac services: Local logs, direct terminal output
- Remote services: `ssh <node> 'docker logs -f <container-name>'`
- GPU usage: `ssh <node> 'nvidia-smi'`
- Network: Test each endpoint:
  ```bash
  curl http://<node1-ip>:8000/v1/models  # vLLM
  curl http://<node2-ip>:8080/v1/models  # LocalAI
  curl http://<node3-ip>:1234/health     # Embedding
  curl http://<node4-ip>:9091/healthz    # Milvus
  ```

**Data Flow:**
- **Document ingestion**: Frontend (Mac) → Flask API (Mac) → Embedding service (Node 3) → Milvus (Node 4)
- **Query**: Frontend (Mac) → Flask API (Mac) → Milvus search (Node 4) → LLM generation (Node 1 or 2) → Response streamed to frontend
- **HyDE**: Flask (Mac) → LocalAI (Node 2) for hypothetical doc → Embedding (Node 3) → Milvus (Node 4)
- **Orchestration**: All service coordination logic runs on Mac Flask backend

## Architecture Guidelines

**Code Organization:**
- Modular, single-purpose modules
- Type hints on all functions (Python 3.10+)
- Google-style docstrings explaining "why"
- Tests for critical functionality (pytest)

**ML/LLM Requirements:**
- Set random seeds explicitly
- Document model versions, hyperparameters
- Never commit model weights - use external storage
- Version models with clear naming
- Use `.env` for config (never commit, provide `.env.example`)

## Implementation Organization

**Structure:** Phase-based folders aligned with Gantt chart timeline

```
0-docs/
├── roadmap/                    # High-level planning (Gantt, roadmap, proposal)
├── implementation/             # Phase-based implementation work
│   ├── 000-setup/             # Oct 1-15: Setup & Preparation
│   ├── 100-literature/        # Oct 15-31: Literature Review
│   ├── 200-design/            # Nov 1-30: Architecture & Design
│   ├── 300-citi-baseline/     # Dec 1-23: CITI Baseline & Analysis
│   ├── 400-optimization/      # Jan 3-31: Optimization Modules
│   ├── 500-integration/       # Jan 15-Feb 15: Integration & Testing
│   ├── 600-evaluation/        # Feb 1-28: Experiments & Benchmarks
│   ├── 700-analysis/          # Feb 15-Mar 1: Results Analysis
│   └── 800-writing/           # Mar 1-15: Thesis Writing
└── research/                   # Generic research (papers, notes, not phase-specific)
```

**Numbering System (Gantt-aligned):**
- **000-099:** Setup & Preparation (Oct 1-15)
- **100-199:** Literature Review (Oct 15-31)
- **200-299:** Design & Architecture (Nov 1-30)
- **300-399:** Implementation Phase 1 - CITI Baseline (Dec 1-23)
- **400-499:** Implementation Phase 2 - Optimization Modules (Jan 3-31)
- **500-599:** Integration & Testing (Jan 15-Feb 15)
- **600-699:** Evaluation & Experiments (Feb 1-28)
- **700-799:** Analysis & Discussion (Feb 15-Mar 1)
- **800-899:** Writing & Finalization (Mar 1-15)
- **900-999:** Archives & Deprecated

**File Naming Convention:**
- Format: `[PhaseID][Sequence]-[descriptive-name].md`
- Examples: `301-citi-setup.md`, `402-pruning.md`, `601-benchmark-design.md`
- Subfolders: `310-topic/` for multi-file topics (e.g., `310-kms-description/`)

**Implementation Logging:**

**CRITICAL:** Each phase folder contains `README.md` with implementation log.

**AUTOMATIC LOGGING RULE (MUST FOLLOW):**

When Claude completes ANY implementation task, Claude MUST immediately update the appropriate phase README.md BEFORE asking for commit approval.

**Required format for each log entry in phase README.md:**
```markdown
### YYYY-MM-DD | [Task Name] ([File Numbers])
**What:** Concrete description of what was implemented

**Why:** Technical rationale - reason for decisions, problem being solved

**How:** Technical approach - tools, commands, technologies, step-by-step if complex

**Results:** What worked, performance metrics, issues encountered and resolved

**Decisions:** Key technical decisions, trade-offs, why chosen over alternatives

**Links:** [[file1.md]], [[file2.md]]
```

**Research Organization:**
- **Phase-specific research:** `0-docs/implementation/[phase]/research/`
  - Example: CITI-specific docs → `300-citi-baseline/research/`
- **Generic research:** `0-docs/research/` (papers, general notes, not tied to phases)

**Purpose:** Foundation for thesis report writing and technical decision traceability. Phase-based structure directly maps to thesis chapters and Gantt timeline.

## Git Workflow

**Commit Format:**
```
<type>: <subject>

<body>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

**Rules:**
- Never mention AI/Claude in commits
- Atomic, focused commits with clear messages
- Reference thesis sections when relevant
- `main` = stable code only

## Safety Protocols

**Before ANY commit, verify:**
1. `git status` - Only intended files staged
2. `git diff --staged` - Review all changes
3. No secrets: API keys, tokens, credentials, `.env` files
4. No large files: models (`.pt`, `.pth`, `.ckpt`, `.h5`), datasets
5. No personal docs: `0-docs/`, `1-theory/`, `2-citi-kms/`

## CITI KMS Context

Repositories in `2-citi-kms/` are cloned from the CITI organization (https://github.com/CITI-KnowledgeManagementSystem):
- `llm-rag-citi` - Flask RAG engine (backend orchestrator)
- `front-end` - Next.js UI
- `admin-interface` - Admin dashboard
- `LightRAG-Implementation` - Graph-based RAG
- `ragas-local-implementation` - Evaluation framework
- `infra/` - Infrastructure deployment configs for 4 GPU nodes

**IMPORTANT: These repos are NOT tracked in this thesis git repository** (gitignored). They are actively developed by the organization and may be updated by others.

### CITI KMS Infrastructure Deployment

The `2-citi-kms/infra/` directory contains Docker Compose configurations for deploying model services on remote GPU nodes.

**Directory Structure:**
```
infra/
├── Makefile                    # Orchestration commands for all services
├── vlm-model/
│   └── docker-compose.yml      # vLLM (YannQi/R-4B) on port 8000
├── llm-model/
│   └── docker-compose.yml      # LocalAI (Gemma3-4b-qat) on port 8080
├── embedding-model/
│   ├── Makefile
│   ├── setup.sh                # Clones bge-ma012 repo
│   └── bge-ma012/              # BGE-M3 service (cloned, not in git)
├── milvus/
│   └── docker-compose.yml      # Milvus + etcd + MinIO on port 19530
└── postgresql/
    └── docker-compose.yml      # PostgreSQL (if needed on separate node)
```

**Deployment Model:**
- Each service deployed independently on dedicated GPU node
- All services use NVIDIA runtime with GPU device 0
- Services communicate via Tailscale VPN mesh
- Mac Flask backend orchestrates all remote services
- **Prototype environment**: No active users, full SSH/sudo access for experiments

### CITI KMS Version Tracking (Manual)

**CRITICAL for Thesis Reproducibility:**

When running experiments or making significant changes, ALWAYS log the exact CITI KMS versions being used.

**Check current versions:**
```bash
cd ~/Documents/Master/thesis/2-citi-kms/llm-rag-citi
git log -1 --format="%H %s" --oneline
# Output: abc123def feat: update retrieval algorithm

cd ~/Documents/Master/thesis/2-citi-kms/front-end
git log -1 --format="%H %s" --oneline
```

**Log versions in implementation log:**
Every experiment entry in `0-docs/implementation-log/YYYY-MM-implementation.md` MUST include:
```markdown
### CITI KMS Versions Used
- llm-rag-citi: commit abc123 (2025-10-27)
- front-end: commit def456 (2025-10-27)
- admin-interface: commit ghi789 (2025-10-27)
```

**Update CITI repos:**
```bash
# Pull latest changes from organization
cd ~/Documents/Master/thesis/2-citi-kms/llm-rag-citi
git pull origin main

cd ~/Documents/Master/thesis/2-citi-kms/front-end
git pull origin main

# Test that nothing broke after update
# Log new versions in implementation log
```

**Best Practices:**
- Update CITI repos BETWEEN major experiments (not during)
- Lock versions during thesis chapter work (consistency)
- Document why you updated (bug fix, new feature needed, etc.)
- Test thoroughly after organization updates

## Final Reminder

**Plan → Review → Approval → Implementation → Verification**

- Use uv for all dependencies
- Log in `0-docs/implementation-log/YYYY-MM-implementation.md`
- Verify git safety before commits
- Don't break existing functionality
- Don't change anything beyond approved scope
