To analyze and improve the computational efficiency of your RAG pipeline, you must focus on **latency**, **throughput**, and **resource utilization**. The analysis should be a top-down profiling, starting from the total request time and breaking it down into the duration of each sequential step.

Based on your architecture, your primary bottlenecks will almost certainly be the neural network inference steps (LLM generation, reranking, embedding) and data I/O (vector search and API network calls).

---

### 📊 1. Key Efficiency Metrics

You need to log metrics at both the high level (system-wide) and the granular level (component-specific).

#### High-Level System Metrics

- **End-to-End Query Latency:** The total time from when the user's request hits the `llm-rag-citi` API to when the _last_ token is sent back. This is your master metric for user-perceived speed.
    
- **Time to First Token (TTFT):** For streaming, this is the most important metric for _perceived_ performance. It's the time from request to the _first_ generated token.
    
- **Queries Per Second (QPS) / Throughput:** The total number of requests your `llm-rag-citi` API can successfully process per second. Your `Semaphore(max=2)` is an artificial cap on this, likely to protect a downstream resource.
    
- **Concurrent Users:** The number of simultaneous users the system can handle before latencies degrade unacceptably.
    

#### Granular Component Metrics (The Bottlenecks)

These are the most critical for your analysis. You need to measure the **wall-clock time** for each step:

- **1. Queueing Time:** How long a request waits for the `Semaphore(max=2)`. If this is high, your backend compute is the bottleneck.
    
- **2. Query Expansion Time:** Latency of the `HYDE_LLM` call (if used).
    
- **3. Embedding Time:** Latency of the `EMB_API` call to embed the query.
    
- **4. Vector Search Time:** The time taken for Milvus to perform the hybrid search and return top-K results.
    
- **5. Reranking Time:** The time taken by the `Reranker Model`. This is a **prime suspect** as cross-encoders are computationally expensive.
    
- **6. LLM Generation Time:** This must be broken down:
    
    - **Prompt Processing Time:** Time for the LLM to ingest the prompt (context + query + history). This can be high if the context is large.
        
    - **Generation Time:** The total time spent generating tokens (closely related to TTFT and time-per-token).
        
- **7. Network Latency:** The round-trip time (RTT) for each external API call (Embed, HyDE, LLM). High network latency can be a "hidden" bottleneck that has nothing to do with your own compute.
    

#### Hardware Utilization Metrics

- **CPU Usage (%)**: For the Flask app, text processing (`DOC_PROC`, `CHUNK`), and Milvus (if not GPU-indexed).
    
- **GPU Utilization (%)**: Percent of time the GPU cores are active.
    
- **VRAM (GPU Memory) Usage (GB):** How much memory is used by the embedding, reranker, and LLM models. If this is at 100%, your system will be slow due to swapping.
    
- **System RAM Usage (GB):** For the API, Milvus (it caches indexes in RAM), and holding retrieved contexts.
    

---

### 🔬 2. How to Conduct the Analysis

Your goal is to create a **trace** for a single query, showing exactly where the time is spent.

#### Step 1: Instrument Your Code

You cannot optimize what you don't measure. The `llm-rag-citi` application is the orchestrator, so it's the perfect place to add this instrumentation.

- **Use Distributed Tracing:** This is the most effective method. Integrate a library like **OpenTelemetry** into your Flask app. You can create "spans" for each key step:
    
    1. Start a main span for the `query_routes` request.
        
    2. Create a child span for `wait_for_semaphore`.
        
    3. Create a child span for `call_hyde_llm`.
        
    4. Create a child span for `call_embedding_api`.
        
    5. Create a child span for `milvus_hybrid_search`.
        
    6. Create a child span for `run_reranker`.
        
    7. Create a child span for `call_generation_llm`.
        
- **Send Traces to a Collector:** Use a tool like **Jaeger** or **Grafana Tempo** to visualize these traces. You'll get a waterfall chart for every query, instantly showing which span is the longest.
    
- **If Tracing is too complex:** Use simple logging. Before and after each key step, log the timestamp and the duration.
    

Python

```
# In llm-rag-citi (controller or service)
import time
logger.info(f"[Query {query_id}] Starting query process.")

start_time = time.monotonic()
# ... wait for semaphore ...
logger.info(f"[Query {query_id}] Queue time: {time.monotonic() - start_time:.4f}s")

search_start = time.monotonic()
# ... call Milvus ...
logger.info(f"[Query {query_id}] Vector search time: {time.monotonic() - search_start:.4f}s")

rerank_start = time.monotonic()
# ... call Reranker ...
logger.info(f"[Query {query_id}] Rerank time: {time.monotonic() - rerank_start:.4f}s")
# ... and so on ...
```

#### Step 2: Profile the Resource Hogs

While tracing tells you _where_ the time is, profiling tells you _why_.

1. **Analyze the `llm-rag-citi` App:** Use a Python profiler like **`Py-Spy`** to analyze the Flask application _while it's running_. This will find any CPU-bound bottlenecks in your Python logic (e.g., a slow context formatting routine).
    
2. **Monitor the Hardware:** Use **`nvidia-smi dmon -s pu`** (or `dcgm`) to monitor GPU power, VRAM, and utilization in real-time. Run a load test (e.g., 10 concurrent users) and watch this.
    
    - **If VRAM is at 100%:** Your models are too big or you have too many loaded. This is your bottleneck.
        
    - **If GPU Utilization is at 100%:** You are compute-bound. This is an ideal state, but it _is_ the bottleneck.
        
    - **If GPU Utilization is LOW but latency is HIGH:** Your bottleneck is **I/O**—either waiting for data from Milvus or, more likely, waiting for the _network_ response from the external LLM.
        

#### Step 3: Identify Your Prime Suspects

Run your analysis and then look for these common patterns:

- **Suspect #1: The Reranker.** Your flowchart shows a `Cross-encoder`. These are very accurate but _very_ slow, as they must run `(query, chunk_1)`, `(query, chunk_2)`, ... `(query, chunk_K)` through the model. If your vector search returns K=20 chunks, that's 20 model passes. This is often the #1 local bottleneck.
    
- **Suspect #2: The Generation LLM.** This is the largest model. The `Prompt Processing Time` (ingesting the large context) can be a significant part of the TTFT.
    
- **Suspect #3: The Asynchronous `RAGAS` Evaluation.** This is a **massive, hidden compute hog**. It runs _multiple_ LLM calls in the background _per query_. If your evaluation service (`ragas-local-implementation`) runs on the **same GPU** as your inference endpoints, it is almost certainly _stealing_ resources from user-facing queries. This could be _why_ the `Semaphore(max=2)` is needed.
    
- **Suspect #4: Milvus Hybrid Search.** At scale, complex hybrid search queries can be slow. Use the Milvus monitoring tools (Prometheus/Grafana) to check its query latency. You may need to optimize your Milvus indexes.