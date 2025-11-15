# Master Thesis Roadmap v1.0

**Version:** 1.0 (2025-10-28)
**Title:** Sustainable Agents for Energy-Efficient LLMs
**Duration:** October 1, 2025 – March 31, 2026
**Student:** Rui Vieira (vieirrui@students.zhaw.ch), ZHAW
**Supervisors:**
- Prof. Shuo-Yan CHOU (sychou@g.ecc.u-tokyo.ac.jp), NTUST
- Prof. Stefan Czerner (czer@zhaw.ch), ZHAW

**Goal:** Develop agentic mechanisms to dynamically optimize model usage, energy, and hardware footprint of local LLMs — toward sustainable, democratized AI.

---

## Project Overview

**Context:** Democratization of AI, local models, sustainability
**Problem:** LLMs are computationally and energetically heavy
**Objective:** Design smart, sustainable agents to reduce energy and hardware needs
**Scope:** Edge devices and local deployment (Mac M-series, potential edge testing)
**Deliverables:** Agentic framework + evaluation on optimized LLMs

**Baseline System:** CITI KMS (Knowledge Management System)
- Existing RAG pipeline with Flask backend, Next.js frontend
- Multi-service architecture (vLLM, embeddings, Milvus vector DB)
- Provides realistic baseline for optimization experiments

---

## Phase-Based Timeline

### **Phase 000-099: Setup & Preparation**
**Timeline:** October 1-15, 2025
**Status:** ✅ Completed
**Documentation:** `0-docs/implementation/000-setup/`

**Objectives:**
- Establish project infrastructure (git, dependencies, environment)
- Configure safety protocols and workflow controls
- Set up documentation structure
- Define project scope and initial planning

**Deliverables:**
- ✅ Git repository with proper `.gitignore`
- ✅ Development environment (Python ≥3.10.12, uv)
- ✅ CLAUDE.md workflow documentation
- ✅ Phase-based implementation logging structure

---

### **Phase 100-199: Literature Review**
**Timeline:** October 15-31, 2025
**Status:** 🔄 In Progress
**Documentation:** `0-docs/implementation/100-literature/`

**Objectives:**
- Review quantization, pruning, caching, hardware-aware scheduling techniques
- Study agentic systems and adaptive model routing
- Analyze edge inference benchmarks (energy, latency, accuracy tradeoffs)
- Comparative study of edge LLM techniques (Phi-3, Mistral, Qwen2-1.5B)
- Establish theoretical foundations for knowledge management systems

**Key Topics:**
- **Optimization Techniques:** Quantization, pruning, distillation, caching
- **Agentic Systems:** Model routing, adaptive execution, decision-making
- **Edge Inference:** Resource constraints, energy efficiency, performance tradeoffs
- **Knowledge Management:** Tacit vs. explicit knowledge, organizational learning, transfer mechanisms

**Deliverables:**
- [ ] **D1:** Literature review summary (Due: Oct 31)
- [ ] Quantization & pruning techniques summary
- [ ] Agentic systems & model routing review
- [ ] Edge inference benchmarks analysis
- [ ] Knowledge management theory foundations

---

### **Phase 200-299: Design & Architecture**
**Timeline:** November 1-30, 2025
**Status:** ⏳ Upcoming
**Documentation:** `0-docs/implementation/200-design/`

**Objectives:**
- Define baseline system architecture (LLM stack, dataset, metrics)
- Design agentic process concepts:
  - Adaptive model selection (load balancing by complexity/energy)
  - Recursive micro-model reasoning
  - Context-aware caching / modular execution
- Specify measurement methodology and efficiency metrics
- Draft architecture: local agent orchestrator + lightweight inference engine

**Measurement Framework:**
- **Computational:** CPU/GPU utilization, memory usage, storage I/O
- **Performance:** Latency, throughput, response quality
- **Energy:** Power draw (W), energy per inference (J), total consumption
- **System:** Network bandwidth, cache efficiency, resource allocation

**Deliverables:**
- [ ] **D2:** Architecture specification (Due: Nov 30)
- [ ] Baseline system definition (LLM stack, dataset)
- [ ] Agentic process design (model selection, caching, execution)
- [ ] Comprehensive metrics framework
- [ ] Measurement methodology specification

---

### **Phase 300-399: CITI Baseline & Agentic Core**
**Timeline:** December 1-23, 2025 (Break: Dec 24 - Jan 2)
**Status:** ⏳ Upcoming
**Documentation:** `0-docs/implementation/300-citi-baseline/`

