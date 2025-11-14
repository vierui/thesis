# Master's Thesis: Knowledge Management Systems with RAG

Investigating and optimizing RAG-based Knowledge Management Systems, building on CITI KMS implementation.

## Quick Start

**Setup:**
```bash
uv sync                          # Install dependencies
```

**Run CITI KMS:**
```bash
# Backend
cd src/llm-rag-citi && python runner.py

# Frontend (separate terminal)
cd src/front-end && npm run dev
```

## Repository Structure

```
thesis/
├── src/                         # CITI KMS source code (tracked in thesis)
│   ├── front-end/               # Next.js UI
│   ├── llm-rag-citi/            # Flask backend
│   ├── admin-interface/         # Admin UI
│   ├── infra/                   # Infrastructure configs
│   └── ...                      # LightRAG, bge-ma012, etc.
├── docs/                        # Documentation (gitignored, iCloud backup)
│   └── implementation/          # Phase-based work (000-800)
├── src.backup/                  # Original CITI baseline (gitignored, reference)
├── pyproject.toml               # uv package manager
├── CLAUDE.md                    # Guide for Claude Code
└── README.md
```

## Development

**Python:** `uv` package manager (Python ≥3.10.12)

**CITI KMS:** Snapshot from CITI organization (Nov 2025), modify freely in `src/`

**Infrastructure:** Mac (dev) + 4 GPU nodes (Tailscale VPN) running vLLM, LocalAI, BGE-M3, Milvus

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Development guide for Claude Code
- **[docs/README.md](./docs/README.md)** - Documentation structure
- **[docs/implementation/](./docs/implementation/)** - Phase-based work logs

## Git Workflow

**Single repo:** Everything in thesis repo (vierui/thesis)
- `src/` tracked (CITI KMS source code - modify freely)
- `src.backup/` gitignored (original baseline for reference)
- `docs/` gitignored (backed up on iCloud)

Commit format: `<type>: <subject>` (types: feat, fix, docs, refactor, test, chore)
