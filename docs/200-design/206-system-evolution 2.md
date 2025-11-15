# System Evolution: From Simple Chatbot to Production KMS

**Document Purpose**: Architectural evolution documentation showing how a simple LLM chatbot transforms into a production Knowledge Management System with modern RAG architecture.

**Date**: 2025-11-10
**Phase**: 200 - Design & Architecture

---

## Model Deployment Summary

| Component | Introduced at Layer | Deployment Node | Port | Role in RAG |
|-----------|-------------------|-----------------|------|-------------|
| **LLM (Basic)** | Layer 0 | External API / Local | - | Generation (naive) |
| **Embedding Model** | Layer 2 | Node 3 (BGE-M3) | 1234 | Pre-retrieval: Text → Vector conversion |
| **Vector Store (In-Memory)** | Layer 2 | Mac (Flask process) | - | Retrieval: Store/search vectors (not scalable) |
| **vLLM Server** | Layer 4 | Node 1 (YannQi/R-4B) | 8000 | Generation: High-performance LLM inference |
| **LocalAI Server** | Layer 4 | Node 2 (Gemma3-4b-qat) | 8080 | Alternative LLM, HyDE generation |
| **Milvus Vector DB** | Layer 4 | Node 4 (+ etcd + MinIO) | 19530 | Retrieval: Production vector database |
| **Reranker Model** | Layer 7 | Node 1/2 (optional) | - | Post-retrieval: Rescoring retrieved chunks |
| **PostgreSQL** | Layer 10 | Mac | 5432 | Metadata storage (not ML model) |

### Deployment Architecture

```
┌──────────────────────────────────────────────────────────┐
│ Mac (Orchestration Machine - Development)               │
│ ──────────────────────────────────────                  │
│ • Flask Backend (orchestration)                         │
│ • Next.js Frontend (UI)                                 │
│ • PostgreSQL (metadata only)                            │
│ • Git repository                                        │
│                                                          │
│ Role: Development, coordination, RAG orchestration      │
└───────────────────────┬──────────────────────────────────┘
                        │
                        │ Tailscale VPN Mesh
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ↓               ↓               ↓
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Node 1        │ │ Node 2        │ │ Node 3        │ │ Node 4        │
│ vLLM Server   │ │ LLM Server    │ │ Embedding     │ │ Vector DB     │
│ ───────────── │ │ ───────────── │ │ ───────────── │ │ ───────────── │
│               │ │               │ │               │ │               │
│ Service:      │ │ Service:      │ │ Service:      │ │ Service:      │
│ vLLM          │ │ LocalAI       │ │ BGE-M3        │ │ Milvus        │
│               │ │               │ │               │ │ + etcd        │
│ Model:        │ │ Model:        │ │ Model:        │ │ + MinIO       │
│ YannQi/R-4B   │ │ Gemma3-4b-qat │ │ BAAI/bge-m3   │ │               │
│ (4B params)   │ │ (quantized)   │ │ (hybrid)      │ │               │
│               │ │               │ │               │ │               │
│ Port: 8000    │ │ Port: 8080    │ │ Port: 1234    │ │ Port: 19530   │
│               │ │               │ │               │ │       9091    │
│ GPU: NVIDIA   │ │ GPU: NVIDIA   │ │ GPU: NVIDIA   │ │               │
│ device 0      │ │ device 0      │ │ device 0      │ │               │
│               │ │               │ │               │ │               │
│ Role:         │ │ Role:         │ │ Role:         │ │ Role:         │
│ Primary LLM   │ │ HyDE gen,     │ │ Document &    │ │ Vector        │
│ generation    │ │ alternative   │ │ query         │ │ storage &     │
│               │ │ LLM           │ │ embeddings    │ │ search        │
└───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘

All nodes: SSH/sudo access, Tailscale VPN connected, prototype environment
```

---

## Layer-by-Layer Evolution

### **Layer 0: The Naive Chatbot**

#### What It Is
```
User types question → LLM → Answer
```

#### Components Added
- **LLM (Basic)**: OpenAI API or local model
  - **Role**: Generate answers from general knowledge
  - **Deployment**: External API (OpenAI) or local (Ollama)
  - **Limitations**: No access to custom documents

#### Implementation
```python
from openai import OpenAI

client = OpenAI()
user_question = "What is knowledge management?"
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": user_question}]
)
print(response.choices[0].message.content)
```

#### System View
```
┌──────┐         ┌─────────┐
│ User │ ──────→ │   LLM   │
└──────┘         └─────────┘
                      │
                      ↓
                  Generic Answer
```

#### Problems
- ❌ LLM only knows pre-training data (cutoff date)
- ❌ No company-specific knowledge
- ❌ Hallucinates when uncertain
- ❌ Can't reference your documents

#### What This Gives You
- ✅ Natural language interface
- ✅ General knowledge Q&A

---

### **Layer 1: Adding Document Context (Naive RAG)**

#### What We're Adding
**Problem**: LLM doesn't know about our documents
**Solution**: Send document content with the question

#### Components Added
- **Document Storage**: Local filesystem
  - **Role**: Store raw documents
  - **Deployment**: Mac (development) or Ubuntu (production)

#### Implementation
```python
# Upload documents
documents = load_documents("company_docs/")

# For each question, search ALL documents
user_question = "What is our return policy?"
context = "\n".join([doc.content for doc in documents])

prompt = f"""
Context:
{context}

Question: {user_question}
Answer based only on the context above.
"""

response = llm.generate(prompt)
```

#### System View
```
┌──────────────┐
│  Documents   │
│  (Storage)   │
└──────┬───────┘
       │
       ↓ (load all)
┌──────┐    ┌──────────────┐    ┌─────────┐
│ User │───→│ Prompt Build │───→│   LLM   │
└──────┘    └──────────────┘    └─────────┘
            Context + Question
```

#### Problems
- ❌ **Token limit**: Can't fit 1000 documents in prompt (context window: 4K-128K tokens)
- ❌ **Irrelevant context**: Sending everything confuses LLM
- ❌ **Slow**: Loading all documents every time
- ❌ **Expensive**: Huge token costs ($$$)

#### What This Gives You
- ✅ LLM can reference your documents
- ✅ Grounded answers (not hallucinated)

---

### **Layer 2: Adding Retrieval (Vector Search)**

#### What We're Adding
**Problem**: Can't send all documents, need to find relevant ones
**Solution**: Semantic search using embeddings

#### Models Added

##### 1. **Embedding Model** (CRITICAL)
- **Type**: Sentence/Document encoder
- **Examples**: `BGE-M3` (CITI uses), `nomic-embed-text`, `bge-large-en-v1.5`
- **Input**: Text (query or document chunk)
- **Output**: Hybrid embeddings (dense 1024-dim + sparse + ColBERT)
- **Role in RAG**: **Pre-retrieval** - Converts text to semantic representation
- **Deployment**: Node 3 (Port 1234)
- **Why Separate**:
  - Different architecture than generation LLM
  - Optimized for similarity (not generation)
  - Needs to be fast (runs for every query + every document)
  - Smaller model (~400MB vs 4-7GB for LLM)
- **Performance**: ~1000 embeddings/second on NVIDIA GPU

##### 2. **Vector Store (In-Memory)**
- **Type**: In-memory list/numpy array
- **Role in RAG**: **Retrieval** - Store vectors, perform similarity search
- **Deployment**: Mac (Flask process memory)
- **Limitations**:
  - Not persistent (lost on restart)
  - No indexing (slow linear search)
  - Limited to memory size
  - No concurrent access

#### Implementation
```python
# STEP 1: Index documents (one-time)
from sentence_transformers import SentenceTransformer

embedder = SentenceTransformer('all-MiniLM-L6-v2')
vector_store = []

for doc in documents:
    vector = embedder.encode(doc.content)
    vector_store.append({
        "id": doc.id,
        "vector": vector,
        "text": doc.content
    })

# STEP 2: Query-time retrieval
user_question = "What is our return policy?"
query_vector = embedder.encode(user_question)

# Find top-k most similar (cosine similarity)
from sklearn.metrics.pairwise import cosine_similarity
similarities = [
    cosine_similarity([query_vector], [item["vector"]])[0][0]
    for item in vector_store
]
top_k_indices = sorted(
    range(len(similarities)),
    key=lambda i: similarities[i],
    reverse=True
)[:3]

# Build context with only relevant docs
relevant_docs = [vector_store[i]["text"] for i in top_k_indices]
context = "\n\n".join(relevant_docs)

prompt = f"Context:\n{context}\n\nQuestion: {user_question}"
response = llm.generate(prompt)
```

