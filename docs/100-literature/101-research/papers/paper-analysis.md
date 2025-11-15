# RAGO: Systematic Performance Optimization for Retrieval-Augmented Generation Serving
## **Top-Tier Abstract / Executive Summary**

This paper introduces **RAGSchema**, a structured abstraction to describe heterogeneous RAG pipelines, and **RAGO**, a systems-optimization framework that automatically generates optimal scheduling configurations (task placement, batching, resource allocation) to maximize efficiency in RAG serving. Through extensive modeling on large-scale LLMs, ANN retrieval, iterative retrieval, long-context processing, and reranker/rewriter pipelines, the authors show that RAG workloads exhibit _massive performance variability_ depending on model size, retrieval parameters, hardware generation, and batching strategies.

RAGO finds Pareto-optimal schedules that provide **up to 2× QPS/chip** and **55% lower TTFT** compared to naïve LLM-only-derived serving designs, demonstrating that **“one-size-fits-all LLM serving” fails for RAG**.

For your thesis on **sustainable agentic RAG**, RAGO provides foundational insights: where retrieval dominates energy; when LLM prefix/decode dominates; how small auxiliary models (rewriter, reranker, encoders) unexpectedly become bottlenecks; and how batching and placement affect energy and hardware footprint. The paper also offers a performance-modeling methodology that can be adapted to estimate **J/token**, **VRAM headroom**, and **agentic routing overhead**.
## **1. General Idea**

### **Category**
- **Systems paper** (measurement + analytical modeling + optimization)
- **Performance characterization** of heterogeneous RAG workloads
- **Scheduling and resource-allocation framework**

### **Context**
- Follows large-scale RAG systems like **RETRO**, **REALM**, **GraphRAG**, **InstructRETRO**.
- Builds on LLM serving literature: disaggregation of prefix/decode in **PaLM Serve**, **vLLM**, **FasterTransformer**.
- Retrieval foundations: IVF-PQ, ScaNN, HNSW, vector search cost models.
- Theoretical basis:
    - _Amdahl’s Law_ applied to RAG heterogeneity.
    - _Roofline models_ for inference and retrieval.
    - _Pipeline parallelism + batch scheduling_.

### **Assumptions (correctness check)**
1. **Cost models accurately represent inference & retrieval behavior**
    ✓ Backed by calibrated XPU and ScaNN simulations.

2. **Database size + retrieval configs match industrial RETRO-like setups**
    ✓ Reasonable (64B vectors, PQ quantization).

3. **LLMs quantized to 8-bit, sized up to 405B**
    ✓ Assumption is standard for systems work exploring Pareto trends.

4. **Latency dominated by compute/memory and minimal network overhead**
    ✓ Mostly correct, though may understate reality for distributed retrieval.

5. **User workloads resemble QA + long-context processing**
    ✓ Reasonable for standard RAG benchmarks.

Overall: assumptions are valid for comparative analysis.

### **Main Contributors**
- ETH Zurich + Google + Google DeepMind collaboration.
- Strong systems/ML co-design expertise.

### **Clarity Score**
**9/10**

Extensive figures and breakdowns, clear definitions of RAG paradigms.
Dense but exceptionally well structured.

## **2. Technical Summary**

### **2.1 Methodology**
#### **Workload abstraction: RAGSchema**
Defines a unified schema specifying:
- **Pipeline components:** encoder, rewriter, reranker, retrieval, LLM (prefix & decode).
- **Model sizes** for all components.
- **Retrieval configuration:**
    DB size, PQ encoding, queries/retrieval, iterative frequency, vector dimension.
- **Sequence lengths** for prefix & decode.

This enables describing any RAG pipeline as a structured configuration object.

### **Large-Scale Simulation Methodology**
#### **Hardware**
- Generic **XPU systolic-array accelerator**
    96GB HBM, 459 TFLOPS, 2.7TB/s BW (TPU-v5p-like)
