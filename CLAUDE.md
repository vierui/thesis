# CLAUDE.md

Master's thesis investigating Knowledge Management Systems using RAG technology with CITI KMS.

## Repository Structure

```
thesis/ (git tracked → vierui/thesis)
├── src/                    # CITI KMS source code (tracked in thesis repo)
│   ├── front-end/          # Next.js frontend
│   ├── llm-rag-citi/       # Flask backend
│   ├── admin-interface/    # Admin UI
│   ├── infra/              # Infrastructure configs
│   └── ...                 # LightRAG, bge-ma012, etc.
├── docs/                   # Documentation (gitignored, backed up on iCloud)
│   └── implementation/     # Phase-based work (000-800)
├── src.backup/             # Original CITI baseline (gitignored, for reference)
├── pyproject.toml          # uv package manager
├── CLAUDE.md
└── README.md
```

## Infrastructure

**Mac (Dev):** Flask backend (5000), Next.js frontend (3000), git operations
**4 GPU Nodes (Tailscale VPN):** vLLM (8000), LocalAI (8080), BGE-M3 (1234), Milvus (19530)

Deploy services: `cd src/infra/<service> && docker compose up -d`

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
# Work on source code
cd src/front-end
# Make changes, commit to thesis repo

# Compare with original CITI baseline
diff -r src/front-end/ src.backup/front-end/
```

**Run Services:**
```bash
# Backend
cd src/llm-rag-citi && python runner.py

# Frontend
cd src/front-end && npm run dev
```

## Implementation Logging

**Phase Structure:** `docs/implementation/[000-899]-phase/`
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

## CITI KMS Source Code

**Snapshot from:** https://github.com/CITI-KnowledgeManagementSystem (Nov 2025)

- `src/` = CITI KMS working copy (tracked in thesis, modify freely)
- `src.backup/` = Original CITI baseline (gitignored, for reference only)
- **NEVER push changes to CITI's GitHub repos** (no connection anyway)
- Log CITI baseline version in implementation logs for reproducibility

## Safety Checklist

Before commit:
- ✅ `git status` - only intended files
- ✅ `git diff --staged` - review changes
- ✅ No secrets (.env, keys, tokens)
- ✅ No large files (models, datasets)
- ✅ No gitignored dirs (docs/, src.backup/)