#### System View
```
┌──────────────┐
│  Documents   │
└──────┬───────┘
       │ (embed once)
       ↓
┌──────────────┐
│ Node 3:1234  │ ← Embedding Model (BGE-M3)
│ Embedder     │
└──────┬───────┘
       │
       ↓ (1024-dim vectors)
┌──────────────┐
│ Vector Store │ (in-memory on Mac)
│ [v1, v2, ...]│
└──────┬───────┘
       │
       │ (semantic search: cosine similarity)
       ↓
┌──────┐    ┌────────────┐    ┌─────────┐
│ User │───→│ Retriever  │───→│   LLM   │
└──────┘    └────────────┘    └─────────┘
            Top-3 relevant docs
```

#### RAG Stage Mapping
- **Pre-retrieval**: Embedding model converts query → vector
- **Retrieval**: Vector store finds similar documents
- **Generation**: LLM generates answer from retrieved context

#### Problems
- ❌ **Chunking**: Documents too long for single embedding (semantic information lost)
- ❌ **Lost semantics**: Long docs compressed into single vector
- ❌ **Scalability**: In-memory won't scale to millions of vectors
- ❌ **No persistence**: Data lost on restart

#### What This Gives You
- ✅ Efficient retrieval (only relevant docs)
- ✅ Handles large document collections
- ✅ Lower costs (smaller context)
- ✅ Semantic understanding (not just keyword matching)

---

### **Layer 3: Adding Chunking Strategy**

#### What We're Adding
**Problem**: Documents are too long (10,000 words), embeddings lose meaning
**Solution**: Split documents into semantic chunks

#### Components Added
- **Chunking Logic**: Text splitting with overlap
  - **Role**: Pre-processing for better embeddings
  - **Strategies**: Fixed-size, sentence-based, semantic
  - **Deployment**: Mac (Flask - during document upload)

#### Implementation
```python
def chunk_document(doc, chunk_size=512, overlap=50):
    """Split document into overlapping chunks"""
    words = doc.content.split()
    chunks = []

    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append({
            "text": chunk,
            "doc_id": doc.id,
            "chunk_id": i,
            "metadata": {
                "title": doc.title,
                "page": i // 500,
                "section": extract_section(doc, i)
            }
        })

    return chunks

# Now index chunks instead of full documents
all_chunks = []
for doc in documents:
    all_chunks.extend(chunk_document(doc))

# Embed chunks (on Ubuntu:8001)
for chunk in all_chunks:
    chunk["vector"] = embedder.encode(chunk["text"])
    vector_store.append(chunk)
```

#### System View
```
┌──────────────┐
│  Documents   │
└──────┬───────┘
       │
       ↓ (chunk - Mac Flask)
┌──────────────┐
│   Chunks     │ (512 tokens each, 50 overlap)
│ [c1, c2, ...]│
└──────┬───────┘
       │ (embed - Node 3:1234)
       ↓
┌──────────────┐
│ Node 3:1234  │ ← Embedding Model (BGE-M3)
│ Embedder     │
└──────┬───────┘
       │
       ↓ (1024-dim vectors)
┌──────────────┐
│ Vector Store │ (stores chunk vectors + metadata)
└──────┬───────┘
       │
       ↓ (retrieve top-5 chunks)
┌──────┐    ┌────────────┐    ┌─────────┐
│ User │───→│ Retriever  │───→│   LLM   │
└──────┘    └────────────┘    └─────────┘
```

#### Chunking Strategies (Research Area!)
1. **Fixed-size**: 512 tokens with 50-token overlap
2. **Sentence-based**: Split at sentence boundaries
3. **Semantic**: Use embeddings to find natural breakpoints
4. **Section-based**: Follow document structure (headings, paragraphs)

#### What This Adds
- **Metadata Preservation**: Track source document, page, section
- **Granular Retrieval**: Fetch specific paragraphs, not whole docs
- **Context Windows**: Overlap ensures context isn't lost at boundaries

#### Problems
- ❌ **Optimal chunk size?**: 512 tokens? 1024? Depends on use case (thesis opportunity!)
- ❌ **Semantic boundaries**: May split mid-sentence or mid-concept
- ❌ **Lost context**: Chunk may lack surrounding context ("the product" - which product?)

#### What This Gives You
- ✅ Better embeddings (focused semantic units)
- ✅ More precise retrieval
- ✅ Can cite specific sections
- ✅ Handles long documents (books, manuals)

---

### **Layer 4: Adding Production Infrastructure**

#### What We're Adding
**Problem**: In-memory storage not scalable, basic LLM too slow
**Solution**: Production vector database + optimized LLM inference

#### Models/Services Added

##### 1. **vLLM Server** (CRITICAL UPGRADE)
- **Type**: High-performance LLM inference server
- **Models**: CITI uses YannQi/R-4B (4B params)
- **Role in RAG**: **Generation** - Produces final answer from context
- **Deployment**: Node 1 (Port 8000)
- **Why vLLM over alternatives**:
  - **PagedAttention**: Efficient GPU memory management (fit larger models)
  - **Continuous batching**: Process multiple requests simultaneously
  - **10-20x faster** than Hugging Face Transformers
  - **Streaming**: Tokens appear as generated (better UX)
  - **Production-ready**: Handles load, auto-scaling
- **Performance**: ~50 tokens/sec on NVIDIA GPU
- **API**: OpenAI-compatible (easy migration)

##### 1b. **LocalAI Server** (ALTERNATIVE LLM)
- **Type**: Alternative LLM inference server
- **Models**: CITI uses Gemma3-4b-qat (quantized)
- **Role in RAG**: **HyDE generation**, alternative LLM
- **Deployment**: Node 2 (Port 8080)
- **Features**: CUDA support, quantization, multiple model support
- **API**: OpenAI-compatible

##### 2. **Milvus Vector Database** (CRITICAL UPGRADE)
- **Type**: Purpose-built vector database
- **Role in RAG**: **Retrieval** - Stores embeddings, performs fast similarity search
- **Deployment**: Node 4 (Port 19530, + etcd + MinIO)
- **Why Milvus over alternatives**:
  - **GPU-accelerated search**: GPU-optimized vector operations
  - **Handles billions of vectors**: Scalable beyond memory
  - **Advanced indexing**: HNSW, IVF_FLAT, GPU_IVF_PQ
  - **Hybrid search support**: Dense + sparse (BM25) in one query
  - **Metadata filtering**: Search within subsets
  - **ACID compliance**: Reliable data operations
- **Performance**: Sub-second search on millions of vectors
- **Storage**: Persistent (MinIO object storage), survives restarts

#### Implementation
```python
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType
import requests

# ===== MILVUS SETUP (Node 4:19530) =====
connections.connect("default", host="<node4-tailscale-ip>", port="19530")

# Define schema
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
    FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=768),
    FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=65535),
    FieldSchema(name="doc_id", dtype=DataType.VARCHAR, max_length=100),
    FieldSchema(name="metadata", dtype=DataType.JSON)
]
schema = CollectionSchema(fields, description="Document chunks")
collection = Collection("knowledge_base", schema)

# Create index (HNSW = fast approximate nearest neighbor)
collection.create_index(
    "vector",
    {
        "index_type": "HNSW",
        "metric_type": "COSINE",
        "params": {"M": 16, "efConstruction": 200}
    }
)
collection.load()  # Load into GPU memory

# Insert chunks
for chunk in all_chunks:
    # Get embedding from Node 3:1234
    embedding_response = requests.post(
        "http://<node3-tailscale-ip>:1234/embed",
        json={"text": chunk["text"]}
    )
    vector = embedding_response.json()["embedding"]

    # Insert into Milvus
    collection.insert([[vector], [chunk["text"]], [chunk["doc_id"]], [chunk["metadata"]]])

# ===== QUERY WITH vLLM (Node 1:8000) =====
def query_rag(user_question):
    # 1. Embed query (Node 3:1234)
    query_embedding = requests.post(
        "http://<node3-tailscale-ip>:1234/embed",
        json={"text": user_question}
    ).json()["embedding"]

    # 2. Search Milvus (Node 4:19530)
    results = collection.search(
        data=[query_embedding],
        anns_field="vector",
        param={"metric_type": "COSINE", "params": {"ef": 64}},
        limit=5,
        output_fields=["text", "metadata"]
    )

    # 3. Build prompt
    context = "\n\n".join([hit.entity.get("text") for hit in results[0]])
    prompt = f"""Context:\n{context}\n\nQuestion: {user_question}\nAnswer:"""

    # 4. Generate with vLLM (Node 1:8000)
    response = requests.post(
        "http://<node1-tailscale-ip>:8000/v1/completions",
        json={
            "model": "YannQi/R-4B",
            "prompt": prompt,
            "max_tokens": 500,
            "stream": True
        },
        stream=True
    )

    # 5. Stream response
    for line in response.iter_lines():
        if line:
            token = parse_sse(line)
            yield token
```

