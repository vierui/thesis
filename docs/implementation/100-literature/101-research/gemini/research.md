****# **A Deep Research Strategy for Optimizing Agentic RAG Systems: An Expert-Level Report and Methodological Guide**

## **Executive Summary: Re-Evaluating Your Research Plan**

The initial proposal to segment this thesis topic into "agents," "hardware-computational-energy optimization," and "RAG \+ LLM systems" is a valid first-level categorization. However, for doctoral-level research, treating these as independent silos presents a significant risk. Such a structure would lead to a review of the state-of-the-art (SOTA) for each component in isolation, failing to identify the true, systemic research problem.

The most critical and recent (2025) findings indicate that the computational bottlenecks of an *agentic system* are fundamentally different from those of a simple RAG or LLM pipeline.1 Optimizing a GPU for LLM inference is a well-understood challenge. Optimizing a heterogeneous system for an *agent*—a dynamic, iterative, and newly-identified *CPU-bound* control flow that *uses* RAG and LLMs as tools—is a novel and wide-open research field. The problem is not the individual components; it is their complex, dynamic interaction.

This report outlines an integrated research strategy that addresses this system-level problem. The strategy is structured to first establish a computational baseline for RAG+LLM systems, then analyze the new computational workloads introduced by agentic control, and finally synthesize these findings to identify high-impact, actionable research gaps at the intersection of hardware-aware agents and system-level co-design.

---

## **Part 1: The Foundation — Architectural and Computational Profile of RAG+LLM Systems**

**Objective:** To establish a baseline by defining the "standard" Retrieval-Augmented Generation (RAG) pipeline and characterizing its distinct, heterogeneous computational bottlenecks.

### **1.1 From Naive RAG to RAG 2.0: A Shift in System Complexity**

The foundational RAG concept is a two-stage pipeline: a **Retriever** that fetches external data and a **Generator** (LLM) that uses this data as context.2 This architecture was designed to mitigate LLM hallucinations and bypass the static knowledge limits of pre-trained models.2

However, the SOTA for production-grade RAG in 2025 (often termed "RAG 2.0" or "Advanced RAG") is no longer this simple.4 This more complex paradigm demonstrates a critical trend: the pipeline has evolved into a multi-step computational graph with deeply interdependent components, even before the introduction of autonomous agents.6

SOTA RAG 2.0 workflows now involve 7:

* **Pre-Retrieval:** Query rewriting, query expansion, and other processing to improve the query's relevance before it even reaches the retriever.  
* **Retrieval:** Hybrid search strategies that combine dense (vector) retrievers with traditional sparse (e.g., BM25) retrievers to improve recall.8  
* **Post-Retrieval:** Re-ranking the retrieved documents (a major SOTA technique 9) and applying further optimization, such as Direct Preference Optimization (DPO) 8, to refine the final context.

This evolution from a simple two-stage pipe to a multi-phase system 8 means that optimizing the hardware or energy for "RAG" is already a systems-level problem. Optimizing the retriever or generator in isolation will merely shift the bottleneck rather than solving the systemic inefficiency.

### **1.2 Computational Bottleneck 1: The Retriever**

The retriever component is not a simple database "lookup." It is a computationally intensive search and ranking process, which itself presents a heterogeneous compute problem.

1. **Vector Search:** SOTA systems like Pinecone 11 and Milvus 12 utilize algorithms such as Hierarchical Navigable Small World (HNSW) 11 for high-speed similarity search. This is fundamentally a graph-traversal algorithm that is highly CPU-intensive.  
2. **Reranking:** There is a fundamental trade-off between retrieval *precision* (which requires expensive ML-based rerankers) and *latency* (which favors fast, heuristic filters).10 The SOTA "multiphase ranking" approach manages this by first using cheap, CPU-based filters to trim the candidate pool, then applying progressively heavier ML models (often on GPUs) to the smaller set of results.10

Hardware optimization for the retriever is thus a heterogeneous challenge. SOTA research from Intel focuses on CPU acceleration, using Single Instruction, Multiple Data (SIMD) instruction sets like Intel AVX-512 to accelerate the vector distance computations.14 In parallel, other systems like Milvus are designed to leverage GPU acceleration for massive-scale search.13 A fully optimized RAG pipeline must therefore manage a complex interplay of CPU and GPU resources *just for the retrieval step*.

### **1.3 Computational Bottleneck 2: The Generator (LLM Inference)**

The LLM inference workload is not monolithic. As detailed by NVIDIA, it is a two-phase process with conflicting performance characteristics 16:

1. **Prefill (Prompt Processing):** The (parallel) processing of the input prompt *and* the entire retrieved context. This phase is compute-intensive. In RAG systems, which are designed to handle extensive contexts 17, this prefill stage becomes a major compute bottleneck, exacerbated by the quadratic complexity $O(n^2)$ of standard attention.18  
2. **Decode (Token Generation):** The (autoregressive) generation of the output, one token at a time. This phase is notoriously *memory-bandwidth bound*, not compute-bound.20 The GPU compute cores are often under-utilized while they wait for data (the KV cache) to be fetched from memory.16

The RAG pipeline creates a "worst-of-both-worlds" scenario by maximizing the pain of *both* phases. It stuffs the context window, causing a massive, compute-bound prefill step 18, while still requiring the memory-bound decode step.20

This creates a *conflicting design-time objective* for a hardware accelerator. To optimize the prefill phase, the hardware needs massive parallel compute (e.g., large systolic arrays). To optimize the decode phase, it needs extremely high memory bandwidth, as compute is not the bottleneck. Analysis of tensor parallelism strategies confirms this: the optimal hardware configuration "under different LLM workloads" changes. 21 A system where prefill dominates (like RAG) prefers a different hardware design than one where decoding dominates.21 This means any static hardware accelerator (e.g., a simple FPGA/ASIC) will be inherently inefficient for at least half of the RAG-LLM workload.

---

## **Part 2: The Control Layer — Agent Frameworks as Computational Graphs**

**Objective:** To analyze the "agents" pillar not as a conceptual entity, but as a *dynamic, graph-based computational workload* with its own distinct costs and bottlenecks.

### **2.1 SOTA Agent Architectures and their Costs**

Agents are systems defined by their ability to reason, plan, and utilize tools.22

* **Single-Agent:** SOTA single-agent frameworks like **GoalAct** 24 focus on *hierarchical execution*. This involves decomposing a global goal into high-level "skills" (e.g., search, code) to ensure the generated plans are *executable* and the agent does not get "stuck" in a non-productive loop.  
* **Multi-Agent:** SOTA multi-agent systems focus on dynamic collaboration, communication, and role allocation.25 Systems like **GraphAgent-Reasoner** 26 demonstrate scalability by adding more agents to handle larger, more complex graphs. Evaluating these systems requires analyzing their "state graph representations" to track performance and identify inefficiencies.27

This agentic orchestration layer is not computationally free. An effective way to analyze it is through "asymptotic analysis with LLM primitives (AALPs)," where each LLM call is treated as an atomic compute unit, and the agent framework itself is a *computational graph*.28 This graph has a quantifiable cost.