- Distributed ScaNN retrieval across CPU clusters (AMD EPYC).

#### **Inference Modeling**
- Operator-level roofline model:
```
t_op = max( FLOPs / compute_throughput ,
            bytes_accessed / memory_bandwidth )
```

- Supports pipeline + tensor parallelism.
- Prefix and decode modeled separately (key to TTFT/TPOT).

#### **Retrieval Modeling**
- Based on ScaNN PQ cost:
```
retrieval_bytes = N_vectors * PQ_bytes * (scan_percentage)
```

- Multi-server distributed retrieval.
- Models compute vs memory bottlenecks.

### **Paradigm-Specific Studies**

#### **Case I – Hyperscale Retrieval**
Findings:
- Retrieval dominates latency with small LLMs (80%+ time)
- Increasing number of query vectors → QPS collapses ~linearly.
- Increasing accelerator speed worsens retrieval bottleneck.
- Small LLMs do NOT provide proportional speedups, because retrieval cost is fixed.

#### **Case II – Long-Context Processing**
- Retrieval negligible (<1%).
- Database encoding (120M encoder) becomes bottleneck due to length (100K–10M tokens).
- RAG gives **2850× TTFT improvement** over loading long-context into LLM directly.

#### **Case III – Iterative Retrieval**
- Decode becomes idle waiting for batched retrievals → major TPOT degradation    
- Poor batching → up to **3× slower** decode.
- Must balance decode batch size vs retrieval-prefix batch size.

#### **Case IV – Rewriter + Reranker**
- Reranker cost negligible.
- Rewriter (8B) increases TTFT by **2.4×** due to autoregressive prefix.

### **RAGO: System Optimization Framework**
#### **Three Scheduling Dimensions**
1. **Task placement**
    - Collocate (e.g., encoder + reranker + prefix) or disaggregate (prefix vs decode).
2. **Resource allocation**
    - XPUs per component (powers of two).
3. **Batching policies** (per stage)
    - Prefix: small batches
    - Decode: large continuous batches
    - Iterative retrieval: custom batch size to avoid stalls

#### **Search Strategy**
- Exhaustive enumeration across millions of configurations.
- Evaluates TTFT, TPOT, QPS/Chip.
- Outputs the **Pareto frontier**.

### **2.2 Key Learnings & Outcomes**
1. **RAG is not a single workload — hardware bottlenecks shift drastically**
    Retrieval-bound vs inference-bound vs encoder-bound depending on config.
2. **Prefix/decode disaggregation from LLM-only systems is not optimal for RAG**
    Sometimes collocation improves TTFT by sharing accelerator pools.
3. **Auxiliary models become unexpected bottlenecks**
    Encoders (long context), rewriters (autoregressive), or small models with huge input lengths.
4. **Batching strategy is the single largest lever**
    Wrong decode/iterative-retrieval batching can cause 3× slowdown.
5. **Retrieval parameters (scan %) dramatically affect performance**
    0.01% → 1% database scan increases retrieval cost by up to 100×.

### **2.3 Constraints & Limitations**
- No real hardware implementation — relies on calibrated simulators.
- Retrieval simulation may underestimate networking cost.
- Quality metrics (nDCG, EM, hallucination reduction) not modeled.
- Assumes synthetic QA workloads; does not test enterprise document scenarios.
- No energy measurements (J/token) in the current paper — only time and throughput.

### **2.4 Implications**
- **System designers must adopt workload-specific scheduling — no global best-practice.**
- **Agentic routing systems should consider retrieval load when switching models.**
- **Long-context RAG must cache embeddings aggressively** → massive energy savings.
- **Iterative retrieval must be meter-driven, not always-on**.
- **When LLM is small, retrieval dominates energy**; when LLM is large, inference dominates.

## **3. Top 5 References in This Paper**
1. **RETRO: Improving language models by retrieving relevant documents** (DeepMind, 2022)
    Foundation for hyperscale retrieval RAG.