#### System View
```
┌──────────────┐
│  Documents   │
└──────┬───────┘
       │
       ↓ (chunk - Mac)
┌──────────────────────────────────────────────────────┐
│                UBUNTU GPU SERVER                     │
│                                                       │
│  ┌──────────────┐                                   │
│  │ Ubuntu:8001  │ ← Embedding Model                 │
│  │ Embedder     │   (nomic-embed-text)              │
│  └──────┬───────┘                                   │
│         │                                            │
│         ↓ (vectors)                                  │
│  ┌──────────────┐                                   │
│  │ Ubuntu:19530 │ ← Milvus Vector DB                │
│  │   Milvus     │   • HNSW Index                    │
│  │              │   • GPU-accelerated               │
│  │              │   • Persistent storage            │
│  └──────┬───────┘                                   │
│         │                                            │
│         ↓ (top-5 chunks)                             │
│  ┌──────────────┐                                   │
│  │ Ubuntu:8000  │ ← vLLM (Mistral-7B)               │
│  │    vLLM      │   • PagedAttention                │
│  │              │   • Continuous batching           │
│  │              │   • Streaming output              │
│  └──────────────┘                                   │
│                                                       │
└───────────────────────────────────────────────────────┘
         ↑ All requests via Tailscale VPN ↑
┌──────────────────────────────────────────┐
│ Mac - Flask Backend (Orchestrator)       │
│ • Coordinates all Ubuntu services        │
│ • Builds prompts                         │
│ • Streams responses to frontend          │
└──────────────────────────────────────────┘
         ↑
┌──────────────┐
│ Next.js UI   │
└──────────────┘
```

#### What This Gives You
- ✅ **Scalability**: Handles millions of documents
- ✅ **Performance**: Sub-second retrieval + 50 tok/sec generation
- ✅ **Production-ready**: Persistent, reliable, handles load
- ✅ **Cost-effective**: Self-hosted, no API costs
- ✅ **Privacy**: All data stays on your infrastructure

---

### **Layer 5: Adding Metadata & Filtering**

#### What We're Adding
**Problem**: Users want to search only specific document types, dates, departments
**Solution**: Rich metadata + filtered search

#### Components Added
- **Metadata Schema**: Structured fields for filtering
  - **Role**: Enable scoped retrieval
  - **Deployment**: Stored in Milvus (Ubuntu)

#### Implementation
```python
# Enhanced metadata
chunk_metadata = {
    "doc_id": "report_2024_q3",
    "title": "Q3 Financial Report",
    "doc_type": "financial",        # financial, technical, hr, legal
    "date": "2024-09-30",
    "department": "finance",
    "author": "John Doe",
    "access_level": "internal",     # public, internal, confidential
    "tags": ["quarterly", "revenue", "expenses"],
    "language": "en",
    "version": "1.2"
}

# Insert with metadata
collection.insert([
    [vector],
    [chunk["text"]],
    [chunk["doc_id"]],
    [chunk_metadata]  # JSON field in Milvus
])

# Filtered search
results = collection.search(
    data=[query_vector],
    anns_field="vector",
    param={"metric_type": "COSINE"},
    limit=5,
    expr='doc_type == "financial" and date >= "2024-01-01" and access_level in ["public", "internal"]',
    output_fields=["text", "metadata"]
)
```

#### System View
```
┌──────────────┐
│  Documents   │ (+ metadata extraction)
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ Ubuntu:19530 │
│   Milvus     │
│              │
│ Schema:      │
│ • vector     │ (dense embedding)
│ • text       │ (chunk content)
│ • doc_id     │ (source document)
│ • metadata   │ ← Rich filtering
│   - type     │
│   - date     │
│   - dept     │
│   - access   │
│   - tags     │
└──────┬───────┘
       │
       ↓ (filtered semantic search)
┌──────┐    ┌────────────┐    ┌─────────┐
│ User │───→│   Flask    │───→│  vLLM   │
└──────┘    │ + Filters  │    └─────────┘
            └────────────┘
```

#### Use Cases
- **Time-based**: "Show only documents from 2024"
- **Department-based**: "Search only in engineering docs"
- **Type-based**: "Find technical manuals only"
- **Access control**: Users see only docs they have permission for
- **Tag-based**: "Search documents tagged with 'security'"

#### What This Gives You
- ✅ Scoped search (better precision)
- ✅ Access control (security)
- ✅ Better UX (users specify constraints)
- ✅ Compliance (audit trails, data governance)

---

### **Layer 6: Adding Hybrid Search (Sparse + Dense)**

#### What We're Adding
**Problem**: Vector search fails on exact keywords (e.g., "ISO 9001", product IDs, acronyms)
**Solution**: Combine semantic search (dense vectors) + keyword search (sparse vectors/BM25)

#### Components Added
- **BM25 Index**: Traditional keyword search
  - **Role**: Exact match retrieval (complements semantic search)
  - **Deployment**: Mac (Flask) or Ubuntu (can use Elasticsearch)
  - **Algorithm**: TF-IDF based ranking

#### Implementation
```python
from rank_bm25 import BM25Okapi
import numpy as np

# ===== BUILD BM25 INDEX =====
corpus = [chunk["text"] for chunk in all_chunks]
tokenized_corpus = [doc.lower().split() for doc in corpus]
bm25 = BM25Okapi(tokenized_corpus)

# ===== HYBRID SEARCH =====
def hybrid_search(query, top_k=5, alpha=0.5):
    """
    Hybrid retrieval combining dense (semantic) and sparse (keyword) search

    alpha: weight for dense vs sparse
      - alpha=1.0: pure semantic (vector only)
      - alpha=0.0: pure keyword (BM25 only)
      - alpha=0.5: balanced hybrid
    """

    # 1. DENSE RETRIEVAL (Semantic - Ubuntu:8001 → Ubuntu:19530)
    query_vector = get_embedding(query)  # Ubuntu:8001
    dense_results = milvus_collection.search(
        data=[query_vector],
        anns_field="vector",
        param={"metric_type": "COSINE"},
        limit=top_k * 2  # Over-retrieve for fusion
    )

    # 2. SPARSE RETRIEVAL (Keyword - Local BM25)
    tokenized_query = query.lower().split()
    bm25_scores = bm25.get_scores(tokenized_query)
    sparse_results = sorted(
        enumerate(bm25_scores),
        key=lambda x: x[1],
        reverse=True
    )[:top_k * 2]

    # 3. RECIPROCAL RANK FUSION (RRF)
    # Combines rankings from both methods
    combined_scores = {}

    # Add dense scores
    for rank, hit in enumerate(dense_results[0]):
        idx = hit.id
        combined_scores[idx] = combined_scores.get(idx, 0) + alpha / (rank + 60)

    # Add sparse scores
    for rank, (idx, score) in enumerate(sparse_results):
        combined_scores[idx] = combined_scores.get(idx, 0) + (1 - alpha) / (rank + 60)

    # 4. Return top-k by combined score
    final_results = sorted(
        combined_scores.items(),
        key=lambda x: x[1],
        reverse=True
    )[:top_k]

    return [all_chunks[idx] for idx, score in final_results]
```

#### System View
```
                    ┌────────────┐
                    │  Documents │
                    └──────┬─────┘
                           │
                 ┌─────────┴─────────┐
                 │                   │
                 ↓                   ↓
         ┌──────────────┐    ┌──────────────┐
         │ Ubuntu:8001  │    │ BM25 Index   │
         │ Embedding    │    │ (Sparse)     │
         │ (Dense)      │    │ Mac/Flask    │
         └──────┬───────┘    └──────┬───────┘
                │                   │
                ↓                   │
         ┌──────────────┐           │
         │ Ubuntu:19530 │           │
         │   Milvus     │           │
         │ (Vector DB)  │           │
         └──────┬───────┘           │
                │                   │
┌──────┐        │    ┌──────────────┴────┐
│ User │───────────→ │ Hybrid Retriever  │
└──────┘        │    │  (RRF Fusion)     │
                │    │  α=0.5            │
                │    └──────────┬────────┘
                ↓               ↓
         (Semantic)      (Exact match)
                │               │
                └───────┬───────┘
                        ↓
                   Top-K Results
                        ↓
                ┌──────────────┐
                │ Ubuntu:8000  │
                │    vLLM      │
                └──────────────┘
```

