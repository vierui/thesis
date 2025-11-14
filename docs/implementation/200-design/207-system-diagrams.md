# CITI KMS System Diagrams

**Document Purpose**: Visual diagrams for demonstrating the distributed RAG architecture and workflows.

**Date**: 2025-01-10
**Phase**: 200 - Design & Architecture

---

## Diagram 1: System Architecture - Node Distribution

```
┌─────────────────────────────────────────────────────────────────┐
│                    CITI KMS Architecture                        │
│                  (Distributed Multi-Node RAG)                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   Mac (Local)    │
│  ────────────    │
│  Orchestrator    │
│                  │
│  • Flask API     │
│    (port 5000)   │
│  • Next.js UI    │
│    (port 3000)   │
│  • PostgreSQL    │
│    (port 5432)   │
│                  │
│  Role:           │
│  Coordination    │
│  & UI            │
└────────┬─────────┘
         │
         │ Tailscale VPN Mesh
         │
    ┌────┼────┬────────┬────────┐
    │    │    │        │        │
    ↓    ↓    ↓        ↓        ↓
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Node 1 │ │ Node 2 │ │ Node 3 │ │ Node 4 │
│────────│ │────────│ │────────│ │────────│
│        │ │        │ │        │ │        │
│ vLLM   │ │LocalAI │ │BGE-M3  │ │Milvus  │
│        │ │        │ │Embed   │ │VectorDB│
│Port    │ │Port    │ │Port    │ │Port    │
│8000    │ │8080    │ │1234    │ │19530   │
│        │ │        │ │        │ │        │
│Model:  │ │Model:  │ │Model:  │ │Storage:│
│YannQi/ │ │Gemma3- │ │BAAI/   │ │etcd +  │
│R-4B    │ │4b-qat  │ │bge-m3  │ │MinIO   │
│(4B)    │ │(4B)    │ │(hybrid)│ │        │
│        │ │        │ │        │ │        │
│GPU     │ │GPU     │ │GPU     │ │No GPU  │
│NVIDIA  │ │NVIDIA  │ │NVIDIA  │ │        │
│        │ │        │ │        │ │        │
│Role:   │ │Role:   │ │Role:   │ │Role:   │
│Answer  │ │HyDE    │ │Text→   │ │Vector  │
│Gen     │ │Gen     │ │Vector  │ │Search  │
└────────┘ └────────┘ └────────┘ └────────┘
```

**Key Details:**
- **5 Machines** total (1 Mac + 4 GPU nodes)
- **4 GPU Nodes** running model services
- **Tailscale VPN** connecting all nodes
- **Mac orchestrates** all remote service calls
- **Prototype environment** - full SSH/sudo access

---

## Diagram 2: Data Flow - Document Ingestion Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│              DOCUMENT INGESTION WORKFLOW                         │
└──────────────────────────────────────────────────────────────────┘

┌─────────────┐
│ 1. User     │
│ Upload PDF  │
└──────┬──────┘
       │
       ↓ HTTP POST
┌─────────────────────┐
│ 2. Next.js UI       │ (Mac:3000)
│ Frontend            │
└──────┬──────────────┘
       │
       ↓ HTTP POST /upload
┌─────────────────────────────────────────┐
│ 3. Flask API                            │ (Mac:5000)
│ • Save PDF to storage                   │
│ • Extract text (PyPDF/MinerU)           │
│ • Chunk text (512 tokens, 50 overlap)   │
└──────┬──────────────────────────────────┘
       │
       ↓ HTTP POST /embed (for each chunk)
┌─────────────────────────────────────────┐
│ 4. BGE-M3 Embedding Service             │ (Node 3:1234)
│ • Receives chunk text                   │
│ • Generates 1024-dim dense vector       │
│ • Returns embedding                     │
└──────┬──────────────────────────────────┘
       │
       ↓ Embedding vector (1024-dim)
