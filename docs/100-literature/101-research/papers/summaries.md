
# Survey on Evaluation of LLM-based Agents
- March 2025
- 1. The Hebrew University of Jerusalem 2. IBM Research 3. Yale University
  {Asaf.Yehudai, Guy.Uziel1}@ibm.com
  {lilache, roybar, shmueli}@il.ibm.com
  {haoxin.li, yilun.zhao, arman.cohan}@yale.edu

## 1 Technical summary

- **Scope & goal.** 
	- how to _evaluate_ LLM-based agents (not just single-call LLMs). 
	
	- organizes the field into four pillars: 
	
		- (i) core agentic capabilities (planning/multi-step reasoning, tool use/function calling, self-reflection, memory)
		- (ii) application-specific agents (web, SWE, scientific, conversational)
		- (iii) generalist-agent benchmarks
		- (iv) developer-facing evaluation frameworks.
	
	  Evaluations are shifting toward more realistic, dynamic, continuously updated settings,
	  
	  Gaps in **cost/efficiency**, **safety/robustness**, and **fine-grained/trajectory-level** metrics.

- **Core aspects.**
    - **_Planning & multi-step reasoning._**
      Benchmarks span math/logic/multi-hop QA and newer planners (PlanBench, FlowBench, Natural Plan, etc.)
      with findings that LLM agents handle short-horizon tactics better than long-horizon strategy and benefit from explicit state tracking, self-correction, and meta-planning. 
    
    - **_Function calling / tool use._** 
      Early, synthetic one-step tests evolved into multi-turn, stateful, on-policy evaluations (e.g., ToolSandbox, ComplexFuncBench, NESTFUL), with emphasis on implicit parameter inference, sequencing, and continuous state management. 
    
    - **_Self-reflection._**
      From coarse “did final answer improve?” setups to dedicated benchmarks (LLF-Bench, LLM-Evolve, Reflection-Bench) 
      that measure belief updates, counterfactuals, and meta-reflection.     
    
    - **_Memory._** 
      Differentiates short- vs long-term memory; 
      evaluates long-context reading and episodic/stream settings (ReadAgent, MemGPT, A-MEM, StreamBench), showing that memory systems can match/exceed large context windows in interleaved tasks.     

- **Application-specific evaluations.**
    - _Web agents:_
      from MiniWoB → dynamic, visually rich, online environments (WebArena, VisualWebArena, WorkArena++), with emerging node-completion/step metrics.
    
    - _SWE agents:
      _from HumanEval → SWE-bench family (Verified, Lite, +, Multimodal) for end-to-end bug-fixing in real repos.
    
    - _Scientific agents:_
      ideation → experiment design → executable code → peer-review, plus unified gym-like platforms (e.g., MLGym, DiscoveryWorld).
    
    - _Conversational agents:_
      task/DB/policy-driven multi-turn tests (ABCD, τ-Bench, IntellAgent).
      (Section mapping across §3; summary—no single metric suffices; combine success, efficiency, and safety/policy adherence.)

- **Generalist agents.** Benchmarks like GAIA, AgentBench, OSWorld, AppWorld, TheAgentCompany test multi-tool, multi-app workflows and enterprise tasks; meta-leaderboards aim to consolidate evaluation. (Survey §4 overview.)

- **Frameworks for evaluation.** LangSmith, Langfuse, Vertex AI, Mosaic AI, Patronus, Galileo, etc. support: LLM-judge final-output scoring, **stepwise** tool/argument checks, **trajectory** comparison, human-in-the-loop datasets, and A/Bs; gaps remain in general-purpose reliable judges and trajectory-level large-scale insights. (Table/§5 summary.)