#### When Each Method Wins

| Query Type | Best Method | Example |
|------------|-------------|---------|
| Conceptual questions | Dense (semantic) | "How do we improve customer satisfaction?" |
| Exact terms/IDs | Sparse (BM25) | "Find document ISO-9001-2023" |
| Acronyms | Sparse (BM25) | "What is KMS?" |
| Product codes | Sparse (BM25) | "Details on SKU-12345" |
| Natural language | Dense (semantic) | "What are the benefits of knowledge sharing?" |
| Mixed | Hybrid | "ISO 9001 compliance benefits" |

#### Reciprocal Rank Fusion (RRF) Explained
```
Dense results: [doc_A (rank 1), doc_B (rank 2), doc_C (rank 3)]
Sparse results: [doc_B (rank 1), doc_D (rank 2), doc_A (rank 3)]

RRF scores (k=60):
doc_A: 1/(1+60) + 1/(3+60) = 0.0164 + 0.0159 = 0.0323
doc_B: 1/(2+60) + 1/(1+60) = 0.0161 + 0.0164 = 0.0325  ← Winner
doc_C: 1/(3+60) = 0.0159
doc_D: 1/(2+60) = 0.0161

Final ranking: [doc_B, doc_A, doc_D, doc_C]
```

#### What This Gives You
- ✅ Best of both worlds (semantic + exact)
- ✅ Handles technical terms, IDs, acronyms
- ✅ Research shows 10-20% improvement over dense-only
- ✅ Thesis opportunity: Benchmark different fusion methods

---

### **Layer 7: Adding Post-Retrieval Optimization**

#### What We're Adding
**Problem**: Retrieved chunks may have redundancy, noise, or wrong ordering
**Solution**: Rerank and compress before sending to LLM

#### Models Added

##### **Reranker Model** (Optional but Powerful)
- **Type**: Cross-encoder (different from bi-encoder embeddings!)
- **Examples**: `cross-encoder/ms-marco-MiniLM-L-12-v2`, `bge-reranker-large`
- **Input**: (query, document) pairs
- **Output**: Relevance score (0-1)
- **Role in RAG**: **Post-retrieval** - Rescores retrieved chunks for precision
- **Deployment**: Ubuntu GPU Server (can run alongside vLLM)
- **Why Cross-Encoder**:
  - Bi-encoders (embeddings): Query and doc encoded separately → fast but less accurate
  - Cross-encoders: Query+doc encoded together → slower but much more accurate
  - Use bi-encoder for initial retrieval (1M docs), cross-encoder for reranking (10 docs)
- **Performance**: ~100 pairs/second on RTX 4080

#### Implementation
```python
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch

# ===== LOAD RERANKER (Ubuntu GPU) =====
reranker_model = AutoModelForSequenceClassification.from_pretrained(
    'cross-encoder/ms-marco-MiniLM-L-12-v2'
).to('cuda')
reranker_tokenizer = AutoTokenizer.from_pretrained(
    'cross-encoder/ms-marco-MiniLM-L-12-v2'
)

def rerank(query, retrieved_chunks, top_k=3):
    """
    Rerank retrieved chunks using cross-encoder
    More accurate than bi-encoder similarity
    """
    # Create (query, chunk) pairs
    pairs = [[query, chunk["text"]] for chunk in retrieved_chunks]

    # Score all pairs
    with torch.no_grad():
        inputs = reranker_tokenizer(
            pairs,
            padding=True,
            truncation=True,
            return_tensors='pt',
            max_length=512
        ).to('cuda')

        scores = reranker_model(**inputs).logits.squeeze(-1).cpu().tolist()

    # Sort by reranker score (not original retrieval score!)
    ranked = sorted(
        zip(retrieved_chunks, scores),
        key=lambda x: x[1],
        reverse=True
    )

    return [chunk for chunk, score in ranked[:top_k]]

def compress_context(chunks):
    """
    Remove redundant/irrelevant sentences
    Reduces token count, improves LLM focus
    """
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    # Extract all sentences
    sentences = []
    sentence_to_chunk = {}
    for chunk in chunks:
        chunk_sentences = chunk["text"].split(". ")
        for sent in chunk_sentences:
            sentences.append(sent)
            sentence_to_chunk[sent] = chunk

    # Vectorize sentences
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform(sentences)

    # Remove duplicates/near-duplicates
    unique_sentences = []
    seen_indices = set()

    for i, sent in enumerate(sentences):
        if i in seen_indices:
            continue

        # Check similarity with already selected
        is_unique = True
        for j in seen_indices:
            sim = cosine_similarity(vectors[i], vectors[j])[0][0]
            if sim > 0.9:  # Threshold for "too similar"
                is_unique = False
                break

        if is_unique:
            unique_sentences.append(sent)
            seen_indices.add(i)

    return ". ".join(unique_sentences)

# ===== FULL POST-RETRIEVAL PIPELINE =====
def post_retrieval_optimize(query, retrieved_chunks):
    """
    Two-stage post-retrieval:
    1. Rerank: Rescore chunks for better ordering
    2. Compress: Remove redundancy, reduce noise
    """
    # Stage 1: Rerank with cross-encoder
    reranked = rerank(query, retrieved_chunks, top_k=5)

    # Stage 2: Compress (remove redundant sentences)
    compressed_text = compress_context(reranked)

    return compressed_text
```

#### System View
```
┌──────┐
│ User │ "What is knowledge management?"
└───┬──┘
    │
    ↓ Query
┌────────────────┐
│ Hybrid Search  │ → Retrieve top-10 (over-retrieve)
│ (Layer 6)      │
└───┬────────────┘
    │
    ↓ 10 chunks
┌────────────────┐
│   Reranker     │ ← Cross-Encoder Model (Ubuntu GPU)
│ (Cross-Encoder)│    More accurate than bi-encoder
│                │    Sees query + doc together
└───┬────────────┘
    │
    ↓ 5 chunks (rescored, reordered)
┌────────────────┐
│  Compression   │ → Remove redundancy
│                │   • Duplicate sentences
│                │   • Low-relevance sentences
│                │   • Noise reduction
└───┬────────────┘
    │
    ↓ 3 chunks, ~500 tokens (optimized context)
┌────────────────┐
│ Ubuntu:8000    │ ← vLLM (Generation)
│     vLLM       │    Cleaner input = better output
└────────────────┘
```

#### Why Two-Stage Retrieval?

**Stage 1: Bi-Encoder (Fast, Approximate)**
- Speed: 1000s of docs/second
- Accuracy: ~80-85%
- Use: Initial retrieval from large corpus

**Stage 2: Cross-Encoder (Slow, Accurate)**
- Speed: 100s of docs/second
- Accuracy: ~90-95%
- Use: Rerank small candidate set

**Analogy**: Like a funnel
1. Bi-encoder: Quickly filter 1M docs → 10 candidates
2. Cross-encoder: Carefully score those 10 → best 3

#### Benefits of Post-Retrieval

| Problem | Solution | Impact |
|---------|----------|--------|
| Wrong ordering | Reranking | Top chunks are truly most relevant |
| Redundancy | Compression | Reduced tokens, lower cost |
| Noise | Filtering | LLM focuses on signal |
| "Lost in middle" | Reordering | Best chunks at start/end of context |

#### What This Gives You
- ✅ **Higher precision**: Top-3 are really the best
- ✅ **Reduced LLM context**: Faster, cheaper generation
- ✅ **Better answer quality**: Less noise → better focus
- ✅ **Thesis opportunity**: Benchmark compression strategies

---

### **Layer 8: Adding Pre-Retrieval Optimization**

#### What We're Adding
**Problem**: User queries are often vague, ambiguous, or conversational
**Solution**: Query enhancement before retrieval

#### Components Added
- **Query Rewriter**: LLM-based query transformation
  - **Role**: Pre-retrieval - Improve query quality
  - **Deployment**: Can use vLLM (Ubuntu:8000) or separate small model
  - **Techniques**: Expansion, contextualization, multi-query