┌─────────────────────────────────────────┐
│ 5. Flask API (continues)                │ (Mac:5000)
│ • Collects all chunk embeddings         │
│ • Prepares metadata (doc_id, page, etc) │
└──────┬──────────────────────────────────┘
       │
       ↓ Insert vectors + metadata
┌─────────────────────────────────────────┐
│ 6. Milvus Vector Database               │ (Node 4:19530)
│ • Stores vectors in HNSW index          │
│ • Stores chunk text + metadata          │
│ • Makes data searchable                 │
└─────────────────────────────────────────┘

Result: Document indexed and ready for retrieval
```

**Ingestion Summary:**
- **Input:** PDF document
- **Processing:** Mac (chunking, coordination)
- **Embedding:** Node 3 (GPU-accelerated)
- **Storage:** Node 4 (persistent vector DB)
- **Metadata:** Mac PostgreSQL

---

## Diagram 3: Data Flow - Query & Answer Generation Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│           QUERY & ANSWER GENERATION WORKFLOW                     │
└──────────────────────────────────────────────────────────────────┘

┌─────────────┐
│ 1. User     │
│ Asks Query  │
└──────┬──────┘
       │
       ↓ HTTP POST
┌─────────────────────┐
│ 2. Next.js UI       │ (Mac:3000)
│ Chat Interface      │
└──────┬──────────────┘
       │
       ↓ HTTP POST /query
┌─────────────────────────────────────────┐
│ 3. Flask API                            │ (Mac:5000)
│ • Receives user question                │
│ • Loads conversation history (optional) │
└──────┬──────────────────────────────────┘
       │
       ↓ HTTP POST /embed (query text)
┌─────────────────────────────────────────┐
│ 4. BGE-M3 Embedding Service             │ (Node 3:1234)
│ • Embeds user query                     │
│ • Returns 1024-dim vector               │
└──────┬──────────────────────────────────┘
       │
       ↓ Query embedding
┌─────────────────────────────────────────┐
│ 5. Flask API (continues)                │ (Mac:5000)
│ • Sends query vector to Milvus          │
└──────┬──────────────────────────────────┘
       │
       ↓ Vector similarity search
┌─────────────────────────────────────────┐
│ 6. Milvus Vector Database               │ (Node 4:19530)
│ • Performs HNSW similarity search       │
│ • Returns top-k most relevant chunks    │
│ • Includes chunk text + metadata        │
└──────┬──────────────────────────────────┘
       │
       ↓ Retrieved chunks (top-5)
┌─────────────────────────────────────────┐
│ 7. Flask API (continues)                │ (Mac:5000)
│ • Builds prompt:                        │
│   Context: [retrieved chunks]           │
│   Question: [user query]                │
│   Instructions: Answer based on context │
└──────┬──────────────────────────────────┘
       │
       ↓ HTTP POST /v1/completions (streaming)
┌─────────────────────────────────────────┐
│ 8. vLLM Inference Server                │ (Node 1:8000)
│ • Model: YannQi/R-4B (4B params)        │
│ • Generates answer from context         │
│ • Streams tokens back                   │
└──────┬──────────────────────────────────┘
       │
       ↓ Streamed tokens
┌─────────────────────────────────────────┐
│ 9. Flask API (continues)                │ (Mac:5000)
│ • Streams tokens to frontend            │
│ • Logs conversation to PostgreSQL       │
└──────┬──────────────────────────────────┘
       │
       ↓ Server-Sent Events (SSE)
┌─────────────────────┐
│ 10. Next.js UI      │ (Mac:3000)
│ • Displays answer   │
│ • Shows sources     │
└─────────────────────┘

Result: User sees answer with source citations
```

**Query Summary:**
- **Embedding:** Node 3 (query → vector)
- **Retrieval:** Node 4 (vector search → relevant chunks)
- **Generation:** Node 1 (context + query → answer)
- **Orchestration:** Mac Flask (coordinates all steps)

---

## Diagram 4: RAG Stack Components (Simplified)

