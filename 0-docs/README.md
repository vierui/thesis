# Thesis Documentation Structure

**Last Updated:** 2025-10-28

## Overview

This directory contains all documentation for the master's thesis project, organized by Gantt chart phases.

## Quick Navigation

```
0-docs/
├── 📋 roadmap/                    → High-level planning
├── 🔨 implementation/             → Phase-based work (000-800)
├── 📚 research/                   → Generic research materials
├── 🏫 zhaw/                       → ZHAW administrative
└── 📦 archives/                   → Deprecated work
```

## Directory Structure

### 📋 [roadmap/](./roadmap/)
High-level project planning and strategic documents
- **`01-roadmap.md`** - Current roadmap with phase-based structure (v1.0, 2025-10-28)
- **`01-gantt.md`** - Current Gantt chart with phase numbering (v1.0, 2025-10-28)
- `00-roadmap.md` - Original roadmap (v0.0)
- `00-gantt.png` - Original Gantt visualization
- `00_thesis-proposal.pptx` - Thesis proposal presentation

### 🔨 [implementation/](./implementation/)
Phase-based implementation work aligned with Gantt timeline. Each phase folder contains:
- `README.md` - Phase overview with implementation log
- Implementation files following naming convention `[PhaseID][Seq]-[name].md`
- `research/` subfolder for phase-specific research materials

**Phase Timeline:**

| Phase | Folder | Timeline | Purpose |
|-------|--------|----------|---------|
| **Setup** | [000-setup](./implementation/000-setup/) | Oct 1-15 | Environment setup, infrastructure |
| **Literature** | [100-literature](./implementation/100-literature/) | Oct 15-31 | Literature review, theory |
| **Design** | [200-design](./implementation/200-design/) | Nov 1-30 | Architecture, metrics |
| **CITI Baseline** | [300-citi-baseline](./implementation/300-citi-baseline/) | Dec 1-23 | CITI analysis, baseline |
| **Optimization** | [400-optimization](./implementation/400-optimization/) | Jan 3-31 | Optimization modules |
| **Integration** | [500-integration](./implementation/500-integration/) | Jan 15-Feb 15 | Integration & testing |
| **Evaluation** | [600-evaluation](./implementation/600-evaluation/) | Feb 1-28 | Experiments, benchmarks |
| **Analysis** | [700-analysis](./implementation/700-analysis/) | Feb 15-Mar 1 | Results analysis |
| **Writing** | [800-writing](./implementation/800-writing/) | Mar 1-15 | Thesis finalization |

### 📚 [research/](./research/)
Generic research materials not tied to specific phases
- `papers/` - General paper library (28 papers)
- `notes/` - Learning notes, meetings, daily notes
- `agents/` - Agent-related research
- `notebooklm/` - NotebookLM prompts
- `links.md` - Reference links

### 🏫 [zhaw/](./zhaw/)
ZHAW administrative documents

### 📦 [archives/](./archives/)
Deprecated or superseded work for reference

## Numbering System

Implementation files use phase-based numbering:

| Range | Phase | Example Files |
|-------|-------|---------------|
| 000-099 | Setup | `001-project-infrastructure.md` |
| 100-199 | Literature | `101-knowledge-definition.md` |
| 200-299 | Design | `201-system-architecture.md` |
| 300-399 | CITI Baseline | `301-citi-setup.md`, `310-kms-description/` |
| 400-499 | Optimization | `401-quantization.md` |
| 500-599 | Integration | `501-integration-plan.md` |
| 600-699 | Evaluation | `601-experiment-design.md` |
| 700-799 | Analysis | `701-results-analysis.md` |
| 800-899 | Writing | `801-thesis-outline.md` |
| 900-999 | Archives | Deprecated work |

## File Naming Convention

- **Files:** `[PhaseID][Sequence]-[descriptive-name].md`
  - Example: `301-citi-setup.md`, `402-pruning.md`
- **Folders:** `[PhaseID]-[descriptive-name]/` for multi-file topics
  - Example: `310-kms-description/`, `311-improvement-study/`

## How to Use This Structure

### Adding New Implementation Work
1. Identify the Gantt phase (e.g., December = 300-citi-baseline)
2. Create file in appropriate phase folder: `implementation/300-citi-baseline/301-new-work.md`
3. Update phase `README.md` with implementation log entry
4. Add phase-specific research to `[phase]/research/` subfolder

### Finding Information
- **When did X happen?** Check phase folders by timeline
- **Strategic planning?** See `roadmap/`
- **General papers?** See `research/papers/`
- **Phase-specific research?** See `implementation/[phase]/research/`

### Implementation Logging
Each phase folder contains `README.md` with structured log entries:
```markdown
### YYYY-MM-DD | [Task Name] ([File Numbers])
**What:** Description of implementation
**Why:** Technical rationale
**How:** Approach and tools
**Results:** Outcomes and observations
**Decisions:** Key decisions and trade-offs
**Links:** [[file1.md]], [[file2.md]]
```

## Benefits of This Structure

1. **Visual Gantt Chart:** Folder names = project timeline in Finder
2. **Clear Context:** Opening `300-citi-baseline/` = December CITI work
3. **Thesis Alignment:** Structure maps to thesis chapters
4. **Progressive:** Natural flow from 000 → 800
5. **Traceability:** Every implementation linked to timeline
6. **Organized Research:** Phase-specific vs. generic research clearly separated

## Current Status

- **Active Phase:** 100-literature (Oct 15-31)
- **Completed:** 000-setup
- **Next:** 200-design (Nov 1-30)

For detailed workflow and guidelines, see [CLAUDE.md](../CLAUDE.md) in repository root.
