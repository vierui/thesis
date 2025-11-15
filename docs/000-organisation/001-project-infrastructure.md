# Implementation Log - October 2025

This log tracks all implementations, technical decisions, and rationale for the master's thesis project. It serves as the foundation for thesis report writing.

---

## 2025-10-25 | Project Infrastructure Setup

### What was implemented
- Comprehensive `.gitignore` configuration
- Updated `CLAUDE.md` with strict workflow controls and architecture guidelines
- Established implementation logging structure

### Why (Technical Rationale)
- **Git Safety**: Prevent accidental commits of sensitive data (docs, secrets, models, CITI repos)
- **Workflow Control**: Ensure systematic, safe development process with explicit approvals
- **Traceability**: Document all technical decisions for thesis writing

### How (Approach)
- Added exclusions: documentation dirs, OS files, IDE configs, secrets, ML artifacts
- Defined strict 5-step workflow: Plan → Present → Approval → Implement → Verify
- Created monthly implementation log template

### Results & Observations
- Successfully excluded `0-docs/`, `1-theory/`, `2-citi-kms/` from git tracking
- Verified safety: no sensitive files in git status
- Established foundation for disciplined development

### Decisions Made
- Use `uv` exclusively for Python dependency management
- Monthly implementation logs (YYYY-MM format)
- Google-style docstrings for code documentation
- Conventional commit format for git messages
- Never mention AI tools in commits

---

## 2025-10-27 | Dual-System ML Infrastructure Setup (Mac + Ubuntu GPU Server)

### What was implemented

**Phase 3 - Ubuntu GPU Server Setup:**
- Installed NVIDIA Container Toolkit for Docker GPU access on Ubuntu 24.04
- Created `~/thesis-ml/` project structure on Ubuntu
- Built custom embedding server using FastAPI + sentence-transformers
- Created Docker Compose stack with 3 services:
  - vLLM server serving Llama-3.2-3B-Instruct on port 8000
  - Embedding server with BAAI/bge-m3 model on port 8001
  - Milvus standalone vector database on port 19530
- Configured GPU passthrough for Docker containers
- Set up HuggingFace token for model downloads
- Verified GPU utilization with RTX 4080 (16GB VRAM)
- Tested LLM generation and embedding endpoints successfully
- Created document storage structure at `~/thesis-data/documents/`

**Phase 4 - Mac Development Stack:**
- Created `mac-services/` directory with PostgreSQL Docker Compose
- Started PostgreSQL container for metadata storage
- Configured `.env` files for llm-rag-citi backend with Ubuntu Tailscale IPs
- Configured `.env` files for front-end with local PostgreSQL connection
- Connected Mac services to Ubuntu GPU server via Tailscale VPN
- Initialized Milvus vector database collections using `create_db.py`
- Set up Python virtual environment with uv for Flask backend
- Installed npm dependencies for Next.js frontend
- Ran Prisma database migrations to create PostgreSQL schema
- Created `scripts/` directory structure for automation (partial)

**Network Architecture:**
- Established Tailscale VPN mesh network between Mac (home) and Ubuntu (school)
- Mac assigned Tailscale IP: `100.64.x.2`
- Ubuntu assigned Tailscale IP: `100.64.x.1`
- Persistent encrypted connection surviving dynamic IP changes
- Zero exposed ports to public internet (firewall-friendly)

### Why (Technical Rationale)

**Dual-System Design Decision:**
- **Separation of Concerns**: Lightweight services (UI, business logic) on Mac; GPU-intensive compute on Ubuntu
- **Development Velocity**: Hot reload and debugging on Mac without GPU overhead
- **Cost Efficiency**: Leverage school's 24/7 GPU access without personal hardware investment
- **Reliability**: Ubuntu always-on for long-running experiments; Mac can disconnect/travel
- **Document Storage Colocation**: Store documents on Ubuntu to avoid network transfer overhead during embedding generation

