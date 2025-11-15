# Thesis Gantt Chart v1.0

**Version:** 1.0 (2025-10-28)
**Project:** Sustainable Agents for Energy-Efficient LLMs
**Duration:** October 1, 2025 – March 31, 2026

---

## Mermaid Gantt Chart

```mermaid
gantt
    title Smart & Sustainable Agents for Energy-Efficient LLMs (Phase-Based)
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d

    %% Define sections by phase number ranges

    section 000: Setup
    000-099 Setup & Preparation           :done, p000, 2025-10-01, 2025-10-15

    section 100: Literature
    100-199 Literature Review             :active, p100, 2025-10-15, 2025-10-31

    section 200: Design
    200-299 Architecture & Design         :p200, 2025-11-01, 2025-11-30

    section 300: CITI Baseline
    300-399 CITI Analysis & Agentic Core  :p300, 2025-12-01, 2025-12-23
    🎄 Holiday Break                      :milestone, m1, 2025-12-24, 2026-01-02

    section 400: Optimization
    400-499 Optimization Modules          :p400, 2026-01-03, 2026-01-31

    section 500: Integration
    500-599 Integration & Testing         :p500, 2026-01-15, 2026-02-15

    section 600: Evaluation
    600-699 Experiments & Benchmarks      :p600, 2026-02-01, 2026-02-28

    section 700: Analysis
    700-799 Results Analysis              :p700, 2026-02-15, 2026-03-01

    section 800: Writing
    800-899 Draft Writing (ongoing)       :p800a, 2026-01-15, 2026-03-01
    800-899 Final Writing & Presentation  :p800b, 2026-03-01, 2026-03-15

    section Milestones
    D1: Literature Review                 :milestone, d1, 2025-10-31, 1d
    D2: Architecture Spec                 :milestone, d2, 2025-11-30, 1d
    D3: Prototype v1                      :milestone, d3, 2025-12-31, 1d
    D4: Experiments Complete              :milestone, d4, 2026-02-15, 1d
    D5: Final Submission                  :milestone, d5, 2026-03-15, 1d
```

---

## Phase Timeline Table

| Phase | Range | Name | Timeline | Duration | Status |
|-------|-------|------|----------|----------|--------|
| **000** | 000-099 | Setup & Preparation | Oct 1-15 | 2 weeks | ✅ Done |
| **100** | 100-199 | Literature Review | Oct 15-31 | 2 weeks | 🔄 Active |
| **200** | 200-299 | Architecture & Design | Nov 1-30 | 4 weeks | ⏳ Upcoming |
| **300** | 300-399 | CITI Baseline & Agentic Core | Dec 1-23 | 3 weeks | ⏳ Upcoming |
| | | 🎄 Holiday Break | Dec 24 - Jan 2 | 10 days | |
| **400** | 400-499 | Optimization Modules | Jan 3-31 | 4 weeks | ⏳ Future |
| **500** | 500-599 | Integration & Testing | Jan 15 - Feb 15 | 4 weeks* | ⏳ Future |
| **600** | 600-699 | Experiments & Benchmarks | Feb 1-28 | 4 weeks* | ⏳ Future |
| **700** | 700-799 | Results Analysis | Feb 15 - Mar 1 | 2 weeks* | ⏳ Future |
| **800** | 800-899 | Thesis Writing | Jan 15 - Mar 15 | 8 weeks* | ⏳ Future |

*Overlapping phases - see dependency chart below

---

## Phase Dependencies & Overlaps

```
Oct     Nov     Dec     Jan     Feb     Mar
|-------|-------|-------|-------|-------|
000 ✅
    100 🔄
        200
            300
                🎄
                    400
                        500
                    600
                        700
                        800===================>
                            800b=====>

Legend:
✅ Completed
🔄 In Progress
⏳ Upcoming
🎄 Holiday Break
=====> Overlapping/Parallel phases
```

**Parallel Phases:**
- **400 ↔ 500:** Integration starts mid-January (overlaps with optimization work)
- **500 ↔ 600:** Evaluation begins early Feb (as integration stabilizes)
- **600 ↔ 700:** Analysis begins mid-Feb (as evaluation completes)
- **800a:** Draft writing ongoing from mid-January through Feb
- **800b:** Final writing & presentation prep (Mar 1-15)

---

## Deliverables Timeline

| ID | Deliverable | Due Date | Phase | Status |
|----|-------------|----------|-------|--------|
| **D1** | Literature Review Summary | Oct 31, 2025 | 100 | 🔄 |
| **D2** | Architecture Specification | Nov 30, 2025 | 200 | ⏳ |
| **D3** | Prototype v1 (Agentic Framework) | Dec 31, 2025 | 300-400 | ⏳ |
| **D4** | Experiments & Metrics | Feb 15, 2026 | 600 | ⏳ |
| **D5** | Final Report & Presentation | Mar 15, 2026 | 800 | ⏳ |