2. **REALM** (Google Research)
    Early dense-retrieval-based language model.

3. **ScaNN** (Google, 2020–2023)
    Basis for retrieval performance modeling.

4. **PaLM/TPU v5e/v5p LLM serving systems**
    Influential in prefix/decode disaggregation assumptions.

5. **GraphRAG (Microsoft, 2024)**
    Representative multi-hop and iterative retrieval pipeline influencing RAGO’s iterative retrieval modeling

## **4. Top 5 references for “sustainable agentic RAG”**
These are most relevant _from the RAGO paper’s citation graph_ to your specific thesis.
1. **Daikon / ACT-3 / difficulty-aware routing**
    - Action space for agentic model selection based on query complexity.
    - Helps reduce energy by using small models when possible.

2. **RETRO**
    - Demonstrates replacing huge LLMs with smaller models using retrieval → energy savings.

3. **GraphRAG**
    - Multi-hop; heavy CPU pipelines → insight into CPU energy optimization.
    - Shows where graph-based agents increase load unnecessarily.

4. **ScaNN + PQ Encoding papers**
    - Vector search dominates energy in small-LLM RAG.
    - Optimizing PQ (e.g., 1-byte per 8 dims) is key for energy-efficient retrieval.

5. **LLM serving papers (vLLM, PaLM Serve, Orca)**
    - Provide modern baseline for TTFT/TPOT, KV-cache reuse, and GPU utilization.
    - Essential for your energy-aware metrics (VRAM, J/token).

## **5. Where the paper helps my thesis (“Sustainable Agentic RAG”)**
### **5.1 Useful techniques**

- **RAGSchema abstraction** → use it to define your agentic workflows (HyDE, reranker, small LLM, big LLM).
- **Roofline performance models** → adapt to measure **Watts**, **J/token**, **J/turn**.
- **Scheduling search space** → base for designing _agentic routing_ that chooses:
    - Whether to call retrieval        
    - How many retrievals
    - Which model to use
    - What batch size to trigger
### **5.2 Key insights for energy optimization**

- Retrieval often dominates energy for small models → your agent should _disable retrieval when not needed_.
- Rewriter increases TTFT significantly → your agent must use it _conditionally_ (meter-based).
- Long-context encoder becomes bottleneck → embed once + cache forever = huge energy savings.
- Iterative retrieval can stall decoding → avoid iterative steps unless confidence is low.

### **5.3 What this paper enables for my system**

- A formal way to measure **hardware cost** of each pipeline decision (placement, batching).
- Understanding when _agentic orchestration adds overhead instead of reducing it_.
- Identifying **Pareto-optimal energy/performance schedules** for your vLLM + Milvus + BGE-M3 setup.

### **5.4 Research gaps to exploit

- RAGO does not define agentic policies → you can extend its scheduling with **agent-based decision modules**.
- No energy metrics → your thesis can introduce J/token, GPU-power sampling, KV-eviction cost.
- No dynamic workflows → you can add adaptive routing (small LLM → big LLM → reranker).
- No hybrid dense+sparse retrieval → your system uses BGE-M3 hybrid, which introduces new tradeoffs.



---
# Agentic Retrieval-Augmented Generation: A Survey on Agentic RAG
**abstract** 
This paper is a broad *survey & taxonomy* of Agentic RAG. It starts from classic RAG (naïve, advanced, modular, graph RAG), then adds agentic intelligence (reflection, planning, tool use, multi-agent collaboration) to define “Agentic RAG” as RAG with autonomous workflow control. It classifies architectures (single-agent router, multi-agent, hierarchical, corrective, adaptive, graph-based agentic RAG, document workflows), surveys tools/frameworks (LangGraph, LlamaIndex, CrewAI, AG2, Bedrock, Vertex AI, etc.), and lists benchmarks/datasets for RAG evaluation. The paper is conceptual rather than empirical: it does **not** define unified metrics or run experiments, but gives a map of design patterns and concrete systems that you can mine for agentic patterns, workflow types, and evaluation hooks for your “sustainable agentic RAG” work. 