**Objectives:**
- Establish CITI KMS as baseline system for optimization work
- Analyze existing architecture, identify bottlenecks and optimization opportunities
- Set up local development environment with measurement instrumentation
- Document baseline performance metrics
- Design and prototype core agentic logic for adaptive optimization
- Implement model selection agent (load balancing by complexity/energy)

**CITI KMS Analysis Focus:**
- Architecture flows and component interaction
- Query pipeline efficiency
- Resource bottlenecks (CPU, GPU, memory, I/O)
- Current vs. potential performance
- Agent integration points

**Core Agentic Framework:**
- Decision-making logic for model/parameter selection
- Resource-aware execution planning
- Adaptive routing based on query complexity
- Instrumentation for measurement and feedback

**Deliverables:**
- [ ] **D3:** Prototype v1 (Due: Dec 31)
- [ ] CITI KMS running locally with full instrumentation
- [ ] Baseline performance metrics documented
- [ ] Architecture analysis and bottleneck identification
- [ ] Core agentic framework prototype (model selection agent)
- [ ] Initial optimization strategy based on baseline analysis

**Holiday Break:** December 24, 2025 - January 2, 2026

---

### **Phase 400-499: Optimization Modules**
**Timeline:** January 3-31, 2026
**Status:** ⏳ Future
**Documentation:** `0-docs/implementation/400-optimization/`

**Objectives:**
- Implement dynamic quantization modules
- Develop pruning strategies for model compression
- Design and implement context-aware caching system
- Integrate optimization modules with agentic framework
- Implement hardware resource allocation layer (CPU/GPU offloading)
- Measure optimization impact on performance and efficiency

**Optimization Techniques:**
- **Quantization:** Dynamic precision adjustment based on query complexity
- **Pruning:** Remove redundant parameters while maintaining quality
- **Caching:** Context-aware caching of embeddings, intermediate results
- **Resource Allocation:** Dynamic CPU/GPU offloading, memory management

**Deliverables:**
- [ ] Dynamic quantization module
- [ ] Model pruning implementation
- [ ] Context-aware caching system
- [ ] Hardware resource allocation layer
- [ ] Optimization impact measurements
- [ ] Integration with agentic decision-making

---

### **Phase 500-599: Integration & Testing**
**Timeline:** January 15 - February 15, 2026 (overlaps with 400)
**Status:** ⏳ Future
**Documentation:** `0-docs/implementation/500-integration/`

**Objectives:**
- Integrate all optimization modules into unified system
- Comprehensive testing of agentic decision-making
- End-to-end system validation
- Performance regression testing
- Edge device deployment testing (Mac M-series, potential Raspberry Pi)
- System stability and reliability verification

**Integration Tasks:**
- Unified agentic orchestrator coordinating all optimization modules
- Seamless switching between optimization strategies
- Fallback mechanisms and error handling
- Monitoring and instrumentation across entire pipeline

**Deliverables:**
- [ ] Fully integrated agentic optimization system
- [ ] Comprehensive test suite
- [ ] Edge device deployment configurations
- [ ] Integration documentation
- [ ] System stability verification

---

### **Phase 600-699: Evaluation & Experimentation**
**Timeline:** February 1-28, 2026 (overlaps with 500)
**Status:** ⏳ Future
**Documentation:** `0-docs/implementation/600-evaluation/`

**Objectives:**
- Design comprehensive evaluation experiments
- Compare configurations: baseline vs. agentic optimization
- Compare models: quantized vs. full-precision
- Measure and analyze key metrics
- Statistical analysis of results
- Benchmark against edge inference standards

**Evaluation Metrics:**
- **Energy Efficiency:** J/inference, W load, total energy consumption
- **Performance:** Latency (p50, p95, p99), throughput, response time
- **Quality:** Accuracy, response relevance, semantic similarity
- **Flexibility:** Adaptation speed, configuration overhead
- **Scalability:** Performance under load, resource utilization

**Experimental Configurations:**
1. Baseline (no optimization)
2. Static optimization (fixed quantization/pruning)
3. Agentic optimization (adaptive)
4. Agentic + all modules (full system)

**Deliverables:**
- [ ] **D4:** Experiments & metrics (Due: Feb 15)
- [ ] Experiment design document
- [ ] Benchmark results (baseline vs. optimized)
- [ ] Energy consumption measurements
- [ ] Performance comparison (latency, throughput, accuracy)
- [ ] Raw data and processed results

---

### **Phase 700-799: Analysis & Discussion**
**Timeline:** February 15 - March 1, 2026
**Status:** ⏳ Future
**Documentation:** `0-docs/implementation/700-analysis/`

**Objectives:**
- Analyze experimental results and trade-offs
- Discuss sustainability impacts and energy savings achieved
- Evaluate scalability and generalization potential
- Identify limitations and boundary conditions
- Propose future research directions