```
┌───────────────────────────────────────────────────────────┐
│                     RAG STACK LAYERS                      │
└───────────────────────────────────────────────────────────┘

Layer 1: USER INTERFACE
┌─────────────────────────────────────────┐
│ Next.js Frontend (Mac:3000)             │
│ • Chat UI                               │
│ • Document upload                       │
│ • Source display                        │
└─────────────────┬───────────────────────┘
                  │
                  ↓
Layer 2: ORCHESTRATION
┌─────────────────────────────────────────┐
│ Flask Backend (Mac:5000)                │
│ • API routing                           │
│ • Request coordination                  │
│ • Prompt construction                   │
│ • Response streaming                    │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
        ↓         ↓         ↓
Layer 3: ML SERVICES (GPU Nodes)
┌──────────┐ ┌──────────┐ ┌──────────┐
│ BGE-M3   │ │ Milvus   │ │  vLLM    │
│ Node 3   │ │ Node 4   │ │  Node 1  │
│ :1234    │ │ :19530   │ │  :8000   │
│          │ │          │ │          │
│Text →    │ │Vector    │ │Context → │
│Vector    │ │Search    │ │Answer    │
└──────────┘ └──────────┘ └──────────┘
Embedding    Retrieval    Generation

Layer 4: STORAGE
┌──────────────┐ ┌──────────────┐
│ PostgreSQL   │ │ Milvus       │
│ (Mac:5432)   │ │ (Node 4)     │
│              │ │              │
│ Metadata     │ │ Vectors      │
│ Users        │ │ Chunks       │
│ Conversations│ │ Embeddings   │
└──────────────┘ └──────────────┘
```

**Stack Summary:**
- **UI Layer:** Next.js (Mac)
- **API Layer:** Flask (Mac)
- **ML Layer:** BGE-M3, Milvus, vLLM (Nodes 1, 3, 4)
- **Storage Layer:** PostgreSQL (Mac), Milvus (Node 4)

---

## Diagram 5: Service Communication Pattern

```
┌──────────────────────────────────────────────────────────┐
│          SERVICE COMMUNICATION PATTERN                   │
│              (Tailscale VPN Mesh)                        │
└──────────────────────────────────────────────────────────┘

                     Mac (Orchestrator)
                  ┌──────────────────┐
                  │  Flask Backend   │
                  │   (Port 5000)    │
                  └────────┬─────────┘
                           │
                           │ Orchestrates all calls
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ↓                  ↓                  ↓
   HTTP POST          HTTP POST          HTTP POST
   /embed             search()           /v1/completions
        │                  │                  │
        ↓                  ↓                  ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Node 3     │  │   Node 4     │  │   Node 1     │
│  BGE-M3      │  │   Milvus     │  │    vLLM      │
│  :1234       │  │   :19530     │  │    :8000     │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ Input:       │  │ Input:       │  │ Input:       │
│ • Text       │  │ • Vector     │  │ • Prompt     │
│              │  │ • Filters    │  │ • Context    │
│ Output:      │  │              │  │              │
│ • Embedding  │  │ Output:      │  │ Output:      │
│   (1024-dim) │  │ • Top-k docs │  │ • Tokens     │
│              │  │ • Scores     │  │   (streamed) │
└──────────────┘  └──────────────┘  └──────────────┘

Connection: All nodes connected via Tailscale VPN
Protocol: HTTP/HTTPS (OpenAI-compatible APIs where applicable)
Authentication: API keys, Tailscale network ACLs
```

**Communication Summary:**
- **Pattern:** Orchestrator-centric (Mac Flask coordinates)
- **Protocol:** HTTP REST APIs
- **Network:** Tailscale VPN mesh
- **Direction:** Mac initiates all calls to nodes
- **Responses:** Nodes respond directly to Mac

---

## Diagram 6: Technology Stack Overview