Recent 2024/2025 research provides explicit data on this cost. When comparing SOTA agent frameworks, one study notes that **AFlow** (a SOTA task-level framework) incurs an inference cost of $1.66$. A newer, more efficient orchestration method (DAAO) reduces this to $0.27$.29 This 6x difference proves that the agent's *control flow*—its reasoning, planning, and orchestration—is itself a primary, and highly optimizable, source of computational cost and latency, distinct from the cost of the LLM calls it makes.

### **2.2 The CPU-Centric Bottleneck: Agentic Tool Use**

The fundamental agentic "loop" involves an iterative, heterogeneous compute path: LLM (GPU) \-\> Agent Logic (CPU) \-\> Tool Call (CPU/I/O) \-\> Agent Logic (CPU) \-\> LLM (GPU) \-\>....30

A critical 2025 paper demystifying agentic AI bottlenecks provides the single most important finding for this thesis topic.1 The analysis reveals:

1. **Latency:** "Tool processing on CPUs can take up to **90.6%** of the total latency."  
2. **Energy:** "CPU dynamic energy consumes up to **44%** of the total dynamic energy at large batch sizes."

The tools responsible for this overhead are explicitly named: "Python or Bash execution, web search, URL fetching... and **Exact Nearest Neighbor Search (ENNS) on large databases**".1

This finding fundamentally reframes the proposed thesis. The RAG retrieval step ("Exact Nearest Neighbor Search") is defined as a "tool" within the agentic framework. This tool, along with other agent logic, runs on the *CPU* and accounts for the *vast majority* of the system's latency (90.6%) and a *near-majority* of its energy consumption (44%).

Therefore, a thesis focused on optimizing the hardware for an *agentic RAG system* that *only* optimizes the LLM/GPU component (e.g., with a new quantization method) is ignoring 90% of the latency problem. The research must be refocused on optimizing the *entire heterogeneous system*, with a primary emphasis on the newly-identified, dominant *CPU-side bottleneck*: the agent's control flow and its RAG tool-use.

---

## **Part 3: The Synthesis — Agentic RAG as a New Computational Paradigm**

**Objective:** To combine the analyses from Parts 1 and 2, defining "Agentic RAG" 31 and characterizing the new, complex, and dynamic workloads it creates.

### **3.1 Agent-Driven Adaptive Retrieval**

The paradigm shift from "Advanced RAG" to "Agentic RAG" is the shift from a static pipeline to a dynamic, agent-controlled workflow.34 In a Naive RAG system, the pipeline is fixed. In an Agentic RAG system, the agent *actively controls* and *adapts* the RAG pipeline as a tool.

SOTA capabilities include:

* **Dynamic Decision-Making:** The agent decides *when* to retrieve, *what* to retrieve, and *which retriever* to use.7 This includes routing queries to multiple, distinct databases or knowledge sources.36  
* **Adaptive Retrieval:** Agents can be trained to estimate their own uncertainty to decide *if* retrieval is even necessary for a given query, though this uncertainty estimation adds its own computational overhead.37  
* **Iterative Refinement:** The agent can "reflect" on the quality of retrieved results and *iteratively refine* its search strategy, issuing new queries to fill in knowledge gaps.38

This means the RAG pipeline is no longer a static, predictable workload. It is a dynamic resource called on-demand by the agent. One query might be GPU-only (the agent "knows" the answer). The very next query might trigger a complex, multi-step chain: CPU-logic \-\> GPU-reranker \-\> CPU-logic \-\> web-tool-I/O \-\> CPU-logic \-\> GPU-LLM. This *runtime dynamism* makes static, design-time hardware optimization insufficient.

### **3.2 Agent-Driven Multi-Hop and Graph Reasoning (GraphRAG)**

SOTA agents are moving beyond retrieving simple text "chunks." They are using RAG to query, construct, and reason over structured *knowledge graphs*. 40

This "GraphRAG" technique 4,3 enables complex, multi-hop reasoning by building an entity-relationship graph from the knowledge base and reasoning over it. 46 This introduces a *new computational workload* into the pipeline: graph traversal and graph-based reasoning. 26

A SOTA Agentic RAG system is therefore a *tri-brid compute system*, with three distinct computational paradigms:

1. **GPU-centric:** LLM inference (prefill and decode).  
2. **CPU-centric:** Agent logic, orchestration, and tool execution (including vector search).  
3. **Graph-centric:** Knowledge graph traversal and multi-hop reasoning.

Optimizing this three-part system for size, consumption, and latency is a monumental and novel systems-level challenge.

### **3.3 Differentiating RAG (Knowledge) from Agentic Memory (Experience)**

A "knowledge management system" in an agentic context is bifurcated, creating two distinct memory-system optimization targets.

1. **RAG (External Knowledge):** This is the external, typically static or semi-static, knowledge base. It is indexed in a vector database and is *read-heavy*. 48  
2. **Agentic Memory (Internal Experience):** This is the agent's *own* history, "experiences," reflections, and learned preferences. 49

SOTA research (e.g., **A-Mem** 51) proposes agents that *dynamically organize their own memory* as an interconnected knowledge network, distinct from the RAG store. This means the hardware optimization must account for *two* large, dynamic data stores with vastly different access patterns: (1) the static, read-heavy RAG vector index, and (2) the dynamic, *read-write* agent-memory graph. 51 These two systems will have different requirements for caching, in-memory compute, and persistence.

---

## **Part 4: The Core Problem — Identifying the Thesis Bottlenecks**

**Objective:** To synthesize all previous analysis into a clear problem statement, focusing on the *new* hardware and energy bottlenecks created by the full Agentic RAG system.

### **4.1 The Latency and Cost Explosion**

The primary trade-off of Agentic RAG is quality for *time and money*. Traditional RAG is faster, often involving just two model calls and a database lookup.52 Agentic RAG involves "more LLM calls \= more tokens \= higher cost... or more load on your infrastructure".52

This is not a parallelizable problem. The agentic loops 49 and reflection steps 39 are *serial*: Action 1 \-\> Reflection 1 \-\> Action 2 \-\>.... This creates an additive latency that is the central "fight for latency" in agentic systems.54 The true bottleneck is often hidden in the "lower stack" infrastructure: memory, coordination, and retrieval latency.55

### **4.2 The Heterogeneous System Bottleneck**

The critical finding remains the data from 1 and 1: the system is bottlenecked by **CPU-bound agentic control flow (90.6% latency, 44% energy)**, which *includes* the RAG retrieval task.

To justify a novel thesis, one must first establish this novel problem. The following table contrasts the "old problem" (Standard RAG) with the "new problem" (Agentic RAG) based on the analyzed data.

**Table 1: Comparative Bottleneck Analysis: Standard RAG vs. Agentic RAG**