## 1) General idea
**Paper category**
- **Type:** Survey / taxonomy & conceptual analysis (no new algorithm, no experiments).  
- **Scope:** Agentic RAG: RAG systems where *agents* (single or multiple) orchestrate retrieval and generation using patterns like reflection, planning, tool use, multi-agent collaboration, and workflow graphs.  [oai_citation:2‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  

**Context (related work & theoretical basis)**
- **Builds on:**
	- General LLM surveys [1–3]. 
	- Classical RAG surveys: Gao et al. “Retrieval-Augmented Generation for LLMs: A Survey” [20]; Graph RAG survey [16]; AIGC/RAG survey [9]. 
	- Agentic-intelligence work: memory in LLM agents [22], reflection/critique (Self-Refine, Reflexion, CRITIC) [23,27,28], planning surveys [24], multi-agent surveys [29].  
	- Vendor/OSS patterns: Anthropic “Building Effective Agents” [12], LangGraph workflows [13], LlamaIndex ADW [36], Weaviate “Agentic RAG” [30]. 
- **Theoretical backbone:**
	- Decomposition of RAG into paradigms: Naïve, Advanced, Modular, Graph, Agentic RAG. 
	- Agentic patterns: reflection, planning, tool use, multi-agent; workflow patterns: prompt chaining, routing, parallelization, orchestrator-worker, evaluator-optimizer. 

**Assumptions (and correctness evaluation)**
Key implicit assumptions:
- **Agentic patterns improve RAG**: reflection, planning, multi-agent systems are assumed to *improve* contextual relevance, multi-step reasoning and adaptability, but the survey itself does **not** provide systematic quantitative evidence across systems—most claims are supported via cited case studies or vendor examples. 

- **Scalability & performance**: It is repeatedly claimed that agentic RAG can “reduce latency”, “scale multi-domain tasks”, or “improve efficiency”, but those statements are usually anecdotal (e.g. Twitch, LlamaIndex workflows) rather than backed by standardized metrics like TTFT, QPS, or energy.  [oai_citation:10‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  

- **Benchmarks as adequate proxies**: They list many RAG benchmarks and datasets (BEIR, MS MARCO, HotpotQA, RAGBench, FlashRAG, BERGEN, GNN-RAG, etc.) and implicitly assume these are sufficient to evaluate agentic systems, though almost none are specifically designed for *agentic* cost/efficiency trade-offs.  [oai_citation:11‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46) 
Your POV vs theirs:
- They are **correct** at the level of *qualitative mapping* and references.
- They are **thin** on:
  - unified metrics for agentic RAG,
  - resource/energy modeling,
  - formal analysis of latency vs quality vs complexity of workflows.

So: **good conceptual map**, but not a rigorous performance/efficiency framework.
**Main contributors**

- First author: **Aditi Singh** (Cleveland State University).  
- Co-authors: Abul Ehtesham, Saket Kumar, Tala Talaei Khoei, from industry (Davey, MathWorks) and academia (Northeastern).  [oai_citation:12‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  

**Clarity score (subjective, 1–10)**

- **7.5 / 10**
  - 👍 Clear high-level structure (evolution of RAG, agentic principles, workflow patterns, taxonomy, tools, benchmarks).  
  - 👍 Many diagrams (overviews of RAG types, workflows, architectures).  [oai_citation:13‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  
  - 👎 Some repetition; taxonomy and application sections are descriptive but occasionally vague on technical details (e.g., missing micro-architectural diagrams or precise interfaces).  
  - 👎 No unifying notation or metric framework; more narrative than analytical.

---

## 2) Technical summary (methods, key learnings, outcomes, constraints, implications)

### 2.1 Methodology

- **Survey methodology (implicit):**
  - Collects prior work on:
    - RAG paradigms (naïve, advanced, modular, graph) [20,16].  
    - Agentic patterns and workflows [12,13,25,26].  
    - Concrete Agentic RAG frameworks (Corrective RAG, Adaptive RAG, Agent-G, GeAR, ADW, etc.).  [oai_citation:14‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  
    - Tools and platforms (LangGraph, LlamaIndex, Hugging Face RAG recipes, Qdrant, Bedrock, Vertex AI, Semantic Kernel, IBM Granite, Weaviate, etc.).  [oai_citation:15‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  
  - Organizes them into:
    - **Conceptual layers**: RAG evolution → agentic intelligence → workflow patterns → architectural taxonomy → applications → tools → benchmarks.  [oai_citation:16‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  
- There is **no unified experimental setup**; each referenced work uses its own benchmarks and metrics.

### 2.2 Core content & methodologies (by block)

#### A. Foundations: RAG evolution

- **Naïve RAG**: keyword-based retrieval (BM25/TF-IDF) + simple generation; limited semantic understanding and scalability.  [oai_citation:17‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  
- **Advanced RAG**: dense retrieval (DPR etc.), contextual re-ranking, iterative multi-hop retrieval; better semantics but more compute.  [oai_citation:18‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  
- **Modular RAG**: decomposes pipeline into swappable components; supports hybrid sparse+dense retrieval, tool/API integration, and domain-specific pipelines (e.g. financial analytics).  [oai_citation:19‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  
- **Graph RAG**: uses knowledge graphs for multi-hop reasoning, relational structure, and context enrichment; strong on structured domains but more complex and less scalable.  [oai_citation:20‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  
- **Agentic RAG**: introduces autonomous agents that perform: query evaluation, routing, iterative retrieval, refinement, and workflow optimization (single or multi-agent).  [oai_citation:21‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  

#### B. Agentic intelligence & workflow patterns

- Defines **components of an AI agent**: LLM (role+task), memory (short/long-term), planning, tools (vector search, web, APIs).  [oai_citation:22‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  
- **Agentic patterns:**
  - *Reflection*: self-critique and refinement loops (Self-Refine, Reflexion, CRITIC).  
  - *Planning*: task decomposition, multi-step plans for complex tasks.  
  - *Tool Use*: function-calling, external system access.  
  - *Multi-Agent*: specialization and collaboration among agents.  [oai_citation:23‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  
- **Workflow patterns**:
  - Prompt chaining, routing, parallelization (sectioning & voting), orchestrator-workers, evaluator-optimizer.  [oai_citation:24‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  
- These patterns are shown as **building blocks** for Agentic RAG systems.

#### C. Taxonomy of Agentic RAG systems

They classify architectures into several patterns, each with a conceptual workflow and example use case:  [oai_citation:25‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  

1. **Single-agent router RAG**  
   - One central agent routes queries to tools/data sources (SQL, semantic search, web, recommender), then synthesizes via LLM.  
   - Pros: simple, efficient; good for limited tools.  
   - Cons: less scalable/expressive for very complex scenarios.  

2. **Multi-agent RAG**  
   - Coordinator agent dispatches to specialized retrieval agents (SQL, semantic search, web, recommender).  
   - Retrieval occurs in parallel; LLM integrates results.  
   - Pros: modularity, scalability, domain specialization.  
   - Cons: coordination complexity, higher compute overhead.  

3. **Hierarchical agentic RAG**  
   - Multi-tier agents: top-level agent does strategic planning & prioritization; mid/lower agents perform retrieval; results are aggregated and synthesized.  
   - Pros: strategic control and prioritization; good for complex domains (e.g. finance).  
   - Cons: orchestration overhead, resource allocation complexity.  

4. **Corrective RAG (CRAG)**  
   - Pipeline of agents: context retrieval → relevance evaluation → query refinement → external knowledge retrieval → response synthesis.  
   - Focus on **iterative correction** of retrieval results and reducing hallucinations via relevance checks and query rewriting.  [oai_citation:26‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  

5. **Adaptive RAG**  
   - Classifier (often a small LLM) predicts query complexity and chooses strategy:  
     - bypass retrieval,  
     - single-step retrieval,  
     - multi-step iterative retrieval.  
   - Objective: avoid over-retrieval for simple queries and apply multi-hop reasoning only when needed.  [oai_citation:27‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  

6. **Graph-based agentic RAG (Agent-G, GeAR)**  
   - Agent-G: retriever bank (graph + text), critic module, feedback loops for graph+text fusion.  
   - GeAR: graph expansion on top of base retrievers, using an agent framework to manage multi-hop graph retrieval.  [oai_citation:28‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  

7. **Agentic Document Workflows (ADW)**  
   - LlamaIndex-style: agents orchestrate document parsing, stateful knowledge retrieval, reasoning, and structured outputs for document-heavy workflows (invoices, contracts, etc.).  [oai_citation:29‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  

#### D. Comparative analysis, applications, tools, benchmarks

- **Comparative table**: contrasts traditional RAG, Agentic RAG, and ADW on focus, context maintenance, dynamic adaptability, orchestration, tool use, scalability, reasoning capacity, and primary applications.  [oai_citation:30‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  
- **Applications**:
  - Customer support, healthcare, legal, finance, education, multimodal marketing/creative workflows—each illustrated with a short scenario.  [oai_citation:31‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  
- **Tools & frameworks**:
  - LangChain/LangGraph, LlamaIndex/ADW, HF + Qdrant, CrewAI, AG2/AutoGen, OpenAI Swarm, Vertex AI, Semantic Kernel, IBM Watson, Bedrock, Neo4j + vector DBs.  [oai_citation:32‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  
- **Benchmarks & datasets**:
  - Broad catalog of QA, reasoning, dialog, summarization, robustness & RAG-specific toolkits (BEIR, MS MARCO, HotpotQA, Hotpot-like multi-hop sets, RAGBench, BERGEN, FlashRAG, GNN-RAG, GNN-based QA, etc.).  [oai_citation:33‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  

### 2.3 Key learnings

- **Agentic RAG = RAG + agent patterns + workflow orchestration**, not a single algorithm.
- Architectural choices (single vs multi vs hierarchical agents, corrective vs adaptive vs graph-based, document workflows) give different trade-offs between:
  - flexibility,
  - reasoning depth,
  - coordination complexity & computational overhead.  [oai_citation:34‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  
- **Graph and document-centric systems** (Agent-G, GeAR, ADW) show how **structure + agents** can outperform naive pipelines in complex reasoning domains (healthcare, legal, finance).  
- Current evaluation & benchmarking ecosystems are rich for RAG in general, but **not tailored to agentic behaviors** (no standard metric for number of tool calls, loop depth, or coordination overhead).  [oai_citation:35‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  

### 2.4 Constraints & limitations

- No unified evaluation methodology for Agentic RAG:
  - No standard way to measure cost of agent loops, routing, or tool use.  
  - No energy/efficiency metrics at all.  [oai_citation:36‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  
- Heavy reliance on vendor demos and blog posts (Twitch on Bedrock, LlamaCloud demos, etc.) rather than peer-reviewed experiments.  [oai_citation:37‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  
- Many architectural patterns are **described conceptually** without enough low-level detail to implement them directly (e.g., scheduler policies, state representation, error handling).  

### 2.5 Implications

- The survey **legitimizes Agentic RAG** as a distinct research direction with:
  - clear pattern vocabulary (reflection, planning, tool use, multi-agent, workflow graphs),  
  - clear architectural families to compare.  
- It also implicitly defines a **research gap**:
  - Standardized metrics for agentic workflows (tool calls, routing, depth, overhead).  
  - Resource-aware evaluation (latency vs throughput vs energy vs quality).  
  - Benchmarks that emphasize long-horizon, multi-step, multi-agent tasks with cost constraints.

All of that is exactly the space your thesis is about.

---

## 3) Top 5 references in the paper (within its own logic)

1. **[20] Gao et al., “Retrieval-Augmented Generation for Large Language Models: A Survey”, 2024.**  
   - Core RAG taxonomy (Naïve, Advanced, Modular, Graph).  
   - Underpins their evolution narrative of RAG paradigms.  [oai_citation:38‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  

2. **[16] Peng et al., “Graph Retrieval-Augmented Generation: A Survey”, 2024.**  
   - Basis for the Graph RAG section and comparison.  
   - Clarifies when graph-based retrieval helps RAG (structured domains, multi-hop reasoning).  [oai_citation:39‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  

3. **[8] Lee et al., “Agent-G: An Agentic Framework for Graph Retrieval-Augmented Generation”, 2024.**  
   - Flagship example of graph-based Agentic RAG (retriever bank, critic module, feedback loops).  [oai_citation:40‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  

4. **[31] Yan et al., “Corrective Retrieval Augmented Generation (CRAG)”, 2024.**  
   - Defines Corrective RAG with an explicit agent pipeline for relevance checking and query refinement.  
   - Serves as the canonical “agentic corrective” pattern.  [oai_citation:41‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  

5. **[33] Jeong et al., “Adaptive-RAG: Learning to Adapt Retrieval-Augmented LLMs through Question Complexity”, 2024.**  
   - Key example of **difficulty-aware routing**: classifier-driven strategy selection (no retrieval / single-step / multi-step).  
   - Represents the adaptive/difficulty-aware branch of Agentic RAG.  [oai_citation:42‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  

(GeAR [35] and LlamaIndex ADW [36] are also very central, but you asked for five.)

---

## 4) Top 5 references relevant to your “sustainable agentic RAG” thesis

Here I’m optimizing for **relevance to efficiency, adaptivity, and agentic orchestration**, not just general RAG.

1. **Adaptive-RAG – [33] Jeong et al.**  
   - *Why relevant*: Explicitly optimizes **resource use vs query complexity** by learning when to skip or simplify retrieval, which is conceptually very close to your “difficulty-aware orchestration” and “don’t over-use the GPU/CPU for easy queries.”  
   - You can reinterpret their classifier as a candidate **“energy-aware router”**.

2. **Corrective RAG – [31] / LangGraph CRAG tutorial [32]**  
   - *Why relevant*:  
     - Shows an explicit multi-agent pipeline for *only* doing extra work when relevance is low (re-query, external search).  
     - Ideal to study **how extra agent steps trade off accuracy vs cost**, and how to avoid unnecessary correction for “easy” queries.

3. **Agent-G – [8] Lee et al.**  
   - *Why relevant*:  
     - Demonstrates a **critic module** and **retriever bank** as explicit agents.  
     - Good candidate for *component-level* cost analysis: you can measure cost of graph retrieval vs text retrieval vs critic passes and express it in J/query or J/token.

4. **GeAR – [35] Shen et al.**  
   - *Why relevant*:  
     - Focused on **multi-hop retrieval** with graph expansion and an agent framework.  
     - Multi-hop RAG is typically expensive; this is a great testbed for asking “what is the marginal benefit vs marginal hardware cost of more hops?”

5. **Agentic Document Workflows (ADW) – [36] LlamaIndex blog**  
   - *Why relevant*:  
     - State-full, long-horizon workflows; they chain many steps (parsing, retrieval, domain logic).  
     - Ideal to measure **energy/latency accumulation** over long document workflows and evaluate which steps can be pruned, cached, or simplified by agents.

Honorable mentions for evaluation infra:

- **RAGBench [61]**, **BERGEN [62]**, **FlashRAG [63]** – they give you **evaluation scaffolding** (datasets, metrics) that you can extend with your own hardware/energy metrics.

---

## 5) Where this paper helps your thesis (“sustainable agentic RAG”)

### 5.1 Conceptual & vocabulary alignment

- Gives you a **clean vocabulary** to describe your system:
  - You are essentially building a **Modular RAG + Agentic RAG** hybrid with:
    - single vs multi-agent routing over tools (Milvus, BGE-M3, vLLM, LightRAG/graph),  
    - workflow patterns like routing, orchestrator-worker, evaluator-optimizer. 
- You can frame your thesis as:
  > “We extend Agentic RAG by introducing *hardware- and energy-aware orchestration* for these established workflow patterns.”

### 5.2 Architectural baselines for your agentic designs

- The taxonomy (single-agent router, multi-agent, hierarchical, corrective, adaptive, graph-based, ADW) gives you **reference architectures** you can:
  - copy as **baselines** (e.g., single-agent router RAG over your LightRAG stack),  
  - or extend with **energy-aware routing policies** (e.g., Adaptive-RAG-like classifier that chooses between small vs large model, or graph vs non-graph path).  [oai_citation:44‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  

### 5.3 Identifying *where* agentic orchestration costs energy

The survey surfaces all the **agentic “cost centers”** you should instrument:

- Reflection loops → more LLM calls, more tokens.  
- Planning → extra chain-of-thought tokens + control messages.  
- Tool use → (often) extra retrievals and external APIs.  
- Multi-agent collaboration and hierarchies → more inter-agent messages, more passes through the LLM, more retrieval calls.  [oai_citation:45‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  

This directly aligns with your metrics plan:

- You can now say:  
  > “We profile J/answer and P95 latency at the level of each agent step (reflection iteration, tool call, retrieval, planner call), using the taxonomies in this survey.”

### 5.4 Pinpointing missing dimensions → your contribution

The paper explicitly/implicitly lacks:

- any notion of **J/token**, **J/answer**, or hardware efficiency;  
- any explicit metrics for **#tool_calls, loop depth, agentic overhead**;  
- any standardized evaluation for trade-offs like:
  - “How many extra hops / agents are worth it for X% quality gain?”  [oai_citation:46‡2501_agentic-rag-survey.pdf](sediment://file_00000000a6a471fa9cf3f75404488c46)  

That gives you a very clean thesis angle:

> “Building on the architecture and pattern taxonomy of Singh et al. (2025), we introduce a **metric-driven framework** for evaluating Agentic RAG in terms of **latency, throughput, VRAM health, and energy (J/answer, J/token)**, and demonstrate how simple agentic policies (adaptive routing, corrective retrieval, graph vs non-graph paths) can be tuned to maximize **quality-per-Joule**.”

### 5.5 Concrete ways to use this survey in your thesis

- **Chapter 2 (Background):**  
  - Use their RAG evolution and agentic patterns sections almost directly as your conceptual background (with proper citations).  
- **Chapter 3 (Problem Statement):**  
  - Quote their challenges: context integration, multi-step reasoning, scalability/latency, coordination complexity in multi-agent systems, and lack of specialized benchmarks. Then argue:  
    - “We address the missing dimension: *resource & energy efficiency* of these agentic designs.” 
- **Chapter 4 (Methodology):**  
  - Map your concrete architecture (vLLM + BGE-M3 + Milvus + LightRAG) onto their taxonomy (e.g. single-agent router vs multi-agent vs hierarchical).  
  - Explicitly define **metrics per pattern** (single-agent, corrective, adaptive, graph-based, ADW-like) using the metric set we finalized (e2e_p95_ms, TTFT, tok_s_decode, QPS, J/token, VRAM headroom, cache hit rates, etc.).  

In short: this paper doesn’t solve your problem, but it gives you **the official map & language** of Agentic RAG.  
You can now position your thesis as:

> “Agentic RAG, but with *hardware- and energy-aware orchestration* grounded in explicit, measurable metrics.”