#### Implementation
```python
# ===== QUERY ENHANCEMENT STRATEGIES =====

def expand_query(user_query):
    """
    Add synonyms and related terms for better recall
    """
    prompt = f"""Expand this search query with synonyms and related terms:
Original: "{user_query}"

Expanded query (add 3-5 related terms, keep concise):"""

    expanded = vllm_generate(prompt, max_tokens=50)
    return expanded.strip()

def contextualize_query(user_query, conversation_history):
    """
    Resolve pronouns and references from conversation
    Makes query standalone
    """
    if not conversation_history:
        return user_query

    prompt = f"""Previous conversation:
{format_history(conversation_history)}

Current question: "{user_query}"

Rewrite the question to be standalone (replace pronouns, add context):"""

    contextualized = vllm_generate(prompt, max_tokens=100)
    return contextualized.strip()

def generate_multi_query(user_query):
    """
    Generate alternative phrasings to improve recall
    Different phrasings may match different documents
    """
    prompt = f"""Generate 3 alternative ways to phrase this question:
"{user_query}"

1.
2.
3.
"""

    response = vllm_generate(prompt, max_tokens=150)
    alternatives = [line.strip() for line in response.split("\n") if line.strip()]
    return alternatives

# ===== FULL PRE-RETRIEVAL PIPELINE =====
def pre_retrieval_enhance(user_query, conversation_history=None):
    """
    Three-stage query enhancement:
    1. Contextualize: Make query standalone
    2. Expand: Add related terms
    3. Multi-query: Generate alternatives
    """

    # Stage 1: Contextualize with conversation
    if conversation_history:
        query = contextualize_query(user_query, conversation_history)
    else:
        query = user_query

    # Stage 2: Expand with related terms
    expanded = expand_query(query)

    # Stage 3: Generate alternative phrasings
    alternatives = generate_multi_query(query)

    return {
        "original": user_query,
        "contextualized": query,
        "expanded": expanded,
        "alternatives": alternatives,
        "all_queries": [query] + alternatives  # For multi-query retrieval
    }

# ===== USE IN RETRIEVAL =====
def enhanced_retrieval(user_query, conversation_history=None, top_k=5):
    """
    Retrieve using multiple enhanced queries, merge results
    """
    # Pre-retrieval enhancement
    enhanced = pre_retrieval_enhance(user_query, conversation_history)

    # Retrieve for each query variant
    all_results = []
    for query_variant in enhanced["all_queries"]:
        results = hybrid_search(query_variant, top_k=10)
        all_results.extend(results)

    # Deduplicate by chunk ID
    unique_results = {r["id"]: r for r in all_results}.values()

    # Rerank merged results (post-retrieval)
    final = rerank(enhanced["contextualized"], unique_results, top_k=top_k)

    return final
```

#### System View
```
┌──────┐
│ User │ "What's the policy?" (+ conversation history)
└───┬──┘
    │
    ↓
┌─────────────────────────────────────┐
│ PRE-RETRIEVAL ENHANCEMENT           │
│ (Uses vLLM Ubuntu:8000)             │
│                                     │
│ 1. Contextualize                    │
│    Input: "What's the policy?"      │
│    + History: [talked about refunds]│
│    Output: "What is the refund      │
│             policy?"                │
│                                     │
│ 2. Expand                           │
│    Output: "refund policy return    │
│             exchange money-back     │
│             guarantee"              │
│                                     │
│ 3. Multi-Query                      │
│    Output: ["What is the refund     │
│             policy?",               │
│            "How do returns work?",  │
│            "Return process details"]│
└─────┬───────────────────────────────┘
      │
      ↓ (4 query variants)
┌─────────────────────────────────────┐
│ HYBRID SEARCH (Layer 6)             │
│ • Search with each variant          │
│ • Merge results                     │
│ • Deduplicate                       │
└─────┬───────────────────────────────┘
      │
      ↓ (merged candidates)
┌─────────────────────────────────────┐
│ POST-RETRIEVAL (Layer 7)            │
│ • Rerank with cross-encoder         │
│ • Compress redundancy               │
└─────┬───────────────────────────────┘
      │
      ↓ (optimized context)
┌─────────────────────────────────────┐
│ GENERATION (vLLM Ubuntu:8000)       │
└─────────────────────────────────────┘
```

#### Example: Conversation Context

**Without Contextualization**:
```
User: "Tell me about our Q3 results"
Assistant: [retrieves Q3 financial data]

User: "What about Q4?"  ← Vague! Retrieval fails
Assistant: [searches for "what about Q4" → poor results]
```

**With Contextualization**:
```
User: "Tell me about our Q3 results"
Assistant: [retrieves Q3 financial data]

User: "What about Q4?"
→ Contextualized: "What are our Q4 financial results?"  ← Clear!
Assistant: [searches correctly → good results]
```

#### What This Gives You
- ✅ Handles vague/ambiguous queries
- ✅ Conversational context awareness
- ✅ Better recall (multiple query variants)
- ✅ Resolves pronouns ("it", "that", "the product")
- ✅ Thesis opportunity: Evaluate query enhancement strategies

---

### **Layer 9: Adding Graph-Based Retrieval**

#### What We're Adding
**Problem**: Vector search misses relationships (e.g., "Who reported to X in 2023?")
**Solution**: Knowledge graph with entities + relationships

#### Components Added

##### **Knowledge Graph Database**
- **Type**: Graph database (Neo4j) or in-memory graph (NetworkX)
- **Role in RAG**: **Retrieval** - Relationship-aware search
- **Deployment**: Ubuntu (if Neo4j) or Mac (if NetworkX)
- **Structure**:
  - **Nodes**: Entities (people, products, concepts)
  - **Edges**: Relationships (works_for, part_of, related_to)

#### Implementation
```python
import networkx as nx
from transformers import pipeline

# ===== ENTITY & RELATION EXTRACTION =====
# Can use: NER models, LLM-based extraction, or pattern matching

def extract_entities_relations(text):
    """
    Extract entities and relationships from text
    Uses LLM for flexible extraction
    """
    prompt = f"""Extract entities and relationships from this text.

Text: "{text}"

Format:
Entities: [list of entities with types]
Relations: [(entity1, relation_type, entity2), ...]

Example:
Entities: [("John Doe", "PERSON"), ("ACME Corp", "ORG"), ("2023", "DATE")]
Relations: [("John Doe", "WORKS_FOR", "ACME Corp"), ("ACME Corp", "FOUNDED_IN", "2023")]
"""

    result = vllm_generate(prompt, max_tokens=200)
    entities, relations = parse_extraction(result)
    return entities, relations

# ===== BUILD KNOWLEDGE GRAPH =====
graph = nx.MultiDiGraph()

for chunk in all_chunks:
    entities, relations = extract_entities_relations(chunk["text"])

    # Add entities as nodes
    for entity, entity_type in entities:
        if entity not in graph:
            graph.add_node(
                entity,
                type=entity_type,
                chunks=[]
            )
        graph.nodes[entity]["chunks"].append({
            "id": chunk["id"],
            "text": chunk["text"]
        })

    # Add relations as edges
    for e1, rel_type, e2 in relations:
        graph.add_edge(
            e1, e2,
            relation=rel_type,
            source_chunk=chunk["id"]
        )

# ===== GRAPH-ENHANCED RETRIEVAL =====
def graph_enhanced_search(query, top_k=5):
    """
    Hybrid: Graph traversal + Vector search
    """

    # 1. Extract entities from query
    query_entities, _ = extract_entities_relations(query)
    query_entity_names = [e[0] for e in query_entities]

    # 2. Find relevant subgraph (entities within 2 hops)
    relevant_nodes = set()
    for entity in query_entity_names:
        if entity in graph:
            # BFS: Find neighbors within 2 hops
            neighbors = nx.single_source_shortest_path_length(
                graph, entity, cutoff=2
            )
            relevant_nodes.update(neighbors.keys())

    # 3. Get chunks from graph nodes
    graph_chunks = []
    for node in relevant_nodes:
        graph_chunks.extend(graph.nodes[node].get("chunks", []))

    # 4. Also do vector search (standard retrieval)
    vector_results = hybrid_search(query, top_k=10)

    # 5. Merge graph + vector results
    all_candidates = graph_chunks + vector_results
    unique = {c["id"]: c for c in all_candidates}.values()

    # 6. Rerank combined results
    final = rerank(query, unique, top_k=top_k)

    return final

# ===== GRAPH-SPECIFIC QUERIES =====
def answer_relational_query(query):
    """
    Handle queries about relationships
    Example: "Who does John report to?"
    """
    # Extract query intent
    if "report to" in query.lower():
        person = extract_person_from_query(query)

        # Traverse graph
        if person in graph:
            managers = [
                target for source, target, data in graph.out_edges(person, data=True)
                if data.get("relation") == "REPORTS_TO"
            ]
            return managers

    # Fallback to general graph search
    return graph_enhanced_search(query)
```

