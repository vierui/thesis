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

**Required entries:**
- Date, what was implemented, why (technical rationale)
- How (approach, algorithms, tools), results, observations
- Decisions made and alternatives considered

**Purpose:** Foundation for thesis report writing and technical decision traceability.

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

Repositories in `2-citi-kms/` (reference only, read-only):
- `llm-rag-citi` - Flask RAG engine
- `front-end` - Next.js UI
- `admin-interface` - Admin dashboard
- `LightRAG-Implementation` - Graph-based RAG
- `ragas-local-implementation` - Evaluation framework

## Final Reminder

**Plan → Review → Approval → Implementation → Verification**

- Use uv for all dependencies
- Log in `0-docs/implementation-log/YYYY-MM-implementation.md`
- Verify git safety before commits
- Don't break existing functionality
- Don't change anything beyond approved scope