**Analysis Focus:**
- **Trade-offs:** Energy vs. accuracy vs. latency
- **Sustainability Impact:** Carbon footprint reduction, efficiency gains
- **Cost Analysis:** Infrastructure, operational, total cost of ownership
- **Generalization:** Applicability to other systems, domains, models
- **Limitations:** Boundary conditions, failure modes, constraints

**Future Directions:**
- Adaptive micro-agents for fine-grained optimization
- Model co-learning and feedback loops
- Multi-model orchestration strategies
- Edge-cloud hybrid optimization

**Deliverables:**
- [ ] Comprehensive results analysis
- [ ] Trade-off analysis documentation
- [ ] Sustainability impact assessment
- [ ] Limitations and boundary conditions documented
- [ ] Future work recommendations

---

### **Phase 800-899: Thesis Writing & Finalization**
**Timeline:** March 1-15, 2026
**Status:** ⏳ Future
**Documentation:** `0-docs/implementation/800-writing/`

**Note:** Draft writing should be ongoing from January 2026. This phase is for final writing and polishing.

**Objectives:**
- Finalize thesis writing and revisions
- Integrate all implementation logs into thesis chapters
- Create presentation materials
- Polish codebase documentation
- Prepare final deliverables

**Thesis Structure:**
1. Introduction & Motivation
2. Literature Review & State of the Art
3. System Design & Architecture
4. Implementation (Agentic Framework + Optimization Modules)
5. Evaluation & Experimentation
6. Results Analysis & Discussion
7. Conclusion & Future Work

**Deliverables:**
- [ ] **D5:** Final report & presentation (Due: Mar 15)
- [ ] Written thesis report
- [ ] Presentation slides
- [ ] Prototype codebase with documentation
- [ ] README and setup instructions
- [ ] All supplementary materials

---

## Implementation Documentation Structure

All implementation work is documented in phase-based folders:

```
0-docs/implementation/
├── 000-setup/          # File IDs: 001-099
├── 100-literature/     # File IDs: 101-199
├── 200-design/         # File IDs: 201-299
├── 300-citi-baseline/  # File IDs: 301-399
├── 400-optimization/   # File IDs: 401-499
├── 500-integration/    # File IDs: 501-599
├── 600-evaluation/     # File IDs: 601-699
├── 700-analysis/       # File IDs: 701-799
└── 800-writing/        # File IDs: 801-899
```

**File Naming Convention:**
- Format: `[PhaseID][Sequence]-[descriptive-name].md`
- Examples: `301-citi-setup.md`, `402-quantization.md`, `601-experiment-design.md`

**Implementation Logging:**
Each phase folder contains `README.md` with structured log entries tracking all work, decisions, and results.

---

## Key Milestones

| Date | Milestone | Phase |
|------|-----------|-------|
| Oct 15 | Project setup complete | 000 ✅ |
| Oct 31 | Literature review complete (D1) | 100 🔄 |
| Nov 30 | Architecture specification (D2) | 200 ⏳ |
| Dec 23 | Core agentic framework (holiday break) | 300 ⏳ |
| Jan 31 | Optimization modules complete (D3) | 400 ⏳ |
| Feb 15 | Evaluation complete (D4) | 600 ⏳ |
| Mar 1 | Analysis complete, writing begins | 700 ⏳ |
| Mar 15 | Final submission (D5) | 800 ⏳ |

---

## Risk Management

**Technical Risks:**
- CITI KMS complexity higher than anticipated → Focus on specific optimization points
- Edge device performance insufficient → Prioritize Mac M-series, document limitations
- Measurement accuracy challenges → Multiple measurement tools, validation

**Schedule Risks:**
- Literature review extending → Parallelize with architecture design where possible
- Integration issues → Start integration early (overlapping phases 400-500)
- Holiday break impact → Front-load December work, clear handoff documentation

**Mitigation Strategies:**
- Weekly progress tracking via phase README.md logs
- Early prototyping and testing
- Flexible scope: Core agentic framework is primary, advanced features are secondary
- Regular supervisor check-ins

---

## Version History

- **v1.0 (2025-10-28):** Restructured with phase-based numbering system (000-800), added CITI KMS baseline focus, detailed phase objectives and deliverables
- **v0.0 (2025-10-15):** Initial roadmap with high-level timeline

---

## References

- **Gantt Chart:** [01-gantt.png](./01-gantt.png) or [00-gantt.png](./00-gantt.png)
- **Implementation Docs:** [../implementation/](../implementation/)
- **Research Materials:** [../research/](../research/)
- **Project Guidelines:** [CLAUDE.md](../../CLAUDE.md)