| Metric | Standard RAG \[16, 18\] | Agentic RAG \[1, 52\] |
| :---- | :---- | :---- |
| **Primary Pipeline** | Static, 2-stage (Retrieve $\\rightarrow$ Generate) | Dynamic, N-step (Reason $\\rightarrow$ Act $\\rightarrow$ Retrieve $\\rightarrow$ Reason $\\rightarrow$...) |
| **Primary Latency Bottleneck** | GPU (Prefill/Decode) | **CPU (Agent Logic & Tool Use) (90.6%)** |
| **Primary Energy Bottleneck** | GPU | **CPU (44%)** \+ GPU (56%) |
| **Workload Profile** | Predictable (1x CPU-R, 1x GPU-G) | **Unpredictable** (N x CPU, M x GPU, K x I/O) |
| **Key Optimization Target** | GPU Memory Bandwidth 20 | **CPU-GPU Synchronization & CPU Tool Execution** |

### **4.3 The On-Device Challenge: Data Center vs. Edge**

The goal of reducing size and consumption is most critical for on-device or edge deployment.56 However, a significant chasm exists between the SOTA of agentic *capability* and the *goal* of on-device deployment.

* **SOTA Capability:** SOTA Agentic RAG systems are demonstrated on massive data center hardware, such as a Dell PowerEdge R760xa with 4x NVIDIA H100 GPUs.57  
* **Edge Constraints:** Edge/mobile platforms have severe, un-met constraints: "Massive memory," "reliable, deterministic networking," "advanced sensor data fusion," and, critically, "**battery technology**".60

Frameworks for "limited hardware resources" exist, but they are designed for simple RAG, not complex agentic workflows.61 The literature frames "agentic AI on mobile/edge" as a future goal, not a current reality, precisely *because* of these resource constraints.56 This chasm is the research opportunity.

---

## **Part 5: State-of-the-Art Optimization Strategies (The Best Practices)**

**Objective:** To survey the SOTA solutions for the bottlenecks identified in Part 4\. This maps the existing *solution landscape*.

### **5.1 Software-Layer Optimizations (Optimizing the Generator)**

This category includes well-established techniques for making the LLM component itself smaller and faster.

* **Model Compression (Size):**  
  * **Quantization:** Reducing weight precision. This is the most common technique. SOTA includes Post-Training Quantization (PTQ) 62, Activation-aware Weight Quantization (AWQ) 63, and extreme 1-bit binarization.65 A 2025 benchmark of PTQ strategies suggests "compensation-based" techniques are the most robust across architectures.62  
  * **Pruning & Distillation (Size/Speed):** Removing redundant weights (pruning) or training a smaller "student" model on the output of a larger "teacher" model (distillation).66  
* **Efficient Inference (Speed/Consumption):**  
  * **Speculative Decoding (SD):** A *lossless* acceleration technique that uses a small, fast "draft" model to generate token sequences, which are then verified in parallel by the large "target" model.17 The 2025 SOTA, **Mixture of Attentions**, achieves 9.5% faster decoding than the previous SOTA (EAGLE-2).70  
  * **Efficient Attention:** Mechanisms like **FlashAttention** 18 or Hybrid Tree Attention 18 algorithmically solve the quadratic $O(n^2)$ prefill bottleneck by avoiding the materialization of large intermediate matrices in GPU memory.

### **5.2 Hardware-Layer Optimizations (Optimizing the Platform)**

This category includes specialized hardware co-designed for specific AI workloads, moving beyond general-purpose GPUs.

* **LLM Accelerators (FPGA/ASIC):**  
  * TENET 71: A "LUT-centric architecture" designed specifically for *ternary* (3-value) LLM inference on FPGAs and ASICs.  
  * 81: A SOTA FPGA design that leverages sparsity to achieve 4–5x the performance of GPU solutions on LLM inference.  
  * DB-Attn 72: A hardware-software co-design that accelerates *nonlinear* operations (like the Attention mechanism) using Block Floating Point (BFP) formats on FPGAs/ASICs.  
* **Retriever Accelerators (CPU):**  
  * Intel 14: Research focusing on optimizing vector search operations on Xeon CPUs using built-in SIMD instructions (Intel AVX-512).  
  * KBest 15: A system demonstrating "SIMD accelerated distance computation" that outperforms SOTA vector search libraries on standard x86 CPUs.

### **5.3 System-Layer Co-Design (The Thesis Frontier)**

This is the most advanced SOTA, where optimization targets the *entire, heterogeneous system*, not just one component.

* **Framework 1: RAGO (RAG-on-XPU):** This is a key 2025 paper. RAGO is a "systematic RAG serving optimization" framework.73 It performs *bottleneck analysis* and co-optimizes the *entire* RAG pipeline by making system-level scheduling decisions:  
  1. **Task Placement:** Deciding where to run the retriever (CPU) vs. the generator (GPU).  
  2. **Resource Allocation:** Dynamically assigning *how many* CPUs/GPUs are needed for each component.  
  3. Batching Policy: Tuning batch sizes for both retrieval and inference.73  
     This system-level co-design achieves up to a 2x increase in queries per second (QPS) per chip.74  
* **Framework 2: Hardware-Aware Agents:** This is an emerging concept. The AAAI-2025 presidential panel explicitly identifies "Hardware & AI" as a key theme, noting that AI research is "becoming increasingly tied to... dedicated AI hardware," leading to "AI architecture co-creation".75 The "Automated LLM Speedrunning Benchmark" 76 further tasks agents themselves with creating "hardware-aware optimizations." This is complemented by research into "agent architectures that jointly optimize accuracy and cost metrics".77  
* **Simulation Tools (The "Lab"):** Research in this area requires robust simulation tools.  
  * APEX+ 78: A "dynamism-aware simulator" for LLM serving. Critically, it can find execution plans that **reduce energy consumption by up to 45%** compared to plans that only optimize for latency.  
  * LLMServingSim 79: An open-source, system-level simulator for LLM serving systems.  
  * MELODI 80: An open-source *measurement* tool for profiling real-world energy consumption of LLMs, integrating scaphandre (CPU power) and nvidia-smi (GPU power).80 This is ideal for validating simulation results.

**Table 2: Taxonomy of SOTA Hardware Optimization Techniques**

| Pipeline Component | Bottleneck | Optimization Layer | SOTA Technique & (Source ID) |
| :---- | :---- | :---- | :---- |
| **Retriever** | Vector Search Latency | Hardware (CPU) | SIMD / AVX-512 Acceleration 14 |
|  | Vector Search Latency | Hardware (GPU) | GPU-accelerated DBs (e.g., Milvus) 13 |
|  | Precision/Latency Trade-off | Software (System) | Multiphase Ranking 10 |
| **Generator (Prefill)** | $O(n^2)$ Quadratic Attention | Software (Algorithm) | FlashAttention 18 |
|  | Compute-Intensive | Hardware (ASIC) | BFP for Nonlinear Ops (DB-Attn) 72 |
| **Generator (Decode)** | Memory-Bandwidth Bound | Software (Algorithm) | Speculative Decoding \[68, 69, 70\] |
|  | Memory Footprint (Size) | Software (Compression) | Quantization (AWQ, PTQ) \[62, 63, 64\] |
|  | Memory Footprint (Size) | Hardware (ASIC) | Ternary/Sparse Accelerators \[71, 81\] |
| **Full Agentic RAG System** | **Heterogeneous Bottlenecks** | **Software (Co-Design)** | **RAGO** (System-level Scheduler) \[73, 74\] |
|  | **CPU-Bound Logic** | **Software (Co-Design)** | **DAAO** (Difficulty-Aware Orchestration) 82 |
|  | **Dynamic Workload** | **Software (Simulation)** | **APEX+** (Energy-Aware Simulator) 78 |
|  | **Real-World Energy** | **Software (Measurement)** | **MELODI** (CPU/GPU Power Profiler) 80 |