#### System View
```
                    ┌────────────┐
                    │  Documents │
                    └──────┬─────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ↓                         ↓
    ┌──────────────────┐      ┌─────────────────┐
    │  Vector Index    │      │ Knowledge Graph │
    │  (Milvus)        │      │  (Neo4j/NetworkX)│
    │                  │      │                 │
    │  Chunk vectors   │      │ Nodes:          │
    │  Dense search    │      │  • People       │
    │                  │      │  • Orgs         │
    │                  │      │  • Products     │
    │                  │      │  • Concepts     │
    │                  │      │                 │
    │                  │      │ Edges:          │
    │                  │      │  • WORKS_FOR    │
    │                  │      │  • PART_OF      │
    │                  │      │  • RELATED_TO   │
    │                  │      │  • REPORTS_TO   │
    └────────┬─────────┘      └────────┬────────┘
             │                         │
             │                         │
┌──────┐     │       ┌─────────────────┴─────┐
│ User │─────────────→│  Hybrid Retrieval    │
└──────┘     │       │  • Extract entities   │
             │       │  • Graph traversal    │
             │       │  • Vector search      │
             │       │  • Merge results      │
             │       └─────────┬─────────────┘
             │                 │
             └────────┬────────┘
                      ↓
                Combined Results
                      ↓
                 ┌─────────┐
                 │  vLLM   │
                 └─────────┘
```

#### When Graph Retrieval Shines

| Query Type | Why Graph Helps | Example |
|------------|-----------------|---------|
| Relational | Direct edge traversal | "Who reports to John?" |
| Multi-hop | Path finding | "What products use components from Supplier X?" |
| Entity-centric | Node aggregation | "Everything about Project Apollo" |
| Structured | Schema-aware | "List all engineers in R&D department" |

#### Graph vs Vector Search

| Aspect | Vector Search | Graph Search |
|--------|---------------|--------------|
| **Strength** | Semantic similarity | Explicit relationships |
| **Query** | "What is X?" | "How is X related to Y?" |
| **Result** | Similar content | Connected entities |
| **Structure** | Unstructured text | Structured knowledge |
| **Example** | "Benefits of KMS" | "Who works with whom?" |

#### What This Gives You
- ✅ Structured knowledge representation
- ✅ Better multi-hop reasoning
- ✅ Relationship-aware retrieval
- ✅ Entity-centric queries
- ✅ Thesis opportunity: Compare vector vs graph vs hybrid

---

### **Layer 10: Production Features**

#### What We're Adding
All the non-AI infrastructure needed for real deployment

#### Components Added

##### 1. **User Authentication & Authorization**
```python
from flask_jwt_extended import JWTManager, create_access_token, jwt_required

app.config["JWT_SECRET_KEY"] = "your-secret-key"
jwt = JWTManager(app)

@app.route('/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')

    # Verify credentials (PostgreSQL)
    user = User.query.filter_by(username=username).first()
    if user and user.verify_password(password):
        access_token = create_access_token(identity=user.id)
        return {"access_token": access_token}

    return {"error": "Invalid credentials"}, 401

@app.route('/query', methods=['POST'])
@jwt_required()
def query():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    # Apply access control to retrieval
    results = milvus_collection.search(
        query_vector,
        expr=f'department == "{user.department}" and access_level <= {user.clearance_level}'
    )
```

##### 2. **Conversation Memory (PostgreSQL)**
```python
class Conversation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    session_id = db.Column(db.String(100))
    query = db.Column(db.Text)
    response = db.Column(db.Text)
    retrieved_chunk_ids = db.Column(db.JSON)  # Track sources
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    rating = db.Column(db.Integer)  # User feedback (1-5)

# Use for query contextualization (Layer 8)
def get_conversation_history(user_id, session_id, limit=5):
    return Conversation.query.filter_by(
        user_id=user_id,
        session_id=session_id
    ).order_by(Conversation.timestamp.desc()).limit(limit).all()
```

##### 3. **Document Management**
```python
class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255))
    filepath = db.Column(db.String(500))  # ~/thesis-data/documents/
    upload_date = db.Column(db.DateTime)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    department = db.Column(db.String(100))
    status = db.Column(db.String(50))  # processing, indexed, failed
    chunk_count = db.Column(db.Integer)
    file_size = db.Column(db.Integer)
    file_hash = db.Column(db.String(64))  # Deduplication

@app.route('/documents/<int:doc_id>/reindex', methods=['POST'])
@admin_required
def reindex_document(doc_id):
    doc = Document.query.get(doc_id)

    # Delete old chunks from Milvus
    milvus_collection.delete(expr=f'doc_id == "{doc_id}"')

    # Reprocess and reindex
    chunks = process_document(doc.filepath)
    embed_and_store(chunks)

    doc.status = "indexed"
    doc.chunk_count = len(chunks)
    db.session.commit()
```

##### 4. **Monitoring & Observability**
```python
from prometheus_client import Counter, Histogram, Gauge
import logging

# Metrics
query_counter = Counter('rag_queries_total', 'Total queries', ['status'])
query_latency = Histogram('rag_query_latency_seconds', 'Query latency')
retrieval_score = Histogram('rag_retrieval_score', 'Avg retrieval score')
token_usage = Counter('rag_tokens_total', 'Tokens used', ['type'])
active_users = Gauge('rag_active_users', 'Active users')

@app.route('/query', methods=['POST'])
@query_latency.time()
def query():
    query_counter.labels(status='started').inc()

    try:
        # RAG pipeline...
        results = rag_pipeline(user_query)

        # Log metrics
        avg_score = sum(r["score"] for r in results["chunks"]) / len(results["chunks"])
        retrieval_score.observe(avg_score)

        token_count = len(results["response"].split())
        token_usage.labels(type='output').inc(token_count)

        query_counter.labels(status='success').inc()

    except Exception as e:
        query_counter.labels(status='error').inc()
        logger.error(f"Query failed: {e}")
        raise

# Expose metrics endpoint
@app.route('/metrics')
def metrics():
    return generate_latest()
```

##### 5. **Evaluation & Feedback Loop**
```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision

# User feedback
@app.route('/feedback', methods=['POST'])
def feedback():
    conversation_id = request.json.get('conversation_id')
    rating = request.json.get('rating')  # 1-5
    feedback_text = request.json.get('feedback')

    conv = Conversation.query.get(conversation_id)
    conv.rating = rating
    db.session.commit()

    # Alert on low ratings
    if rating <= 2:
        logger.warning(f"Low rating for query: {conv.query}")
        # Could trigger manual review or model update

# Periodic RAGAS evaluation
def run_evaluation():
    """Run automated quality assessment"""
    test_set = load_test_queries()
    results = []

    for item in test_set:
        response = rag_pipeline(item["query"])
        results.append({
            "query": item["query"],
            "response": response["answer"],
            "contexts": [c["text"] for c in response["chunks"]],
            "ground_truth": item["expected_answer"]
        })

    scores = evaluate(
        results,
        metrics=[faithfulness, answer_relevancy, context_precision]
    )

    # Store scores in monitoring
    for metric, score in scores.items():
        log_metric(f"ragas_{metric}", score)

    # Alert if degradation
    if scores["faithfulness"] < 0.8:
        alert_team("RAG faithfulness dropped below 0.8!")
```

#### Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Mac)                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│  │ Next.js UI │  │ Admin Panel│  │  Docs Mgmt │              │
│  │ (Port 3000)│  │            │  │            │              │
│  └────────────┘  └────────────┘  └────────────┘              │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTP/WebSocket/JWT
┌───────────────────────┴─────────────────────────────────────────┐
│                   FLASK BACKEND (Mac:5000)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ API Layer                                                 │  │
│  │ • Authentication (JWT)                                    │  │
│  │ • Authorization (role-based)                              │  │
│  │ • Rate limiting                                           │  │
│  │ • Request validation                                      │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│  ┌────────────────────────┴─────────────────────────────────┐  │
│  │ RAG Orchestration                                         │  │
│  │ ┌─────────────────────────────────────────────────────┐  │  │
│  │ │ Pre-Retrieval (Layer 8)                             │  │  │
│  │ │ • Query contextualization (conversation history)    │  │  │
│  │ │ • Query expansion                                   │  │  │
│  │ │ • Multi-query generation                            │  │  │
│  │ └─────────────────────────────────────────────────────┘  │  │
│  │ ┌─────────────────────────────────────────────────────┐  │  │
│  │ │ Retrieval (Layers 2-6, 9)                           │  │  │
│  │ │ • Hybrid search (dense + sparse)                    │  │  │
│  │ │ • Graph traversal (optional)                        │  │  │
│  │ │ • Metadata filtering                                │  │  │
│  │ └─────────────────────────────────────────────────────┘  │  │
│  │ ┌─────────────────────────────────────────────────────┐  │  │
│  │ │ Post-Retrieval (Layer 7)                            │  │  │
│  │ │ • Reranking (cross-encoder)                         │  │  │
│  │ │ • Context compression                               │  │  │
│  │ └─────────────────────────────────────────────────────┘  │  │
│  │ ┌─────────────────────────────────────────────────────┐  │  │
│  │ │ Generation                                          │  │  │
│  │ │ • Prompt construction                               │  │  │
│  │ │ • Citation injection                                │  │  │
│  │ │ • Response streaming                                │  │  │
│  │ └─────────────────────────────────────────────────────┘  │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│  ┌────────────────────────┴─────────────────────────────────┐  │
│  │ PostgreSQL (Mac:5432)                                     │  │
│  │ • Users & auth                                            │  │
│  │ • Document metadata                                       │  │
│  │ • Conversation history                                    │  │
│  │ • Feedback & ratings                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ Tailscale VPN (100.64.x.x)
                        │
