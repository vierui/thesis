# CLAUDE.md

Master's thesis investigating Knowledge Management Systems using RAG technology with CITI KMS.

## Repository Structure

```
thesis/ (git tracked → vierui/thesis)
├── src/                    # Python code
├── 0-docs/implementation/  # Phase-based docs (gitignored, backed up on iCloud)
├── pyproject.toml          # uv package manager
└── 2-citi-kms/             # CITI repos (gitignored, backed up on iCloud)
    ├── front-end/          # Branch: agentic-optimiz-rui (your experiments)
    ├── llm-rag-citi/       # Branch: agentic-optimiz-rui (your experiments)
    └── admin-interface/    # Branch: agentic-optimiz-rui (your experiments)
```

## Infrastructure

**Mac (Dev):** Flask backend (5000), Next.js frontend (3000), git operations
**4 GPU Nodes (Tailscale VPN):** vLLM (8000), LocalAI (8080), BGE-M3 (1234), Milvus (19530)

Deploy services: `cd 2-citi-kms/infra/<service> && docker compose up -d`

## Workflow Rules

1. **Plan → Approval → Implementation** - Always present plan and wait for "yes"
2. **When in doubt, ASK** - No assumptions, no proactive changes
3. **Git safety** - Check git status/diff before commits, no secrets, no large files

## Development

**Python:** uv package manager
```bash
uv sync                # Install deps
uv run src/main.py     # Run
uv add <package>       # Add dep
```

**CITI KMS Work:**
```bash
# Work on experiments
cd 2-citi-kms/front-end
git checkout agentic-optimiz-rui
# Make changes, commit locally

# Sync CITI updates
git checkout main
git pull origin main
```

**Run Services:**
```bash
# Backend
cd 2-citi-kms/llm-rag-citi && python runner.py

# Frontend
cd 2-citi-kms/front-end && npm run dev
```

## Implementation Logging

**Phase Structure:** `0-docs/implementation/[000-899]-phase/`
**Each phase has `README.md` with logs**

**REQUIRED: Log after ANY implementation:**
```markdown
### YYYY-MM-DD | Task Name
**What:** What was implemented
**Why:** Problem solved, rationale
**How:** Tools, commands, approach
**Results:** Metrics, issues, solutions
**Decisions:** Trade-offs, choices
**Links:** [[file1.md]]
```

## Git Commits

**Format:** `<type>: <subject>` where type = feat, fix, docs, refactor, test, chore

**Rules:**
- No AI/Claude mentions in commits (no "Generated with Claude Code", no "Co-Authored-By: Claude")
- Atomic commits with clear messages
- Reference thesis sections when relevant

## CITI KMS Repos

Cloned from https://github.com/CITI-KnowledgeManagementSystem
- `main` branch = clean CITI baseline (never modify)
- `agentic-optimiz-rui` branch = your experiments (local commits only)
- Log CITI versions in implementation logs for reproducibility

**Update CITI:**
```bash
cd 2-citi-kms/<repo>
git checkout main && git pull origin main
```

## Safety Checklist

Before commit:
- ✅ `git status` - only intended files
- ✅ `git diff --staged` - review changes
- ✅ No secrets (.env, keys, tokens)
- ✅ No large files (models, datasets)
- ✅ No gitignored dirs (0-docs/, 2-citi-kms/)