- **Trends & gaps.**
    
    - _Live/continuously updated_ benchmarks to avoid saturation (e.g., BFCL v2/v3; SWE-bench variants).   
    
    - Push toward _granular_ (step/milestone) metrics beyond end-to-end success. 
    
    - Make _cost/efficiency_ first-class (tokens, API $, latency, resource use). 
    
    - _Scaling & automation_ via synthetic data and Agent-as-a-Judge. 
    
    - _Safety & compliance_ (adversarial robustness, policy conformance) under-served; needs multi-dimensional tests. 
    
    - The conclusion reiterates: progress on realism/dynamics, but **safety**, **fine-grained eval**, **cost-efficiency** remain open priorities. 

## 2) How this benefits your thesis (energy/hardware-minimizing RAG+LLM with agents)
Below is a concrete adoption plan you can wire into your CITI-KMS stack (R-4B via vLLM, BGE-M3, Milvus; optional LightRAG), aligned with the survey’s gaps and guidance.

### A. Make cost/efficiency a first-class metric (bind to your telemetry).
Track and report—per _turn_ and _trajectory step_—the metrics you already care about (TTFT, P95 E2E, decode tok/s, VRAM peak, J/token, CPU/GPU util). Treat these as required acceptance criteria alongside answer quality. This directly answers the survey’s call to standardize _cost/efficiency_ metrics, not just accuracy. 

### B. Move from end-to-end to stepwise/trajectory evaluation.
Instrument each agent action (retrieve, HyDE, rerank, generate, post-filter, provenance) with “action-advances-goal?” labels and per-step energy/latency deltas. Use LLM-judge or rules to score plan coherence, correct tool selection, and parameterization. This follows the survey’s push for **granular** and **trajectory-based** assessment to diagnose inefficiencies (e.g., wasteful HyDE expansions, unnecessary reranking). 

### C. Adopt “live” benchmarks & continual evaluation.
Create a rolling “live RAG suite” from your production queries (sanitized), regularly refreshed to avoid overfitting and to reflect drift in content and traffic patterns—analogous to BFCL/SWE-bench evolution.   

### D. Evaluate memory strategies explicitly.
Since your stack experiments with LightRAG/graph memory and hybrid retrieval, add tests that toggle: (i) no memory, (ii) episodic (conversation-aware), (iii) long-term doc memory. Compare quality & **J/token** across long, interleaved tasks (multi-topic chats, chained queries). The survey shows memory systems can rival large context windows—use that to justify _smaller context_ + _memory_ to cut VRAM/latency.   

### E. Tool-use benchmarks tailored to RAG.
Port ideas from stateful tool-use (implicit params, nested calls) to your pipeline: require the agent to (a) choose HyDE vs no-HyDE, (b) set top-k/top-p for hybrid search, (c) decide if reranking is needed. Score _correct tool choice_ and _parameterization_ vs energy/time budgets. 

### F. Safety & compliance as resource savers.
Add policy checks (source attribution required? PII filters?) early in the trajectory to prevent wasted compute on responses you’d discard—aligns with the survey’s call to integrate safety/compliance into evaluation. 

### G. Automate evaluation at scale.
Use synthetic query generation and **Agent-as-a-Judge** to continuously populate your eval sets and reduce human labeling, especially for trajectory-level critiques of retrieval chains and tool choices. 

### H. Minimal A/Bs you can run immediately (energy-aware)

- HyDE on/off × (k_dense,k_sparse) grid → quality vs **J/turn**, P95.

- Reranker none vs cross-encoder (lightweight) with confidence threshold.

- Memory: no-memory vs episodic vs LightRAG graph recall.

- Quantization: baseline FP16 vs AWQ/4-bit for R-4B; measure VRAM headroom, TTFT, **J/token**. All measured with stepwise & trajectory metrics as above.)

### I. Reporting template (weekly).
One table per variant with: _Pass@final_, Hallucination@final, TTFT, P95 E2E, tok/s, GPU VRAM peak, **J/turn**, **J/token**, CPU%, GPU%. A second table with **per-step** averages (retrieve, rerank, generate) to localize cost spikes—exactly the fine-grained diagnosis the survey advocates.