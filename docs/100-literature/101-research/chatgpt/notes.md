# use cases fusion 
An agentic workflow uses dynamic decision-making (routing, classification, conditional execution) to optimize the RAG pipeline. This orchestration allows the system to selectively invoke resource-heavy components only when necessary, resulting in significant reductions in computational energy (Joules per turn) and resource size (VRAM and CPU utilization).

Here are 6 use cases for implementing agentic workflows to reduce energy and resource size, based on the provided sources:

| #     | Agentic Use Case (The Action)                         | RAG Pipeline Location                  | Improvement Mechanism (Energy/Size Reduction)                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----- | ----------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Dynamic Model Routing** (Small → Big Fallback)      | Flask API Layer (Before LLM Call)      | An agent (router or classifier) identifies simple queries and routes them to a **smaller, cheaper, and more efficient local model** (e.g., R-4B). <br><br>Only complex queries are escalated to a larger, external, or more powerful model (e.g., GPT-4). This cuts **average compute cost by 30–62%** and reduces the average **Energy per Turn (J/turn)**, since smaller models use fewer GPU joules.                                                                                                           |
| **2** | **Conditional Retrieval/Tool Selection**              | Flask Pipeline (Request Preprocessing) | The agent uses a classifier (e.g., T5-Large) to predict query complexity. If a query is determined to be trivial or self-contained, the agent **skips the expensive vector retrieval step** (Milvus call). Skipping retrieval cuts down retrieval latency, reduces the number of context tokens sent to the LLM (decreasing VRAM and generation energy/time), and uses simpler pipeline steps.                                                                                                                    |
| **3** | **Dynamic Context Budgeting**                         | Flask (Prompt Assembly for LLM)        | The agent applies a policy to **limit the context length** fed to the LLM. For instance, after retrieval, the agent might truncate extra passages or compress the context if the initial retrieved chunks exceed a set token budget (N tokens). **Fewer tokens** sent to the LLM translate directly to **lower compute per turn (J/turn)**, reduces the VRAM peak (by limiting the KV cache size), and ensures **faster, more predictable P95 latency**.                                                          |
| **4** | **Conditional Advanced RAG Features** (HyDE/Reranker) | Context Processing Layer               | The agent determines whether resource-intensive, quality-boosting steps, such as **HyDE generation** (which requires an extra LLM call) or **Cross-Encoder Reranking** (which uses a separate GPU-heavy model), are necessary. If the initial retrieval confidence is high, the agent **disables these unneeded stages**. This avoids the VRAM overhead of loading an extra model (reranker) or the compute overhead of an unnecessary LLM generation (HyDE).                                                     |
| **5** | **On-Demand Graph Augmentation**                      | Retrieval Layer (Milvus Integration)   | The agent routes highly complex or multi-hop queries to a **Graph-assisted retrieval mode** (like LightRAG). This reserves the overhead of graph construction, maintenance, and traversal for only the small fraction of queries (e.g., 10%) where it provides quality benefit. By keeping the majority of queries on the standard, faster vector-only path, the system minimizes the average latency and the extra indexing complexity/storage required by the graph index.                                      |
| **6** | **Memory-Constrained Big Model Fallback**             | LLM Serving Layer (GPU Management)     | For the hardest queries that require a large model (e.g., 13B), the agent orchestrates the **on-demand loading** of that model (highly quantized, e.g., 4-bit) into the 16GB VRAM only when the query is flagged. This strategy ensures the majority of operations use the resident 4B model, keeping **VRAM usage low normally**. While loading incurs a 1–2 second initial delay, this avoids the massive VRAM footprint required to keep a 13B or larger model permanently resident, optimizing resource size. |
# all-in-one 
## intro

1) the use of intelligent **agents** in LLM-based systems
2) **hardware and computational optimizations** for efficiency (from GPUs to edge devices)
3) best practices in **RAG + LLM system design**

goal is to balance _capability_ with _efficiency_ – a challenge often highlighted as part of the _“sustainable AI trilemma”_

## agents in LLM-based systems

**LLM-based agents** = breaking complex problems into sub-tasks

Best practices : 
- **Agent Architectures**
  _supervisor-as-tools_ architecture uses one main LLM agent assisted by specialized sub-agents for tasks like retrieval or summarization
  e.g. planners that call search or database queries) to reduce the load on the main model

- **Agentic Best Practices**
  Recent design patterns for LLM agents include
	  - **Reflection Mode** (involves the agent iteratively critiquing and refining its outputs, which can incorporate retrieval in a feedback loop)
	  - Tool Use Mode
	  - Planning Mode
	  - Multi-agent collaboration
	  - Self-Reflective RAG : dynamically decides when to retrieve more information

- **Efficiency**
  Research has found that **LLM-based agents amplify inference energy usage**, yet historically most works optimized only for task performance, not efficiency.
  **spawning many agents in parallel could tax memory/GPUs, and a central “brain” agent might become a bottleneck**
  → limit the number of expensive LLM calls, use simpler heuristic agents for some checks, or batch agent calls

- Trade-of : performance-sustainability
  **(!!!)** having an agent use an LLM for every little sub-task may only slightly improve accuracy while consuming far more energy  (1). today’s memory-augmented LLM agents are **highly energy-inefficient**


## Hardware and Energy Optimization Techniques in RAG
### Production-Grade Efficient methods
- **Quantization (AWQ)** (main LLM model)
  reduce weights/activations precision
	- AWQ, GPTQ
	- VRAM ↓↑, Latency ↓, Energy /token ↓
	- minimal Accuracy loss
	- verify output quality on a validation set

- **Paged Attention** (vLLM)
  Memory-Efficient KV
  vLLM (applies it already)

- **FlashAttention 2 Kernel** (main LLM model)
  -> Faster attention computation but requires high GPU but less runtime per token

- **Continuous Batching** (vLLM)
  allows dynamically adding new requests to a batch while older ones are still being processed.
	- **maximizing GPU utilization** and **minimizing latency per token**
	- only useful for multiple users

- **Prefill/Decode Split** (vLLM)

- **CPU/GPU Affinity & NUMA** (System)
  where your processes and memory physically _sit_ in the hardware topology matters a lot.

-  **Int8 Embedding Model** (Quantized BGE-M3)

- **Hybrid Index Tuning** (Milvus)

- **Disable Unneeded Stages**
  






--- 
# standing papers 

##  1. [ADDRESSING THE SUSTAINABLE AI TRILEMMA: A CASE STUDY ON LLM AGENTS AND RAG](/Users/rvieira/Documents/Master/thesis/0-docs/implementation/100-literature/101-research/papers/2501_casestu-rag-agents.pdf)

### source
University of Exeter Exeter, UK
### date
January 2025
### keywords


### abstract 
papers rarely measure the energy/latency overhead of agent-based pipelines except here where they urge for agent designs consider **energy and equity** alongside capability

### key learnings 
- having an agent use an LLM for every little sub-task may only slightly improve accuracy while consuming far more energy 
- today’s memory-augmented LLM agents are **highly energy-inefficient**, especially on low-resource hardware, and need new design optimizations
- Identifying how an agent can intelligently _reduce_ work (e.g. deciding to use a smaller model or no LLM at times) is largely missing in literature and represents an open direction.

#