# Comprehensive Efficiency Analysis Framework for CITI KMS

## 1. Key Performance Metrics to Track

### A. Computational Resource Metrics

**CPU Metrics:**  
- CPU utilization percentage (per service)  
- CPU time per request/operation  
- CPU cores usage distribution  
- Process-level CPU consumption  

**Memory Metrics:**  
- RAM usage (absolute MB/GB)  
- Memory allocation rate  
- Peak memory consumption  
- Memory leaks detection (growth over time)  
- Cache hit/miss ratios  

**GPU Metrics (if applicable for embeddings/LLM):**  
- GPU utilization %  
- VRAM usage  
- GPU memory bandwidth  
- Inference throughput (tokens/sec)  

**Storage I/O:**  
- Disk read/write operations per second (IOPS)  
- Disk throughput (MB/s)  
- Storage latency  
- SFTP transfer speeds  
- Database query I/O  

**Network Metrics:**  
- Network bandwidth usage (upload/download)  
- Request/response payload sizes  
- Connection pool utilization  
- API call latency  

### B. Pipeline Performance Metrics

**Latency Metrics:**  
- End-to-end response time  
- Per-component latency breakdown  
- Time-to-first-token (TTFT) for streaming  
- P50, P95, P99 latency percentiles  

**Throughput Metrics:**  
- Requests per second (RPS)  
- Documents processed per minute  
- Queries handled concurrently  
- Embedding generation rate (chunks/sec)  

**Quality vs. Cost Trade-offs:**  
- RAG evaluation scores (RAGAS metrics) vs. computational cost  
- Retrieval accuracy vs. search time  
- Answer quality vs. inference time  

---

## 2. Pipeline Measurement Points

### Document Ingestion Pipeline
User Upload → SFTP Transfer → Document Parsing → Chunking → Embedding → Vector DB Insert  
Measurement Points:
- **Upload Transfer:** Network I/O, transfer time, file size  
- **SFTP Storage Operations:** Disk I/O, write latency  
- **Document Parsing:** CPU usage, parsing time per page, memory consumption  
- **Text Chunking:** CPU time, memory allocation, chunk generation overhead  
- **Embedding Generation:** GPU/CPU usage, inference time, batch size efficiency  
- **Vector DB Insertion:** Insert throughput, index building time, memory usage  

### Query/RAG Pipeline
User Query → Query Embedding → HyDE (optional) → Vector Search → Reranking (optional) → LLM Generation → Response Stream  
Measurement Points:
- **Query Reception:** Request queue length, concurrent connections  
- **Query Embedding:** Embedding API latency, CPU/GPU usage  
- **HyDE Expansion:** LLM inference time, tokens generated  
- **Vector Search:** Search latency, CPU/memory for index traversal  
- **Reranking:** Model inference time, precision improvement vs. latency cost  
- **LLM Generation:** TTFT, tokens/sec, total inference time  
- **Response Streaming:** Network throughput, SSE overhead  

---

## 3. Analysis Methodology

### Phase 1: Baseline Profiling
- Add instrumentation & monitoring (timing decorators, Prometheus, logs)  
- Create test datasets (small, medium, large docs)  
- Simulate realistic query patterns  
- Collect resource usage and latency data  

### Phase 2: Bottleneck Identification
- Create resource consumption matrix (CPU, memory, GPU, time, throughput)  
- Perform critical path analysis (T_embed, T_search, T_llm)  
- Test performance under scaling (documents, users, complexity)  

### Phase 3: Controlled Experiments
- **Batch Size Optimization:** Throughput vs. memory tradeoff  
- **Search Parameters:** Impact of `top_k` on latency and quality  
- **Chunking Strategy:** Granularity vs. embedding cost  
- **HyDE/Reranking ROI:** Cost vs. quality gain  
- **Parser Comparison:** Speed vs. extraction quality  
- **LLM Context Length:** Memory and latency vs. answer quality  

---

## 4. Expected Bottlenecks & Optimization Strategies

### 🔴 Critical Bottlenecks (Highest Impact)

#### **1. LLM Inference Time**
- **Impact:** 50-70% of total latency
- **Resource:** GPU/CPU, memory
- **Current Config:** gpt-4-turbo, max_tokens=4096, temperature=0.01

**Optimization Strategies:**

- ✅ **Model Quantization:** Use INT8/INT4 quantized models (2-4x speedup, minimal quality loss)
- ✅ **Smaller Models:** Test Llama 3 8B → Llama 3.2 3B/1B (3-5x faster, evaluate quality trade-off)
- ✅ **Speculative Decoding:** Draft tokens with small model, verify with large model
- ✅ **KV Cache Optimization:** Reuse key-value cache for multi-turn conversations
- ✅ **Batch Inference:** Process multiple queries together (if latency allows)
- ✅ **Reduce Max Tokens:** Analyze actual response lengths, reduce if possible
- ✅ **Early Stopping:** Implement dynamic stopping based on answer completeness

#### **2. Embedding Generation**

- **Impact:** 15-25% of document processing time, 5-10% of query time
- **Resource:** GPU/CPU, API latency
- **Current Config:** 1024-dim dense + sparse, external API

**Optimization Strategies:**