---

## **Part 6: Identifying the Thesis Research Gap and Proposing Future Directions**

**Objective:** To synthesize all preceding analysis into concrete, novel, and defensible research gaps. This analysis moves beyond known limitations (e.g., poor long-horizon planning 83 or autoregressive inefficiencies 19) to identify actionable, systems-level gaps.

**The Overarching Gap:** The SOTA has produced *hardware-aware LLM systems* (e.g., RAGO 73) and *difficulty-aware agentic systems* (e.g., DAAO 82), but these domains have not been combined. The gap is the **"Hardware-Aware Agent"**: an agent that *reasons about* and *dynamically adapts to* its own computational and energy footprint.

### **6.1 Research Gap 1: The Hardware-Aware Agentic Orchestrator**

* **The Problem:** SOTA co-design (RAGO) optimizes a *static* RAG pipeline.73 SOTA agents (DAAO) adapt their workflows based on *query difficulty* but are *hardware-agnostic*—they are unaware if they are executing on a data center H100 or a resource-constrained mobile device.82  
* **The Gap:** A novel agent framework where the agent's *planning* process 84 explicitly includes the hardware state and constraints 60 as inputs to its decision-making.  
* **Proposed Thesis Question:** "Can an agentic RAG system dynamically optimize its own computational graph, in the style of Microsoft's 'Trace' framework 86, by selecting simpler models 29, shallower reasoning paths 87, or different RAG tools 36 in real-time, based on a *hardware-state feedback loop*?"

### **6.2 Research Gap 2: The Resource-Adaptive Agent (Self-Optimization for Energy)**

* **The Problem:** Current AI systems are overwhelmingly designed for *maximum performance*.88 Energy optimization is treated as a secondary, *static* design-time choice (e.g., use 8-bit quantization or not). This is an inadequate model for on-device systems 56, where battery life is a *dynamic* constraint.60  
* **The Gap:** An agent that *autonomously* manages its *own* energy consumption as a *primary goal*. This requires the agent to perceive and reason about *energy* as a finite resource.90  
* **Proposed Thesis Question:** "Can an agentic RAG system be designed to monitor *environmental signals* (e.g., battery state 56 or network state) and *dynamically self-optimize* its own pipeline to meet a 'Queries per Joule' 95 budget? For example: 'I am at 20% battery; I will now switch from Llama-3-70B to Llama-3-8B 96, engage 4-bit quantization, and use simple vector-RAG instead of hybrid-RAG to conserve power.'"

### **6.3 Research Gap 3: Co-Design of a Heterogeneous Agentic Accelerator (HAA)**

* **The Problem:** SOTA hardware acceleration is fragmented. It focuses on *parts* of the problem: LLM inference (e.g., TENET 71) or vector search (e.g., Intel AVX-512 14). This approach ignores the *dominant system-level bottleneck*: the *CPU-bound agentic loop* that constitutes 90.6% of latency.1  
* **The Gap:** A novel, *holistic* hardware architecture (e.g., as an FPGA or ASIC design) co-designed to accelerate the *entire* agentic RAG loop. This is the "AI architecture co-creation" that SOTA research is calling for.75  
* **Proposed Thesis Question:** "What is the optimal, energy-efficient hardware architecture (FPGA/ASIC) for an Agentic RAG system that *co-accelerates*: (1) memory-bandwidth-bound LLM decoding 20, (2) compute-bound LLM prefill 16, (3) SIMD-heavy vector retrieval 15, and (4) the *graph-based control flow and tool execution* of the agent itself?1"

---

## **Part 7: A Methodological Framework for Your Thesis**

A rigorous and reproducible methodology is required to address these gaps.

### **7.1 Stage 1: Workload Characterization**

1. **Action:** Reproduce the findings of 1 and.1 Using an open-source agent framework (e.g., LangGraph, AutoGen 97) and a RAG framework (e.g., FlashRAG, LlamaIndex 61), build a baseline Agentic RAG system.  
2. **Tools:** Use **MELODI** 80 and its underlying components (scaphandre for CPU power, nvidia-smi for GPU power) to profile the *entire* system (CPU, GPU, Memory, I/O) across a benchmark.  
3. **Goal:** To produce an empirical "Workload Characterization" chapter for the thesis. This chapter will replicate Table 1, empirically proving the existence and scale of the heterogeneous, CPU-dominant bottleneck in this specific agentic RAG workload.

### **7.2 Stage 2: System Simulation and Design**

1. **Action:** It is infeasible to build a new ASIC. It is feasible to simulate one.  
2. **Tools:** Use **APEX+** 78 or **LLMServingSim** 79 as a foundation.  
3. **Novelty:** The core methodological contribution will be *extending* these simulators. They are currently built for LLM-serving, not agents. The extension will involve modeling the *CPU-side agentic control flow* and *RAG tool-use* based on the empirical profile from Stage 1\. The "Hardware-Aware Agent" (Gap 1\) would then be a new *scheduling algorithm* within this modified simulator. The "Heterogeneous Agentic Accelerator" (Gap 3\) would be a new *virtual hardware profile*.

### **7.3 Stage 3: Metrics and Evaluation (The "BAR" Standard)**

A successful thesis in this domain must evaluate the final system (real or simulated) across three axes, which can be termed the **BAR** standard:

1. **B**enchmark Quality (RAG Metrics):  
   * **Frameworks:** Use SOTA evaluation frameworks like **RAGAs** 99 or **ARES**.101  
   * **Metrics:** Measure the "RAG Triad" 103: **Context Relevance, Faithfulness (Groundedness), and Answer Relevance**.  
2. **A**rchitectural Performance (Hardware Metrics):  
   * **Latency:** Time-to-First-Token (TTFT) and Time-Per-Output-Token (TPOT).78  
   * **Throughput:** Queries-Per-Second (QPS).74  
3. **R**esource Consumption (Energy/Size Metrics):  
   * **Energy:** **Joules per Request** 95 or **Joules per Output Token**.105 This should be the *primary* optimization target.  
   * **Size:** Model size (MB) and total memory footprint (GB).88

The final thesis result should be a **Pareto-optimal curve** plotting RAG Quality (e.g., Faithfulness) against Energy (Joules/Query). The novel system should demonstrate a clear push of this curve—for example, a 30% energy reduction for the *same* RAG quality score.78

### **7.4 Stage 4: Benchmarks and Datasets**

All experiments must be conducted on standard, reproducible benchmarks to be valid.

* **RAG/Agent Benchmarks:**  
  * **FlashRAG** 61: Provides 36 pre-processed RAG datasets.  
  * **BenchmarkQED** 46: Microsoft's SOTA framework for RAG benchmarking.  
  * **AgentBench** 107 or **LegalAgentBench** 24: For complex, multi-step agentic tasks.  
* **Hardware Benchmarks:**  
  * **MLPerf Inference** 108: The industry standard, now using Llama3.1-8B.  