**Why Tailscale over SSH Tunneling:**
- **Dynamic IP Handling**: School and home networks have dynamic IPs; Tailscale auto-reconnects
- **Location Independence**: Works from home, school, coffee shops without configuration changes
- **Security**: Zero-trust mesh network, encrypted WireGuard protocol
- **Simplicity**: No manual tunnel management, port forwarding, or VPN server setup
- **Reliability**: Auto-reconnects on network changes, survives laptop sleep/wake

**Technology Stack Choices:**

1. **vLLM for LLM Serving:**
   - OpenAI-compatible API (drop-in replacement)
   - Excellent GPU utilization with PagedAttention
   - Streaming support for real-time responses
   - Production-ready (used by major companies)

2. **Llama-3.2-3B-Instruct (vs. 8B):**
   - Faster inference for development/testing (~50 tokens/sec vs ~20)
   - Lower VRAM usage (4GB vs 8GB), leaves room for embeddings
   - Good enough quality for pipeline testing
   - Can swap to 8B or fine-tuned models later

3. **BAAI/bge-m3 for Embeddings:**
   - State-of-art multilingual embeddings
   - 1024 dimensions (good balance of quality/size)
   - Supports hybrid search (dense + sparse)
   - Already used in CITI KMS

4. **Docker Compose:**
   - Reproducible environment across machines
   - Easy GPU passthrough with NVIDIA runtime
   - Simple restart/rebuild workflow
   - Service isolation (vLLM crash doesn't affect Milvus)

5. **Documents on Ubuntu (not Mac):**
   - **Problem**: Uploading 100MB PDFs from Mac → Ubuntu wastes bandwidth
   - **Solution**: Store on Ubuntu, colocate with embedding generation
   - **Backup**: Automated rsync Ubuntu → Mac (future implementation)

### How (Approach)

**Ubuntu Setup Commands:**
```bash
# NVIDIA Container Toolkit installation
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker

# Project structure
mkdir -p ~/thesis-ml/{models,milvus-data,logs,embedding-server}
mkdir -p ~/thesis-data/documents/{public,private}

# Created embedding server
# - Dockerfile: python:3.10-slim + FastAPI + sentence-transformers
# - server.py: FastAPI app with /embed and /health endpoints

# Created docker-compose.yml with:
# - vLLM: GPU access, model caching, health checks
# - Embeddings: Custom image, GPU access, batch processing
# - Milvus: Standalone mode, local storage

# Started services
cd ~/thesis-ml
docker-compose build embeddings
docker-compose up -d

# First startup downloaded:
# - Llama-3.2-3B-Instruct: ~6GB, took ~10 minutes
# - BAAI/bge-m3: ~2GB, took ~5 minutes

# Verification
docker-compose ps  # All services "Up (healthy)"
nvidia-smi         # GPU showing vllm and python processes
curl http://localhost:8000/health  # vLLM OK
curl http://localhost:8001/health  # Embeddings OK
curl http://localhost:9091/healthz # Milvus OK
```

**Mac Setup Commands:**
```bash
# PostgreSQL setup
mkdir -p ~/Documents/Master/thesis/mac-services
cd ~/Documents/Master/thesis/mac-services
# Created docker-compose.yml for PostgreSQL
docker-compose up -d
docker exec thesis-postgres psql -U kms_user -d kms -c "SELECT version();"  # Test

# Backend configuration
cd ~/Documents/Master/thesis/2-citi-kms/llm-rag-citi
# Created .env with:
# - LLM_URL=http://100.64.x.1:8000/v1 (Ubuntu Tailscale IP)
# - EMBEDDING_URL=http://100.64.x.1:8001
# - MILVUS_URI_DEV=http://100.64.x.1:19530
# - DATABASE_URL=postgresql://kms_user:dev_password@localhost:5432/kms (local)

# Python environment
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt  # ~3 minutes

# Initialize Milvus
python scripts/create_db.py dev kms_dev

# Frontend configuration
cd ~/Documents/Master/thesis/2-citi-kms/front-end
# Created .env with DATABASE_URL (local PostgreSQL)
npm install
npx prisma migrate dev
npx prisma generate

# Connectivity testing
curl http://100.64.x.1:8000/health  # vLLM reachable from Mac
curl http://100.64.x.1:8001/health  # Embeddings reachable
curl http://100.64.x.1:9091/healthz # Milvus reachable
```

**Network Configuration:**
```bash
# On both machines:
# Installed Tailscale, authenticated with same account
# Ubuntu got IP: 100.64.x.1
# Mac got IP: 100.64.x.2
# Verified connectivity: ping 100.64.x.1 (from Mac)
```

### Results & Observations

**Successes:**
- ✅ RTX 4080 fully detected and utilized by Docker containers
- ✅ vLLM serving Llama-3.2-3B at ~50 tokens/sec (fast inference)
- ✅ Embedding server generating 1024-dim vectors successfully
- ✅ Milvus vector database operational with collections created
- ✅ Tailscale connection stable across Mac (home WiFi) ↔ Ubuntu (school network)
- ✅ Mac can reach all Ubuntu services via Tailscale IPs without issues
- ✅ PostgreSQL operational on Mac for metadata storage
- ✅ Cross-network latency excellent: <50ms for API calls
- ✅ No firewall issues (Tailscale handles NAT traversal)

**Performance Metrics:**
- vLLM startup time: ~30 seconds (model loading)
- Embedding server startup: ~15 seconds (model loading)
- Milvus startup: ~10 seconds
- LLM inference: ~50 tokens/sec (Llama-3.2-3B on RTX 4080)
- Embedding generation: ~100 texts/sec (batch size 32)
- Network latency Mac→Ubuntu: 30-50ms (across different networks)
- First model download: ~15 minutes total (one-time)

**Challenges Encountered:**

1. **GPU Memory Allocation:**
   - **Issue**: Default vLLM tried to use 90% GPU memory, leaving none for embeddings
   - **Solution**: Set `--gpu-memory-utilization 0.6` (60% for vLLM, 30% for embeddings)
   - **Result**: Both services run simultaneously without OOM errors

2. **Model Download Time:**
   - **Issue**: Initial startup took 15 minutes (downloading models)
   - **Expected**: First-time setup, models cached in `~/thesis-ml/models/`
   - **Future**: Subsequent startups take <1 minute

3. **Milvus Health Check Timing:**
   - **Issue**: Docker health check failed initially (timeout too short)
   - **Solution**: Increased `start_period: 90s` in docker-compose.yml
   - **Result**: Health checks now pass consistently

4. **Empty Scripts Directory:**
   - **Issue**: `scripts/` created but `start-dev.sh` not completed
   - **Status**: Manual service startup working, automation script deferred
   - **Impact**: Low (manual startup is simple for now)

**Observations:**
- Docker Compose restarts are fast (~5 seconds) for config changes
- GPU memory fragmentation not observed yet (may appear with long runs)
- Tailscale connection never dropped during 4+ hours of testing
- vLLM logs are verbose but useful for debugging
- Milvus creates ~500MB of data even with empty collections (metadata overhead)

### Decisions Made

**1. Service Distribution (Mac vs. Ubuntu):**
- **Decision**: Mac runs UI/API, Ubuntu runs GPU/storage
- **Rationale**:
  - Mac needs fast iteration (hot reload for Next.js, easy Flask restart)
  - Ubuntu has GPU (required for LLM and embeddings)
  - Document storage on Ubuntu avoids network transfer during processing
- **Trade-off**: Slightly higher latency for API calls (30-50ms), but acceptable

**2. Document Storage Location:**
- **Decision**: Store all documents on Ubuntu at `~/thesis-data/documents/`
- **Rationale**:
  - Colocate documents with embedding generation (no transfer overhead)
  - Ubuntu has more storage (~1TB SSD vs Mac's limited space)
  - Automated backups Ubuntu → Mac scheduled for future
- **Trade-off**: Cannot access documents offline on Mac (acceptable, working remotely via Tailscale)

**3. Model Selection (Llama-3.2-3B vs. 8B):**
- **Decision**: Use Llama-3.2-3B-Instruct for development
- **Rationale**:
  - 2.5x faster inference (50 vs 20 tokens/sec)
  - Uses half the VRAM (4GB vs 8GB), allows embeddings to run simultaneously
  - Quality sufficient for pipeline testing and development
- **Future**: Swap to Llama-3-8B or fine-tuned model for final experiments
- **Trade-off**: Slightly lower quality responses (acceptable for dev phase)

**4. Tailscale VPN vs. SSH Tunneling:**
- **Decision**: Use Tailscale as primary connection method
- **Rationale**:
  - Handles dynamic IPs automatically (school and home networks change)
  - Zero configuration, no manual tunnel management
  - Works across different networks without VPN setup
  - Secure by default (encrypted WireGuard)
- **Alternative Considered**: SSH tunnels with port forwarding
  - Rejected because: Requires manual reconnection, breaks on network changes, complex script management

**5. Milvus Standalone vs. Cluster:**
- **Decision**: Milvus standalone mode (single container)
- **Rationale**:
  - Thesis workload is single-user, no need for distributed setup
  - Simpler deployment and debugging
  - Lower resource overhead (no etcd cluster, no distributed components)
- **Future**: Can migrate to cluster if dataset grows beyond single-node capacity

**6. PostgreSQL on Mac (not Ubuntu):**
- **Decision**: Run PostgreSQL locally on Mac
- **Rationale**:
  - Metadata is small (chat history, user data, document metadata)
  - Local database = faster queries for frontend
  - No network latency for UI operations
  - Easy to reset/test without affecting Ubuntu
- **Trade-off**: Database not shared with Ubuntu, but not needed (Milvus is on Ubuntu)

**7. Docker Compose over Kubernetes:**
- **Decision**: Use Docker Compose for Ubuntu services
- **Rationale**:
  - Single-node deployment (no orchestration needed)
  - Simple restart workflow for development
  - Lower complexity, easier debugging
  - Thesis focus is ML optimization, not infrastructure
- **Alternative Considered**: Kubernetes for "production-like" setup
  - Rejected because: Overkill for single-node, adds complexity, slows iteration

### Technical Specifications

**Ubuntu GPU Server:**
- OS: Ubuntu 24.04.3 LTS (Kernel 6.14.0-33-generic)
- CPU: Intel i7-12700 (20 cores @ 4.8GHz)
- GPU: NVIDIA RTX 4080 (16GB VRAM, CUDA 12.0)
- RAM: 64GB DDR4
- Storage: SSD (sufficient for models and documents)
- Network: School LAN, dynamic IP
- Uptime: 24/7, physical access for maintenance
- Tailscale IP: `100.64.x.1`

**Mac Development Machine:**
- Location: Home/mobile (remote from Ubuntu)
- Services: Next.js (3000), Flask (5000), PostgreSQL (5432)
- Storage: Local for code, backups of documents (future)
- Tailscale IP: `100.64.x.2`

**Docker Services on Ubuntu:**
- **vLLM**:
  - Port: 8000
  - Model: meta-llama/Llama-3.2-3B-Instruct
  - GPU Memory: 60% (~9.6GB)
  - API: OpenAI-compatible (`/v1/chat/completions`)

- **Embeddings**:
  - Port: 8001
  - Model: BAAI/bge-m3
  - Output: 1024-dimensional vectors
  - Batch Size: 32 (configurable)

- **Milvus**:
  - Port: 19530 (API), 9091 (metrics)
  - Mode: Standalone
  - Storage: Local filesystem (`~/thesis-ml/milvus-data/`)
  - Collections: `kms_dev` (created)

**Network:**
- Protocol: Tailscale (WireGuard-based VPN mesh)
- Latency: 30-50ms cross-network
- Bandwidth: Sufficient for API calls (not tested with large file transfers yet)
- Security: End-to-end encrypted, zero exposed ports

---