┌───────────────────────┴─────────────────────────────────────────┐
│                 UBUNTU GPU SERVER (School 24/7)                 │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ML Models (GPU: RTX 4080 16GB)                           │  │
│  │                                                           │  │
│  │  ┌────────────────┐         ┌────────────────┐          │  │
│  │  │ Embedding Srv  │         │     vLLM       │          │  │
│  │  │ (Port 8001)    │         │  (Port 8000)   │          │  │
│  │  │                │         │                │          │  │
│  │  │ Model:         │         │ Models:        │          │  │
│  │  │ nomic-embed-   │         │ • Llama-3-8B   │          │  │
│  │  │ text (400MB)   │         │ • Mistral-7B   │          │  │
│  │  │                │         │ • Qwen-7B      │          │  │
│  │  │ Output:        │         │                │          │  │
│  │  │ 768-dim vector │         │ Speed:         │          │  │
│  │  │                │         │ ~50 tok/sec    │          │  │
│  │  │ Speed:         │         │                │          │  │
│  │  │ 1000 emb/sec   │         │ Features:      │          │  │
│  │  │                │         │ • Streaming    │          │  │
│  │  └────────────────┘         │ • Batching     │          │  │
│  │                              │ • OpenAI API   │          │  │
│  │                              └────────────────┘          │  │
│  │                                                           │  │
│  │  ┌────────────────────────────────────────┐             │  │
│  │  │ Reranker Model (Optional)              │             │  │
│  │  │ • cross-encoder/ms-marco-MiniLM        │             │  │
│  │  │ • Loaded in vLLM process or separate   │             │  │
│  │  └────────────────────────────────────────┘             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Milvus Vector Database (Port 19530)                      │  │
│  │ • Collections: knowledge_base                            │  │
│  │ • Index: HNSW (M=16, ef=200)                            │  │
│  │ • GPU acceleration enabled                               │  │
│  │ • Storage: persistent volume                             │  │
│  │ • Features:                                              │  │
│  │   - Metadata filtering                                   │  │
│  │   - Hybrid search (dense + sparse)                       │  │
│  │   - ACID compliance                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Knowledge Graph (Optional - Layer 9)                     │  │
│  │ • Neo4j or NetworkX                                      │  │
│  │ • Entities: People, Orgs, Products, Concepts             │  │
│  │ • Relations: WORKS_FOR, PART_OF, RELATED_TO              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Document Storage                                         │  │
│  │ ~/thesis-data/documents/                                 │  │
│  │ • Raw files: PDF, DOCX, TXT, MD                          │  │
│  │ • Organized by doc_id                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Monitoring (Prometheus + Grafana)                        │  │
│  │ • Metrics: query latency, retrieval scores, token usage  │  │
│  │ • Alerts: low quality scores, high error rates           │  │
│  │ • GPU monitoring: nvidia-smi integration                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

#### Production Checklist
- ✅ Authentication & authorization
- ✅ Conversation memory
- ✅ Document management (upload, delete, reindex)
- ✅ User feedback collection
- ✅ Monitoring & alerting (Prometheus)
- ✅ Logging (structured logs)
- ✅ Error handling & recovery
- ✅ Rate limiting
- ✅ CORS & security headers
- ✅ Automated evaluation (RAGAS)
- ✅ Backup & disaster recovery

---

## Model Roles Summary

### **1. Embedding Model** (Ubuntu:8001)
**Type**: Bi-encoder (sentence transformer)
**Examples**: nomic-embed-text, bge-large-en-v1.5, e5-mistral
**Size**: 200MB - 2GB
**Role in RAG**: **Pre-retrieval**
- Converts text (queries + documents) into dense vectors
- Enables semantic similarity search
- Runs for: Every document chunk during indexing, every user query

**Key Properties**:
- Fast: 1000+ embeddings/second
- Consistent: Same text → same vector
- Semantic: Similar meaning → similar vectors

**Why Separate**:
- Different architecture than LLM (optimized for similarity, not generation)
- Smaller and faster (can run alongside LLM)
- Needs to be called frequently (every query)

---

### **2. vLLM (LLM Server)** (Ubuntu:8000)
**Type**: Large Language Model (autoregressive transformer)
**Examples**: Llama-3-8B, Mistral-7B, Qwen-7B
**Size**: 4GB - 15GB
**Role in RAG**: **Generation**
- Generates final answer from retrieved context
- Can also be used for query enhancement (pre-retrieval)
- Runs for: Every user query (final generation step)

**Key Properties**:
- Creative: Generates human-like text
- Context-aware: Uses retrieved documents to ground answers
- Configurable: Temperature, top-p, max tokens

**Why vLLM**:
- PagedAttention: Efficient GPU memory (fit larger models)
- Continuous batching: Handle multiple requests
- 10-20x faster than standard inference
- Streaming: Tokens appear as generated

---

### **3. Milvus Vector Database** (Ubuntu:19530)
**Type**: Vector database with ANN indexing
**Not a model**: Storage + search system
**Size**: Depends on data (vectors + metadata)
**Role in RAG**: **Retrieval**
- Stores embeddings from embedding model
- Performs fast similarity search (ANN)
- Filters by metadata

**Key Properties**:
- Scalable: Billions of vectors
- Fast: Sub-second search with HNSW index
- GPU-accelerated: Uses RTX 4080 for search
- Persistent: Data survives restarts
- Hybrid: Supports dense + sparse search

**Indexing Algorithms**:
- HNSW: Fast approximate search (graph-based)
- IVF_FLAT: Quantization-based
- GPU_IVF_PQ: GPU-optimized product quantization

---

### **4. Reranker Model** (Ubuntu - Optional)
**Type**: Cross-encoder (sequence classification)
**Examples**: cross-encoder/ms-marco-MiniLM-L-12-v2, bge-reranker-large
**Size**: 50MB - 500MB
**Role in RAG**: **Post-retrieval**
- Rescores retrieved chunks for better ranking
- More accurate than bi-encoder similarity
- Runs for: Top-10 to top-20 retrieved chunks (not all documents)

**Key Properties**:
- Accurate: Sees query+document together (not separately)
- Slow: ~100 pairs/second (vs 1000+ for embeddings)
- Two-stage: Use after fast retrieval, before generation

**Bi-encoder vs Cross-encoder**:
- Bi-encoder (embedding): Query and doc encoded separately → fast, less accurate
- Cross-encoder (reranker): Query+doc encoded together → slow, more accurate

---

## Deployment Rationale

### **Why Mac (Development)**
- Code editing (VSCode, hot reload)
- Git operations
- Lightweight coordination (Flask orchestrator)
- PostgreSQL (small metadata, not millions of rows)
- BM25 index (in-memory, small)

### **Why Ubuntu GPU Server (Production)**
- GPU-bound operations:
  - Embeddings (benefits from GPU)
  - LLM generation (requires GPU)
  - Vector search (GPU-accelerated)
  - Reranking (benefits from GPU)
- 24/7 availability (documents + services always accessible)
- Document storage (centralized, persistent)
- Heavy I/O (reading documents, writing vectors)

### **Tailscale VPN Connection**
- Secure: Encrypted, authenticated
- Persistent: Always connected
- Dynamic IP tolerant: Works across networks (home WiFi, school, mobile)
- No port exposure: Works through NATs/firewalls
- Low latency: Peer-to-peer when possible

---

## Data Flow: Complete Pipeline