* **Agentic Datasets:**  
  * General agent performance datasets 109, RAG-Reasoning collections 110, and generative AI datasets 111 can be used for pre-training or fine-tuning components.

This integrated plan provides a clear, SOTA-grounded, and academically rigorous path. The research focus must shift from the *components* (RAG, LLM, agent) to the *system* that binds them: the heterogeneous, CPU-bottlenecked, dynamic computational graph of the agentic loop.

#### **Works cited**

1. 1 Introduction \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2511.00739v1](https://arxiv.org/html/2511.00739v1)  
2. The 2025 Guide to Retrieval-Augmented Generation (RAG) \- Eden AI, accessed November 6, 2025, [https://www.edenai.co/post/the-2025-guide-to-retrieval-augmented-generation-rag](https://www.edenai.co/post/the-2025-guide-to-retrieval-augmented-generation-rag)  
3. Retrieval Augmented Generation (RAG) for LLMs \- Prompt Engineering Guide, accessed November 6, 2025, [https://www.promptingguide.ai/research/rag](https://www.promptingguide.ai/research/rag)  
4. Building Production-Ready RAG Systems: Best Practices and Latest Tools | by Meeran Malik, accessed November 6, 2025, [https://medium.com/@meeran03/building-production-ready-rag-systems-best-practices-and-latest-tools-581cae9518e7](https://medium.com/@meeran03/building-production-ready-rag-systems-best-practices-and-latest-tools-581cae9518e7)  
5. RAG in 2025: Bridging Knowledge and Generative AI \- Squirro, accessed November 6, 2025, [https://squirro.com/squirro-blog/state-of-rag-genai](https://squirro.com/squirro-blog/state-of-rag-genai)  
6. A Survey on Knowledge-Oriented Retrieval-Augmented Generation \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2503.10677v2](https://arxiv.org/html/2503.10677v2)  
7. RAG 2.0: How Retrieval-Augmented Generation Is Supercharging LLMs in 2025 \- Medium, accessed November 6, 2025, [https://medium.com/@StackGpu/rag-2-0-how-retrieval-augmented-generation-is-supercharging-llms-in-2025-9fcd847bf21a](https://medium.com/@StackGpu/rag-2-0-how-retrieval-augmented-generation-is-supercharging-llms-in-2025-9fcd847bf21a)  
8. \[2503.15191\] Optimizing Retrieval Strategies for Financial Question Answering Documents in Retrieval-Augmented Generation Systems \- arXiv, accessed November 6, 2025, [https://arxiv.org/abs/2503.15191](https://arxiv.org/abs/2503.15191)  
9. The 4 Advanced RAG Algorithms You Must Know to Implement \- Comet, accessed November 6, 2025, [https://www.comet.com/site/blog/advanced-rag-algorithms-optimize-retrieval/](https://www.comet.com/site/blog/advanced-rag-algorithms-optimize-retrieval/)  
10. Eliminating the Precision–Latency Trade-Off in Large-Scale RAG \- The New Stack, accessed November 6, 2025, [https://thenewstack.io/eliminating-the-precision-latency-trade-off-in-large-scale-rag/](https://thenewstack.io/eliminating-the-precision-latency-trade-off-in-large-scale-rag/)  
11. Best Vector Databases for RAG: Complete 2025 Comparison Guide \- Latenode, accessed November 6, 2025, [https://latenode.com/blog/ai-frameworks-technical-infrastructure/vector-databases-embeddings/best-vector-databases-for-rag-complete-2025-comparison-guide](https://latenode.com/blog/ai-frameworks-technical-infrastructure/vector-databases-embeddings/best-vector-databases-for-rag-complete-2025-comparison-guide)  
12. Best 17 Vector Databases for 2025 \[Top Picks\] \- lakeFS, accessed November 6, 2025, [https://lakefs.io/blog/best-vector-databases/](https://lakefs.io/blog/best-vector-databases/)  
13. Top 9 Vector Databases as of October 2025 \- Shakudo, accessed November 6, 2025, [https://www.shakudo.io/blog/top-9-vector-databases](https://www.shakudo.io/blog/top-9-vector-databases)  
14. How to Implement Retrieval-Augmented Generation (RAG) \- Intel, accessed November 6, 2025, [https://www.intel.com/content/www/us/en/goal/how-to-implement-rag.html](https://www.intel.com/content/www/us/en/goal/how-to-implement-rag.html)  
15. KBest: Efficient Vector Search on Kunpeng CPU \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2508.03016v2](https://arxiv.org/html/2508.03016v2)  
16. Mastering LLM Techniques: Inference Optimization | NVIDIA Technical Blog, accessed November 6, 2025, [https://developer.nvidia.com/blog/mastering-llm-techniques-inference-optimization/](https://developer.nvidia.com/blog/mastering-llm-techniques-inference-optimization/)  
17. LongSpec: Long-Context Lossless Speculative Decoding with Efficient Drafting and Verification \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2502.17421v2](https://arxiv.org/html/2502.17421v2)  
18. SpecExtend: A Drop-in Enhancement for Speculative Decoding of Long Sequences \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2505.20776v3](https://arxiv.org/html/2505.20776v3)  
19. Limitations of LLM models. Transformer-based models have achieved… | by DrKilngon | Medium, accessed November 6, 2025, [https://medium.com/@DrKilngon/limitations-of-llm-models-03cc3d6645b6](https://medium.com/@DrKilngon/limitations-of-llm-models-03cc3d6645b6)  
20. Combating the Memory Walls: Optimization Pathways for Long-Context Agentic LLM Inference \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2509.09505v1](https://arxiv.org/html/2509.09505v1)  
21. From Principles to Practice: A Systematic Study of LLM Serving on Multi-core NPUs \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2510.05632v1](https://arxiv.org/html/2510.05632v1)  
22. A Review of Large Language Models as Autonomous Agents and Tool Users \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2508.17281v2](https://arxiv.org/html/2508.17281v2)  
23. Writing effective tools for AI agents—using AI agents \- Anthropic, accessed November 6, 2025, [https://www.anthropic.com/engineering/writing-tools-for-agents](https://www.anthropic.com/engineering/writing-tools-for-agents)  
24. Enhancing LLM-Based Agents via Global Planning and Hierarchical Execution \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2504.16563v1](https://arxiv.org/html/2504.16563v1)  
25. Talk Structurally, Act Hierarchically: A Collaborative Framework for LLM Multi-Agent Systems, accessed November 6, 2025, [https://arxiv.org/html/2502.11098v1](https://arxiv.org/html/2502.11098v1)  
26. Scalable and Accurate Graph Reasoning with LLM-based Multi-Agents \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2410.05130v1](https://arxiv.org/html/2410.05130v1)  
27. A Comprehensive Guide to Evaluating Multi-Agent LLM Systems \- Orq.ai, accessed November 6, 2025, [https://orq.ai/blog/multi-agent-llm-eval-system](https://orq.ai/blog/multi-agent-llm-eval-system)  
28. Unlocking Scalable LLM-Agent Systems with Asymptotic Analysis | by Decision AI \- Medium, accessed November 6, 2025, [https://medium.com/@evolutionmlmail/unlocking-scalable-llm-agent-systems-with-asymptotic-analysis-b9244d85ca31](https://medium.com/@evolutionmlmail/unlocking-scalable-llm-agent-systems-with-asymptotic-analysis-b9244d85ca31)  
29. Difficulty-Aware Agent Orchestration in LLM-Powered Workflows \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2509.11079v2](https://arxiv.org/html/2509.11079v2)  
30. The unreasonable effectiveness of an LLM agent loop with tool use | Hacker News, accessed November 6, 2025, [https://news.ycombinator.com/item?id=43998472](https://news.ycombinator.com/item?id=43998472)  
31. \[2501.09136\] Agentic Retrieval-Augmented Generation: A Survey on Agentic RAG \- arXiv, accessed November 6, 2025, [https://arxiv.org/abs/2501.09136](https://arxiv.org/abs/2501.09136)  
32. Agentic Retrieval-Augmented Generation: A Survey on Agentic RAG \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2501.09136v1](https://arxiv.org/html/2501.09136v1)  
33. What is Agentic RAG? | IBM, accessed November 6, 2025, [https://www.ibm.com/think/topics/agentic-rag](https://www.ibm.com/think/topics/agentic-rag)  
34. A Complete Guide to Agentic RAG \- Moveworks, accessed November 6, 2025, [https://www.moveworks.com/us/en/resources/blog/what-is-agentic-rag](https://www.moveworks.com/us/en/resources/blog/what-is-agentic-rag)  
35. Beyond the hype: Why RAG remains essential for modern AI | Pinecone, accessed November 6, 2025, [https://www.pinecone.io/learn/rag-2025/](https://www.pinecone.io/learn/rag-2025/)  
36. Top 20+ Agentic RAG Frameworks \- Research AIMultiple, accessed November 6, 2025, [https://research.aimultiple.com/agentic-rag/](https://research.aimultiple.com/agentic-rag/)  
37. LLM-Independent Adaptive RAG: Let the Question Speak for Itself \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2505.04253v1](https://arxiv.org/html/2505.04253v1)  
38. A-Mem: Agentic Memory for LLM Agents \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2502.12110v1](https://arxiv.org/html/2502.12110v1)  
39. RAG XI — Agentic RAG \- Medium, accessed November 6, 2025, [https://medium.com/@danushidk507/rag-xi-agentic-rag-8d71d6f65cef](https://medium.com/@danushidk507/rag-xi-agentic-rag-8d71d6f65cef)  
40. Graphs Meet AI Agents: Taxonomy, Progress, and Future Opportunities \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2506.18019v1](https://arxiv.org/html/2506.18019v1)  
41. ESCARGOT: an AI agent leveraging large language models, dynamic graph of thoughts, and biomedical knowledge graphs for enhanced reasoning | Bioinformatics | Oxford Academic, accessed November 6, 2025, [https://academic.oup.com/bioinformatics/article/41/2/btaf031/7972741](https://academic.oup.com/bioinformatics/article/41/2/btaf031/7972741)  
42. Generative Retrieval-Augmented Ontologic Graph and Multiagent Strategies for Interpretive Large Language Model-Based Materials Design | ACS Engineering Au, accessed November 6, 2025, [https://pubs.acs.org/doi/10.1021/acsengineeringau.3c00058](https://pubs.acs.org/doi/10.1021/acsengineeringau.3c00058)  
43. A Systematic Review of Key Retrieval-Augmented Generation (RAG) Systems: Progress, Gaps, and Future Directions \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2507.18910v1](https://arxiv.org/html/2507.18910v1)  
44. Comparative Analysis of RAG, Graph RAG, Agentic Graphs, and Agentic Learning Graphs | by Jose F. Sosa | Medium, accessed November 6, 2025, [https://medium.com/@josefsosa/comparative-analysis-of-rag-graph-rag-agentic-graphs-and-agentic-learning-graphs-babb9d56c58e](https://medium.com/@josefsosa/comparative-analysis-of-rag-graph-rag-agentic-graphs-and-agentic-learning-graphs-babb9d56c58e)  
45. RAG in 2025: The enterprise guide to retrieval augmented generation, Graph RAG and agentic AI \- Data Nucleus, accessed November 6, 2025, [https://datanucleus.dev/rag-and-agentic-ai/what-is-rag-enterprise-guide-2025](https://datanucleus.dev/rag-and-agentic-ai/what-is-rag-enterprise-guide-2025)  
46. BenchmarkQED: Automated benchmarking of RAG systems \- Microsoft Research, accessed November 6, 2025, [https://www.microsoft.com/en-us/research/blog/benchmarkqed-automated-benchmarking-of-rag-systems/](https://www.microsoft.com/en-us/research/blog/benchmarkqed-automated-benchmarking-of-rag-systems/)  
47. ReaGAN: Node-as-Agent-Reasoning Graph Agentic Network \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2508.00429v1](https://arxiv.org/html/2508.00429v1)  
48. RAG vs Memory for AI Agents: What's the Difference \- DEV Community, accessed November 6, 2025, [https://dev.to/bobur/rag-vs-memory-for-ai-agents-whats-the-difference-2ad0](https://dev.to/bobur/rag-vs-memory-for-ai-agents-whats-the-difference-2ad0)  
49. Evaluating Memory in LLM Agents via Incremental Multi-Turn Interactions \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2507.05257v2](https://arxiv.org/html/2507.05257v2)  
50. RAG Vs Memory in AI Agent \- by Naresh Kancharla \- Medium, accessed November 6, 2025, [https://medium.com/@naresh.kancharla/rag-vs-memory-in-ai-agent-95c996ff1ad7](https://medium.com/@naresh.kancharla/rag-vs-memory-in-ai-agent-95c996ff1ad7)  
51. A-Mem: Agentic Memory for LLM Agents \- NeurIPS 2025, accessed November 6, 2025, [https://neurips.cc/virtual/2025/poster/119020](https://neurips.cc/virtual/2025/poster/119020)  
52. Agentic RAG vs. Traditional RAG. Retrieval-Augmented Generation (RAG)… | by Rahul Kumar | Medium, accessed November 6, 2025, [https://medium.com/@gaddam.rahul.kumar/agentic-rag-vs-traditional-rag-b1a156f72167](https://medium.com/@gaddam.rahul.kumar/agentic-rag-vs-traditional-rag-b1a156f72167)  
53. Agentic Retrieval-Augmented Generation: A Survey on Agentic RAG \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2501.09136v3](https://arxiv.org/html/2501.09136v3)  
54. The fight for latency: why agents have changed the game \- d-Matrix, accessed November 6, 2025, [https://www.d-matrix.ai/the-fight-for-latency-why-agents-have-changed-the-game/](https://www.d-matrix.ai/the-fight-for-latency-why-agents-have-changed-the-game/)  
55. Agentic RAG: How enterprises are surmounting the limits of traditional RAG \- Redis, accessed November 6, 2025, [https://redis.io/blog/agentic-rag-how-enterprises-are-surmounting-the-limits-of-traditional-rag/](https://redis.io/blog/agentic-rag-how-enterprises-are-surmounting-the-limits-of-traditional-rag/)  
56. Adaptive and Resource-efficient Agentic AI Systems for Mobile and Embedded Devices: A Survey \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2510.00078v1](https://arxiv.org/html/2510.00078v1)  
57. Agentic RAG: What's All The Fuss About? \- Dell, accessed November 6, 2025, [https://www.dell.com/en-us/blog/agentic-rag-what-s-all-the-fuss-about/](https://www.dell.com/en-us/blog/agentic-rag-what-s-all-the-fuss-about/)  
58. Simplify Enterprise AI Adoption and Scale With Agentic AI \- Dell, accessed November 6, 2025, [https://www.dell.com/en-us/blog/simplify-enterprise-ai-adoption-and-scale-with-agentic-ai/](https://www.dell.com/en-us/blog/simplify-enterprise-ai-adoption-and-scale-with-agentic-ai/)  
59. Demystifying On-Device Intelligent Search Using RAG Architecture ..., accessed November 6, 2025, [https://infohub.delltechnologies.com/p/demystifying-on-device-intelligent-search-using-rag-architecture/](https://infohub.delltechnologies.com/p/demystifying-on-device-intelligent-search-using-rag-architecture/)  
60. Agentic AI and physical AI will change everything | imec, accessed November 6, 2025, [https://www.imec-int.com/en/articles/agentic-and-physical-ai-will-change-everything](https://www.imec-int.com/en/articles/agentic-and-physical-ai-will-change-everything)  
61. 15 Best Open-Source RAG Frameworks in 2025 \- Firecrawl, accessed November 6, 2025, [https://www.firecrawl.dev/blog/best-open-source-rag-frameworks](https://www.firecrawl.dev/blog/best-open-source-rag-frameworks)  
62. arXiv:2502.13178v2 \[cs.LG\] 24 Mar 2025, accessed November 6, 2025, [https://www.arxiv.org/pdf/2502.13178v2](https://www.arxiv.org/pdf/2502.13178v2)  
63. Optimizing LLMs for Performance and Accuracy with Post-Training Quantization, accessed November 6, 2025, [https://developer.nvidia.com/blog/optimizing-llms-for-performance-and-accuracy-with-post-training-quantization/](https://developer.nvidia.com/blog/optimizing-llms-for-performance-and-accuracy-with-post-training-quantization/)  
64. MLSys 2024 List of Accepted Papers, accessed November 6, 2025, [https://mlsys.org/Conferences/2024/AcceptedPapers](https://mlsys.org/Conferences/2024/AcceptedPapers)  
65. Progressive Binarization with Semi-Structured Pruning for LLMs \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2502.01705v4](https://arxiv.org/html/2502.01705v4)  
66. EfficientLLM: Scalable Pruning-Aware Pretraining for Architecture-Agnostic Edge Language Models \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2502.06663v2](https://arxiv.org/html/2502.06663v2)  
67. \[2408.11796\] LLM Pruning and Distillation in Practice: The Minitron Approach \- arXiv, accessed November 6, 2025, [https://arxiv.org/abs/2408.11796](https://arxiv.org/abs/2408.11796)  
68. Intel and Weizmann Institute Speed AI with Speculative Decoding Advance, accessed November 6, 2025, [https://newsroom.intel.com/artificial-intelligence/intel-weizmann-institute-speed-ai-with-speculative-decoding-advance](https://newsroom.intel.com/artificial-intelligence/intel-weizmann-institute-speed-ai-with-speculative-decoding-advance)  
69. Tag: LLM Techniques | NVIDIA Technical Blog, accessed November 6, 2025, [https://developer.nvidia.com/blog/tag/llm-techniques/](https://developer.nvidia.com/blog/tag/llm-techniques/)  
70. Accelerating Language Model Inference with Mixture of Attentions \- Hugging Face, accessed November 6, 2025, [https://huggingface.co/blog/hba123/sotaspeculativedecoding](https://huggingface.co/blog/hba123/sotaspeculativedecoding)  
71. TENET: An Efficient Sparsity-Aware LUT-Centric Architecture for Ternary LLM Inference On Edge \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2509.13765v1](https://arxiv.org/html/2509.13765v1)  
72. Pushing the Limits of BFP on Narrow Precision LLM Inference | Proceedings of the AAAI Conference on Artificial Intelligence, accessed November 6, 2025, [https://ojs.aaai.org/index.php/AAAI/article/view/35407](https://ojs.aaai.org/index.php/AAAI/article/view/35407)  
73. RAGO: Systematic Performance Optimization for Retrieval ..., accessed November 6, 2025, [https://people.csail.mit.edu/suvinay/pubs/2025.rago.isca.pdf](https://people.csail.mit.edu/suvinay/pubs/2025.rago.isca.pdf)  
74. \[2503.14649\] RAGO: Systematic Performance Optimization for Retrieval-Augmented Generation Serving \- arXiv, accessed November 6, 2025, [https://arxiv.org/abs/2503.14649](https://arxiv.org/abs/2503.14649)  
75. Future of AI Research \- Association for the Advancement of Artificial Intelligence (AAAI), accessed November 6, 2025, [https://aaai.org/wp-content/uploads/2025/03/AAAI-2025-PresPanel-Report-FINAL.pdf](https://aaai.org/wp-content/uploads/2025/03/AAAI-2025-PresPanel-Report-FINAL.pdf)  
76. \[2506.22419\] The Automated LLM Speedrunning Benchmark: Reproducing NanoGPT Improvements \- arXiv, accessed November 6, 2025, [https://arxiv.org/abs/2506.22419](https://arxiv.org/abs/2506.22419)  
77. AI Agents: Evolution, Architecture, and Real-World Applications \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2503.12687v1](https://arxiv.org/html/2503.12687v1)  
78. microsoft/apex\_plus: APEX+ is an LLM Serving Simulator \- GitHub, accessed November 6, 2025, [https://github.com/microsoft/apex\_plus](https://github.com/microsoft/apex_plus)  
79. LLMServingSim: A HW/SW Co-Simulation Infrastructure for LLM Inference Serving at Scale, accessed November 6, 2025, [https://arxiv.org/html/2408.05499v1](https://arxiv.org/html/2408.05499v1)  
80. ejhusom/MELODI: Use local Large Language Models ... \- GitHub, accessed November 6, 2025, [https://github.com/ejhusom/MELODI](https://github.com/ejhusom/MELODI)  
81. TerEffic: Highly Efficient Ternary LLM Inference on FPGA \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2502.16473v2](https://arxiv.org/html/2502.16473v2)  
82. Difficulty-Aware Agent Orchestration in LLM-Powered Workflows \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2509.11079v1](https://arxiv.org/html/2509.11079v1)  
83. AI Agents vs. Agentic AI: A Conceptual Taxonomy, Applications and Challenges \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2505.10468v1](https://arxiv.org/html/2505.10468v1)  
84. What is AI Agent Planning? | IBM, accessed November 6, 2025, [https://www.ibm.com/think/topics/ai-agent-planning](https://www.ibm.com/think/topics/ai-agent-planning)  
85. What Is Agentic AI? \- Oracle, accessed November 6, 2025, [https://www.oracle.com/artificial-intelligence/agentic-ai/](https://www.oracle.com/artificial-intelligence/agentic-ai/)  
86. Tracing the path to self-adapting AI agents \- Microsoft Research, accessed November 6, 2025, [https://www.microsoft.com/en-us/research/blog/tracing-the-path-to-self-adapting-ai-agents/](https://www.microsoft.com/en-us/research/blog/tracing-the-path-to-self-adapting-ai-agents/)  
87. Stop Overthinking: A Survey on Efficient Reasoning for Large Language Models \- arXiv, accessed November 6, 2025, [https://arxiv.org/pdf/2503.16419](https://arxiv.org/pdf/2503.16419)  
88. The Best GPUs for Local LLM Inference in 2025, accessed November 6, 2025, [https://localllm.in/blog/best-gpus-llm-inference-2025](https://localllm.in/blog/best-gpus-llm-inference-2025)  
89. Consumer hardware landscape for local LLMs June 2025 : r/LocalLLaMA \- Reddit, accessed November 6, 2025, [https://www.reddit.com/r/LocalLLaMA/comments/1lmmh3l/consumer\_hardware\_landscape\_for\_local\_llms\_june/](https://www.reddit.com/r/LocalLLaMA/comments/1lmmh3l/consumer_hardware_landscape_for_local_llms_june/)  
90. What is Agentic AI? | IBM, accessed November 6, 2025, [https://www.ibm.com/think/topics/agentic-ai](https://www.ibm.com/think/topics/agentic-ai)  
91. Agentic AI in Energy | Vstorm, accessed November 6, 2025, [https://vstorm.co/agentic-ai/agentic-ai-in-energy/](https://vstorm.co/agentic-ai/agentic-ai-in-energy/)  
92. How Can Agentic AI Transform Energy Consumption Optimization? \- Monetizely, accessed November 6, 2025, [https://www.getmonetizely.com/articles/how-can-agentic-ai-transform-energy-consumption-optimization](https://www.getmonetizely.com/articles/how-can-agentic-ai-transform-energy-consumption-optimization)  
93. Grid-Agent: An LLM-Powered Multi-Agent System for Power Grid Control \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2508.05702v2](https://arxiv.org/html/2508.05702v2)  
94. The Rise of AI-Powered Battery Management for Smarter Mobile Energy Use \- inoru, accessed November 6, 2025, [https://www.inoru.com/blog/ai-powered-battery-management-mobile-energy/](https://www.inoru.com/blog/ai-powered-battery-management-mobile-energy/)  
95. Benchmarking Energy Efficiency of Large Language Models Using vLLM Corresponding author: kallepronk@proton.me \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2509.08867v1](https://arxiv.org/html/2509.08867v1)  
96. Agentic AI Home Energy Management System: A Large Language Model Framework for Residential Load Scheduling \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2510.26603v1](https://arxiv.org/html/2510.26603v1)  
97. Comparing 4 Agentic Frameworks: LangGraph, CrewAI, AutoGen, and Strands Agents | by Dr Alexandra Posoldova | Medium, accessed November 6, 2025, [https://medium.com/@a.posoldova/comparing-4-agentic-frameworks-langgraph-crewai-autogen-and-strands-agents-b2d482691311](https://medium.com/@a.posoldova/comparing-4-agentic-frameworks-langgraph-crewai-autogen-and-strands-agents-b2d482691311)  
98. 25+ Best Open Source RAG Frameworks in 2025 \- Signity Solutions, accessed November 6, 2025, [https://www.signitysolutions.com/blog/best-open-source-rag-frameworks](https://www.signitysolutions.com/blog/best-open-source-rag-frameworks)  
99. RAG Evaluation: Metrics and Benchmarks for Enterprise AI Systems \- Label Your Data, accessed November 6, 2025, [https://labelyourdata.com/articles/llm-fine-tuning/rag-evaluation](https://labelyourdata.com/articles/llm-fine-tuning/rag-evaluation)  
100. RAGAS vs ARES: Retrieval-Augmented Generation (RAG) Evaluation \- Medium, accessed November 6, 2025, [https://medium.com/@harshvivek14/ragas-vs-ares-e382a72bb926](https://medium.com/@harshvivek14/ragas-vs-ares-e382a72bb926)  
101. \[2311.09476\] ARES: An Automated Evaluation Framework for Retrieval-Augmented Generation Systems \- arXiv, accessed November 6, 2025, [https://arxiv.org/abs/2311.09476](https://arxiv.org/abs/2311.09476)  
102. ARES: An Automated Evaluation Framework for Retrieval-Augmented Generation Systems \- ACL Anthology, accessed November 6, 2025, [https://aclanthology.org/2024.naacl-long.20.pdf](https://aclanthology.org/2024.naacl-long.20.pdf)  
103. Result Evaluation \- IBM, accessed November 6, 2025, [https://www.ibm.com/architectures/papers/rag-cookbook/result-evaluation](https://www.ibm.com/architectures/papers/rag-cookbook/result-evaluation)  
104. Forecasting LLM Inference Performance via Hardware-Agnostic Analytical Modeling \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2508.00904v1](https://arxiv.org/html/2508.00904v1)  
105. Power Usage and Energy Efficiency \- llm-tracker, accessed November 6, 2025, [https://llm-tracker.info/\_TOORG/Power-Usage-and-Energy-Efficiency](https://llm-tracker.info/_TOORG/Power-Usage-and-Energy-Efficiency)  
106. RAG Evaluation Metrics: Best Practices for Evaluating RAG Systems \- Patronus AI, accessed November 6, 2025, [https://www.patronus.ai/llm-testing/rag-evaluation-metrics](https://www.patronus.ai/llm-testing/rag-evaluation-metrics)  
107. Survey on Evaluation of LLM-based Agents \- arXiv, accessed November 6, 2025, [https://arxiv.org/html/2503.16416v1](https://arxiv.org/html/2503.16416v1)  
108. MLPerf Inference 5.1: Benchmarking Small LLMs with Llama3.1-8B \- MLCommons, accessed November 6, 2025, [https://mlcommons.org/2025/09/small-llm-inference-5-1/](https://mlcommons.org/2025/09/small-llm-inference-5-1/)  
109. Agentic AI Performance Dataset 2025 \- Kaggle, accessed November 6, 2025, [https://www.kaggle.com/datasets/bismasajjad/agentic-ai-performance-and-capabilities-dataset](https://www.kaggle.com/datasets/bismasajjad/agentic-ai-performance-and-capabilities-dataset)  
110. \[EMNLP 2025\] Awesome RAG Reasoning Resources \- GitHub, accessed November 6, 2025, [https://github.com/DavidZWZ/Awesome-RAG-Reasoning](https://github.com/DavidZWZ/Awesome-RAG-Reasoning)  
111. 20 Open-Source Datasets for Generative and Agentic AI \- Analytics Vidhya, accessed November 6, 2025, [https://www.analyticsvidhya.com/blog/2025/02/open-source-datasets-for-generative-and-agentic-ai/](https://www.analyticsvidhya.com/blog/2025/02/open-source-datasets-for-generative-and-agentic-ai/)