# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Master's thesis investigating Knowledge Management Systems using RAG (Retrieval-Augmented Generation) technology, building upon the CITI KMS implementation.

**Repository Structure:**
- `src/` - Python source code
- `0-docs/implementation-log/` - **Implementation tracking and changelog** (NOT in git)
- `0-docs/` - Research notes, meeting logs (NOT in git)
- `1-theory/` - Literature and theoretical foundations (NOT in git)
- `2-citi-kms/` - CITI KMS repositories - read-only reference (NOT in git)
- `pyproject.toml` - Project config using **uv** for dependency management

## Dual-System Architecture

**This project runs on TWO machines connected via Tailscale VPN:**

**Mac (Development Machine - Home/Mobile):**
- Role: Development, lightweight services, UI
- Services: Next.js frontend (3000), Flask backend (5000), PostgreSQL (5432)
- Activities: Code editing, git operations, debugging, hot reload
- Tailscale IP: `100.64.x.2` (check with `tailscale ip -4`)

**Ubuntu GPU Server (School - 24/7):**
- Role: Heavy compute, GPU inference, vector storage, document storage
- Hardware: Intel i7-12700, RTX 4080 16GB, 64GB RAM
- Services:
  - vLLM (LLM inference): `100.64.x.1:8000`
  - Embedding server: `100.64.x.1:8001`
  - Milvus vector DB: `100.64.x.1:19530`
- Storage: `~/thesis-data/documents/` - ALL documents stored here
- Uptime: Always on, accessible remotely via Tailscale

**Connection: Tailscale VPN Mesh**
- Secure, encrypted, peer-to-peer
- Survives dynamic IP changes (home WiFi, school network, etc.)
- No exposed ports, firewall-friendly
- Persistent connection, no manual tunneling

**Service Distribution Rationale:**
- Mac: Fast iteration (hot reload), easy debugging, no GPU needed
- Ubuntu: GPU-bound tasks, heavy I/O, 24/7 availability, document colocation

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

## Development Workflow - Dual System

**Code Changes (Primary: Mac):**
- Edit code on Mac (VSCode, preferred)
- Run Flask backend locally on Mac (calls Ubuntu services via Tailscale)
- Run Next.js frontend locally on Mac
- Git operations on Mac (commit, push)
- Ubuntu services restart only if Docker config changes

**Configuration Files:**
- `.env` files are machine-specific (NOT in git)
- Mac `.env`: Points to Ubuntu Tailscale IPs (`100.64.x.1:8000`, etc.)
- Ubuntu `.env`: Contains HuggingFace tokens, local configs
- Template: `.env.example` tracked in git (without secrets)

**Running Services:**

*On Mac (daily development):*
```bash
# Start local services
cd ~/Documents/Master/thesis/mac-services
docker-compose up -d postgres

# Start Flask + Next.js
cd ~/Documents/Master/thesis/scripts
./start-dev.sh  # Starts both, connects to Ubuntu
```

*On Ubuntu (typically already running):*
```bash
# Check services status
ssh ubuntu-gpu
cd ~/thesis-ml
docker-compose ps

# Restart if needed
docker-compose restart vllm
```

**Debugging:**
- Mac services: Local logs, direct terminal output
- Ubuntu services: `ssh ubuntu-gpu 'docker logs -f vllm'`
- GPU usage: `ssh ubuntu-gpu 'nvidia-smi'`
- Network: Test with `curl http://100.64.x.1:8000/health`

**Data Flow:**
- User uploads doc via frontend (Mac) → Flask API (Mac) → Document saved on Ubuntu → Embedding generated on Ubuntu GPU → Stored in Milvus (Ubuntu)
- User queries → Flask API (Mac) → Milvus search (Ubuntu) → LLM generation (Ubuntu GPU) → Response streamed to Mac → Frontend displays

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

## Implementation Logging

**CRITICAL:** All implementations must be logged in:

`0-docs/implementation-log/YYYY-MM-implementation.md`

**AUTOMATIC LOGGING RULE (MUST FOLLOW):**

When Claude completes ANY implementation task (code changes, setup, configuration, bug fixes), Claude MUST immediately update the implementation log BEFORE asking for commit approval.

**Required format for each entry:**
```markdown
## YYYY-MM-DD | [Task Name]

### What was implemented
- Concrete bullet list of changes made

### Why (Technical Rationale)
- Reason for each major decision
- Problem being solved

### How (Approach)
- Technical approach taken
- Tools, commands, technologies used
- Step-by-step if complex

### Results & Observations
- What worked, what didn't
- Performance metrics, timing, resource usage
- Issues encountered and how resolved

### Decisions Made
- Key technical decisions
- Trade-offs considered
- Why chosen over alternatives
```

**Purpose:** Foundation for thesis report writing and technical decision traceability. The implementation log is the PRIMARY source for thesis chapters.

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
- `llm-rag-citi` - Flask RAG engine
- `front-end` - Next.js UI
- `admin-interface` - Admin dashboard
- `LightRAG-Implementation` - Graph-based RAG
- `ragas-local-implementation` - Evaluation framework

**IMPORTANT: These repos are NOT tracked in this thesis git repository** (gitignored). They are actively developed by the organization and may be updated by others.

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