- ✅ **Local Embedding Models:** Deploy embedding model locally to eliminate network latency
- ✅ **Smaller Embeddings:** Test 768-dim or 384-dim models (faster, less storage)
- ✅ **Batch Optimization:** Increase batch size (current: 32) up to GPU memory limits
- ✅ **Caching:** Cache embeddings for frequently accessed queries
- ✅ **Async Processing:** Process document embeddings asynchronously
- ✅ **GPU Acceleration:** Ensure embeddings use GPU if available

#### **3. Vector Search (Hybrid)**

- **Impact:** 10-20% of query latency
- **Resource:** CPU, memory
- **Current Config:** Hybrid search (dense + sparse), top_k=60

**Optimization Strategies:**

- ✅ **Index Optimization:** Use HNSW or IVF_FLAT instead of FLAT for large collections
- ✅ **Reduce top_k:** Experiment with lower values (20-40 may be sufficient)
- ✅ **Single Search Mode:** Test if hybrid is necessary, or if dense-only is sufficient
- ✅ **Collection Partitioning:** Partition by user/topic for faster searches
- ✅ **Query Result Caching:** Cache search results for popular queries
- ✅ **Load Balancing:** Distribute searches across Milvus replicas
### 🟡 Moderate Bottlenecks

#### **4. Document Parsing**
- **Impact:** Variable (10-40% of ingestion time, depending on parser)
- **Resource:** CPU, memory
- **Current Config:** Supports PyMuPDF, Docling, MinerU

**Optimization Strategies:**
- ✅ **Parser Selection:** Use PyMuPDF for simple PDFs (fastest), Docling/MinerU only for complex layouts
- ✅ **Parallel Processing:** Process pages in parallel
- ✅ **Pre-processing Pipeline:** Extract text once, reuse for multiple purposes
- ✅ **OCR Optimization:** Use faster OCR models (e.g., Tesseract → EasyOCR → PaddleOCR comparison)

#### **5. Reranking (Optional)**
- **Impact:** 5-15% of query latency (when enabled)
- **Resource:** GPU/CPU

**Optimization Strategies:**

- ✅ **Conditional Reranking:** Only rerank when confidence is low
- ✅ **Lightweight Models:** Use smaller reranking models (e.g., MiniLM)
- ✅ **Reduce Candidates:** Rerank only top-20 instead of top-60

#### **6. HyDE (Optional)**

- **Impact:** 10-30% additional latency (when enabled)
- **Resource:** GPU/CPU, LLM API

**Optimization Strategies:**
- ✅ **Selective HyDE:** Only use for ambiguous/complex queries
- ✅ **Cache Expansions:** Cache HyDE outputs for similar queries
- ✅ **Smaller Model:** Use dedicated small model for HyDE
### 🟢 Minor Bottlenecks

#### **7. SFTP File Transfer**

- **Impact:** <5% for most files, higher for very large files (>100MB)
- **Resource:** Network, disk I/O

**Optimization Strategies:**

- ✅ **Compression:** Enable compression during transfer
- ✅ **Parallel Uploads:** Allow multiple concurrent uploads
- ✅ **Local Caching:** Cache frequently accessed files

#### **8. Database Operations (PostgreSQL)**

- **Impact:** <5% typically
- **Resource:** CPU, disk I/O

**Optimization Strategies:**

- ✅ **Connection Pooling:** Ensure proper connection pool configuration
- ✅ **Query Optimization:** Index frequently queried fields
- ✅ **Batch Operations:** Batch inserts/updates where possible
---

## 5. Monitoring Dashboard Setup

**Stack:** Prometheus + Grafana, OpenTelemetry, ELK Stack  

**Dashboards:**  
- Real-time resource usage  
- Pipeline latency and throughput  
- Cost vs. quality  
- Alert system (high latency, CPU, memory, error rate)  

---

## 6. Implementation Roadmap (not applicable)

- **Week 1-2:** Instrumentation  
- **Week 3-4:** Baseline Measurements  
- **Week 5-6:** Run Experiments  
- **Week 7-8:** Optimize + Deploy + Validate  

---

## 7. Expected Impact

| Optimization                | Latency ↓ | Cost ↓ | Quality Δ |
|----------------------------|-----------|--------|------------|
| Model quantization (INT8)  | 40-60%    | 50-70% | -2 to -5%  |
| Smaller LLM (8B → 3B)      | 60-75%    | 60-80% | -5 to -15% |
| Reduce top_k               | 5-10%     | 2-5%   | -0 to -3%  |
| Local embeddings           | 30-50%    | 40-60% | 0%         |
| Disable HyDE               | 15-25%    | 10-20% | -5 to -10% |
| Index optimization (HNSW)  | 20-40%    | 10-20% | 0%         |
| Chunk size (512→1024)      | 20-30%    | 30-40% | ±5%        |

Goal: 50-70% latency & 40-60% cost reduction while maintaining >90% quality

---

## 8. Key Success Metrics

- Avg. query latency < **2s**  
- P95 latency < **4s**  
- Throughput > **10 QPS**  
- RAGAS scores > **0.8**  
- Cost/query ↓ in $ or resource hours  
- User satisfaction tracking (feedback frontend)

---

## ✅ Recommended First Steps

- Start with **instrumentation** and **baseline profiling**  
- Target **LLM + embedding** stages for max gains  
- Validate improvements with **controlled experiments**  
- Track performance **vs. quality** using dashboards  

---