---

## Critical Path Analysis

**Critical Path:** 000 → 100 → 200 → 300 → 400 → 500 → 600 → 700 → 800b

**Key Constraints:**
1. **D1 (Oct 31):** Must complete literature review to inform architecture design
2. **D2 (Nov 30):** Architecture must be defined before implementation
3. **Holiday Break (Dec 24-Jan 2):** 10-day gap impacts Dec/Jan phases
4. **D3 (Dec 31):** Prototype must work before optimization modules
5. **Integration (500):** Blocks final evaluation
6. **D5 (Mar 15):** Hard deadline for submission

**Risk Areas:**
- **Phase 300 (CITI):** Complex baseline setup, only 3 weeks before break
- **Phase 500 (Integration):** Overlaps with 400/600, potential bottleneck
- **Phase 800 (Writing):** Compressed final writing period (2 weeks)

**Mitigation:**
- Start CITI setup early in December (maximize working days before break)
- Begin integration mid-January (don't wait for all optimization modules)
- Draft writing throughout Jan-Feb (don't defer to March)

---

## Work Hours Estimation

**Total Project Duration:** ~23 weeks (Oct 1 - Mar 15)
**Available Working Days:** ~115 days (excluding weekends, holidays)
**Estimated Total Hours:** 450-500 hours (thesis + implementation)

**Phase Hour Estimates:**

| Phase | Duration | Est. Hours | Hours/Week |
|-------|----------|------------|------------|
| 000 Setup | 2 weeks | 20 hrs | 10 |
| 100 Literature | 2 weeks | 60 hrs | 30 |
| 200 Design | 4 weeks | 60 hrs | 15 |
| 300 CITI | 3 weeks | 80 hrs | 27 |
| 400 Optimization | 4 weeks | 80 hrs | 20 |
| 500 Integration | 4 weeks | 60 hrs | 15 |
| 600 Evaluation | 4 weeks | 50 hrs | 13 |
| 700 Analysis | 2 weeks | 30 hrs | 15 |
| 800 Writing | 8 weeks | 80 hrs | 10 |
| **Total** | | **520 hrs** | **~22 hrs/week** |

**Note:** Phase overlaps reduce actual calendar time while maintaining work hours.

---

## Current Status (as of 2025-10-28)

- **Active Phase:** 100-199 (Literature Review)
- **Current Week:** Week 4 of 23
- **Progress:** ~17% through timeline, ~15% through work hours
- **Next Milestone:** D1 - Literature Review Summary (Oct 31)
- **Days Until Next Milestone:** 3 days

**Recent Completions:**
- ✅ Phase 000: Setup & Preparation (Oct 1-15)
  - Git infrastructure
  - Documentation structure
  - Phase-based organization system

**Current Focus:**
- 🔄 Phase 100: Literature Review (Oct 15-31)
  - Knowledge management theory
  - Agentic systems & model routing
  - Optimization techniques (quantization, pruning, caching)
  - Edge inference benchmarks

**Upcoming (Next 2 Weeks):**
- 📅 Complete D1: Literature Review Summary (Oct 31)
- 📅 Begin Phase 200: Architecture & Design (Nov 1)
- 📅 Define baseline system and metrics framework

---

## Version History

- **v1.0 (2025-10-28):** Phase-based Gantt with 000-800 numbering, detailed overlaps, hour estimates
- **v0.0 (2025-10-17):** Initial high-level Gantt chart

---

## Visual Reference

For high-resolution Gantt chart image, see:
- [00-gantt.png](./00-gantt.png) (original version)
- This markdown file can be rendered in any Mermaid-compatible viewer

To render this Gantt chart:
1. Copy the mermaid code block
2. Paste into https://mermaid.live/
3. Export as PNG/SVG for presentation

---

## Integration with Implementation Structure

The phase numbering in this Gantt directly maps to implementation folders:

```
Gantt Phase → Implementation Folder
─────────────────────────────────────
Phase 000   → 0-docs/implementation/000-setup/
Phase 100   → 0-docs/implementation/100-literature/
Phase 200   → 0-docs/implementation/200-design/
Phase 300   → 0-docs/implementation/300-citi-baseline/
Phase 400   → 0-docs/implementation/400-optimization/
Phase 500   → 0-docs/implementation/500-integration/
Phase 600   → 0-docs/implementation/600-evaluation/
Phase 700   → 0-docs/implementation/700-analysis/
Phase 800   → 0-docs/implementation/800-writing/
```

**Benefits:**
- Gantt chart phases = folder names in Finder
- Easy visual tracking of progress
- Clear mapping between timeline and documentation
- Implementation logs organized by phase