### **Document Upload (One-Time)**
```
1. User uploads PDF (Next.js → Flask)
2. Flask saves to Ubuntu: ~/thesis-data/documents/doc123.pdf
3. Flask extracts text (PyPDF2/pdfplumber)
4. Flask chunks text (512 tokens, 50 overlap) [Layer 3]
5. Flask sends chunks → Ubuntu:8001 (Embedding) [Layer 2]
   ↓ Returns: 768-dim vectors
6. Flask extracts entities/relations → Build graph [Layer 9]
7. Flask stores in Milvus (Ubuntu:19530) [Layer 4]
   ↓ Stores: vector, text, doc_id, metadata
8. Flask saves metadata → PostgreSQL [Layer 10]
   ↓ Document record: filename, path, upload_date, status
9. Response → Next.js: "Document indexed successfully"
```

### **Query (Real-Time)**
```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: PRE-RETRIEVAL (Layer 8)                           │
└─────────────────────────────────────────────────────────────┘
1. User asks: "What's the refund policy?" (Next.js → Flask)
2. Flask loads conversation history (PostgreSQL)
3. Flask contextualizes query (vLLM Ubuntu:8000)
   ↓ "What's the policy?" + history → "What is the refund policy?"
4. Flask expands query (vLLM Ubuntu:8000)
   ↓ "refund policy return exchange money-back"
5. Flask generates alternatives (vLLM Ubuntu:8000)
   ↓ ["What is the refund policy?", "How do returns work?", ...]

┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: RETRIEVAL (Layers 2, 4, 6, 9)                     │
└─────────────────────────────────────────────────────────────┘
6. For each query variant:
   a. Flask embeds query (Ubuntu:8001 Embedding)
      ↓ Returns: 768-dim vector
   b. Flask searches Milvus (Ubuntu:19530)
      ↓ Vector similarity + metadata filter
      ↓ Returns: top-10 chunks with scores
   c. Flask searches BM25 (local)
      ↓ Keyword matching
      ↓ Returns: top-10 chunks with scores
   d. Flask searches graph (if Layer 9)
      ↓ Extract entities, traverse graph
      ↓ Returns: related chunks
7. Flask merges all results (RRF fusion)
   ↓ Deduplicate, combine scores
   ↓ Returns: top-20 candidates

┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: POST-RETRIEVAL (Layer 7)                          │
└─────────────────────────────────────────────────────────────┘
8. Flask reranks with cross-encoder (Ubuntu GPU)
   ↓ Score each (query, chunk) pair
   ↓ Reorder by cross-encoder score
   ↓ Returns: top-5 chunks
9. Flask compresses context
   ↓ Remove redundant sentences
   ↓ Returns: ~500 tokens of high-quality context

┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: GENERATION                                         │
└─────────────────────────────────────────────────────────────┘
10. Flask builds prompt:
    """
    Context:
    [Chunk 1: "Our refund policy allows returns within 30 days..."]
    [Chunk 2: "To process a refund, contact support@..."]

    Question: What is the refund policy?
    Answer based only on the context above. Cite sources.
    """
11. Flask sends to vLLM (Ubuntu:8000)
    ↓ Streams tokens back
12. Flask streams response → Next.js → User sees answer appear

┌─────────────────────────────────────────────────────────────┐
│ PHASE 5: POST-PROCESSING (Layer 10)                        │
└─────────────────────────────────────────────────────────────┘
13. Flask saves conversation (PostgreSQL)
    ↓ query, response, retrieved_chunk_ids, timestamp
14. Flask logs metrics (Prometheus)
    ↓ query_latency, retrieval_score, token_usage
15. User can rate response (feedback loop)
```

---

## Thesis Mapping

### **Phase 300: CITI KMS Baseline Analysis**
**Question**: Which layers does CITI already have?

**Analyze**:
- ✅ Layer 0-2: Basic RAG (LLM + embedding + retrieval)
- ✅ Layer 3: Chunking strategy
- ✅ Layer 4: Milvus + vLLM (production infrastructure)
- ❓ Layer 5: Metadata filtering (check)
- ❓ Layer 6: Hybrid search (likely missing)
- ❓ Layer 7: Reranking (likely missing)
- ❓ Layer 8: Query enhancement (likely basic)
- ❓ Layer 9: Graph (LightRAG repo exists - check integration)
- ✅ Layer 10: Production features (auth, UI, etc.)

**Deliverables**:
- Map CITI architecture to layers
- Identify optimization opportunities
- Baseline performance metrics (RAGAS)

---

### **Phase 400: Optimization Implementation**
**Question**: How can we improve each RAG stage?

**Potential Optimizations** (pick 3-5):
1. **Hybrid search** (Layer 6): Implement BM25 + vector fusion
2. **Reranking** (Layer 7): Add cross-encoder rescoring
3. **Query enhancement** (Layer 8): Multi-query + expansion
4. **Chunking strategies** (Layer 3): Compare fixed vs semantic vs section-based
5. **Graph integration** (Layer 9): Evaluate LightRAG impact
6. **Context compression** (Layer 7): Test compression algorithms

**For each optimization**:
- Implement
- Measure impact (RAGAS: faithfulness, relevancy, precision)
- Compare to baseline
- Document findings

---

### **Phase 600: Evaluation**
**Question**: Do optimizations actually help?

**Evaluation Framework**:
- **Metrics**: RAGAS (faithfulness, answer_relevancy, context_precision)
- **Test set**: Curated Q&A pairs with ground truth
- **Ablation study**: Test each optimization individually + combined
- **Performance**: Latency, throughput, token usage

**Comparison Matrix**:
| Configuration | Faithfulness | Relevancy | Precision | Latency (ms) |
|---------------|--------------|-----------|-----------|--------------|
| Baseline (CITI) | 0.75 | 0.70 | 0.65 | 1200 |
| + Hybrid search | 0.78 | 0.73 | 0.70 | 1400 |
| + Reranking | 0.82 | 0.76 | 0.75 | 1600 |
| + Query enhance | 0.85 | 0.80 | 0.78 | 1800 |
| All optimizations | 0.88 | 0.83 | 0.80 | 2000 |

---

## Summary: Evolution at a Glance

| Layer | Core Addition | Models/Services Added | Deployment | RAG Stage | Key Benefit |
|-------|---------------|----------------------|------------|-----------|-------------|
| **0** | Basic LLM | LLM (API/local) | External/Mac | Generation | Natural language interface |
| **1** | Document context | Document storage | Mac/Ubuntu | - | Grounded answers |
| **2** | Vector search | Embedding model, Vector store (in-memory) | Ubuntu:8001, Mac | Pre-retrieval + Retrieval | Semantic search |
| **3** | Chunking | Chunking logic | Mac | Pre-processing | Better embeddings |
| **4** | Production infra | vLLM, Milvus | Ubuntu:8000, Ubuntu:19530 | Generation + Retrieval | Scale + speed |
| **5** | Metadata | Metadata schema | Ubuntu (Milvus) | Retrieval | Filtered search |
| **6** | Hybrid search | BM25 index | Mac/Ubuntu | Retrieval | Exact + semantic |
| **7** | Post-retrieval | Reranker model (optional) | Ubuntu | Post-retrieval | Precision + compression |
| **8** | Pre-retrieval | Query rewriter | Ubuntu (vLLM) | Pre-retrieval | Query quality |
| **9** | Graph | Knowledge graph | Ubuntu/Mac | Retrieval | Relational reasoning |
| **10** | Production | Auth, PostgreSQL, monitoring | Mac + Ubuntu | - | Real deployment |

---

## Key Takeaways

1. **Models are deployed strategically**:
   - GPU-bound (embedding, vLLM, reranker) → Ubuntu
   - Lightweight (Flask, PostgreSQL, BM25) → Mac

2. **RAG is a pipeline, not a single step**:
   - Pre-retrieval: Enhance query quality
   - Retrieval: Find relevant information
   - Post-retrieval: Refine results
   - Generation: Produce answer

3. **Each layer solves specific problems**:
   - Don't implement all layers if not needed
   - Evaluate impact of each optimization

4. **Thesis focus**: Systematic evaluation of optimization strategies across all three RAG stages

---

**Document Status**: Complete architectural evolution from simple chatbot to production KMS with modern RAG pipeline.

**Next Steps for Thesis**:
1. Map CITI KMS to these layers (Phase 300)
2. Identify missing optimizations (Phase 300)
3. Implement selected optimizations (Phase 400)
4. Evaluate with RAGAS (Phase 600)
5. Write findings (Phase 800)