```
┌────────────────────────────────────────────────────────────┐
│                 TECHNOLOGY STACK                           │
└────────────────────────────────────────────────────────────┘

FRONTEND (Mac)
├─ Framework: Next.js 15 (React 19)
├─ UI: Radix UI + Tailwind CSS
├─ State: Zustand
├─ Auth: Clerk
└─ API Client: Fetch + SSE

BACKEND (Mac)
├─ Framework: Flask + Flask-CORS
├─ ORM: SQLAlchemy (Prisma alternative)
├─ Database: PostgreSQL 17
├─ LLM Integration: LlamaIndex
└─ Vector Client: PyMilvus

EMBEDDING SERVICE (Node 3)
├─ Model: BAAI/bge-m3
├─ Output: 1024-dim dense + sparse + ColBERT
├─ API: FastAPI
├─ GPU: NVIDIA CUDA
└─ Container: Docker

VECTOR DATABASE (Node 4)
├─ Database: Milvus v2.6.4
├─ Index: HNSW (M=16, ef=200)
├─ Metadata Store: etcd
├─ Object Storage: MinIO
└─ Container: Docker Compose

LLM INFERENCE (Node 1)
├─ Server: vLLM (OpenAI-compatible)
├─ Model: YannQi/R-4B (4B params)
├─ Features: PagedAttention, streaming, batching
├─ GPU: NVIDIA CUDA
└─ Container: Docker

ALTERNATIVE LLM (Node 2)
├─ Server: LocalAI
├─ Model: Gemma3-4b-qat (quantized)
├─ Use Case: HyDE generation
├─ GPU: NVIDIA CUDA
└─ Container: Docker

INFRASTRUCTURE
├─ Networking: Tailscale VPN mesh
├─ Orchestration: Docker + Docker Compose
├─ Deployment: Manual (SSH + docker commands)
├─ Monitoring: Logs (docker logs)
└─ Access: SSH with sudo on all nodes
```

---

## Quick Reference: Service Endpoints

| Service | Node | Port | Endpoint Example | Purpose |
|---------|------|------|------------------|---------|
| Next.js | Mac | 3000 | `http://localhost:3000` | User interface |
| Flask API | Mac | 5000 | `http://localhost:5000/query` | RAG orchestration |
| PostgreSQL | Mac | 5432 | `postgresql://localhost:5432/db` | Metadata storage |
| BGE-M3 | Node 3 | 1234 | `http://<node3-ip>:1234/embed` | Text embedding |
| Milvus | Node 4 | 19530 | `http://<node4-ip>:19530` | Vector search |
| Milvus Health | Node 4 | 9091 | `http://<node4-ip>:9091/healthz` | Health check |
| MinIO | Node 4 | 9000 | `http://<node4-ip>:9000` | Object storage |
| vLLM | Node 1 | 8000 | `http://<node1-ip>:8000/v1/completions` | LLM generation |
| LocalAI | Node 2 | 8080 | `http://<node2-ip>:8080/v1/completions` | HyDE/alt LLM |

---

## Deployment Summary

**Total Machines:** 5 (1 Mac + 4 GPU nodes)
**Total GPU Services:** 3 (BGE-M3, vLLM, LocalAI)
**Connection:** Tailscale VPN mesh (encrypted, peer-to-peer)
**Environment:** Prototype (no active users, full control)
**Access:** SSH with sudo on all nodes
**Deployment:** Docker + Docker Compose (manual)

**Models:**
- **Embedding:** BAAI/bge-m3 (hybrid: dense 1024-dim + sparse + ColBERT)
- **LLM Primary:** YannQi/R-4B (4B parameters, vLLM)
- **LLM Secondary:** Gemma3-4b-qat (4B parameters, quantized, LocalAI)

**Key Features:**
- Distributed GPU nodes (no resource contention)
- OpenAI-compatible APIs (easy model swapping)
- Hybrid embeddings (dense + sparse)
- Persistent vector storage (Milvus + MinIO)
- Streaming responses (SSE)
- Full observability (docker logs, SSH access)

---

**Document Status:** Complete system diagrams for architecture documentation and presentations.

**Usage:**
- Thesis presentations
- Architecture documentation
- System design discussions
- Onboarding new team members
