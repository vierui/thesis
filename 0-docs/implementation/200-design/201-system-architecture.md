# System Architecture Overview
This is a Knowledge Management System (KMS) built for CITI that enables document-based question answering using RAG (Retrieval-Augmented Generation) technology.

## Repository Roles

### 1. llm-rag-citi (Python/Flask Backend)
Role: Core RAG engine and document processing service Key Responsibilities:
Document ingestion, chunking, and embedding (hybrid: dense + sparse vectors)
Vector database management (Milvus with public/private collections)
LLM integration for question answering with streaming responses
HyDE query expansion and result reranking
Mind map generation from documents
Text-to-speech and podcast generation
RAG evaluation using RAGAS framework
Technology: Flask, PyMilvus, LlamaIndex, LangChain Port: 5000 Storage: Milvus vector database

### 2. front-end (Next.js User Interface)
Role: Primary user-facing application Key Responsibilities:
Document upload and management interface
Interactive chat interface with LLM (streaming responses)
RAG-powered Q&A with source document tracking
Mind map visualization
User authentication (Clerk)
Conversation history and session management
Response evaluation (like/dislike, RAGAS metrics)
Interactive notebook/studio for multi-panel analysis
Technology: Next.js 15, React 19, Prisma, PostgreSQL Port: 3000 (default) Users: End users (students, researchers, employees)

### 3. admin-interface (Next.js Admin Dashboard)
Role: Administrative management and monitoring Key Responsibilities:
System performance monitoring (response times, metrics)
User management (view, search, delete users)
Document management (bulk operations, metadata editing)
Analytics dashboard (usage statistics, ratings)
Resource monitoring (CPU, memory, network)
Direct database access for administrative tasks
Technology: Next.js 14, Prisma, NextAuth Port: 3000 (separate deployment) Users: System administrators

### 4. LightRAG-Implementation
Role: Alternative/experimental RAG implementation Key Responsibilities:
Graph-based RAG using knowledge graphs
Multiple search modes (local, global, hybrid, naive, mix)
Entity and relationship extraction
Support for Neo4j, PostgreSQL, Oracle databases
Graph visualization capabilities
API server for LightRAG operations
Technology: Python, NetworkX/Neo4j, FastAPI Status: Appears to be a research/experimental component Note: This is a fork/implementation of the LightRAG research project

### 5. ragas-local-implementation
Role: Evaluation framework for RAG systems Key Responsibilities:
Generate test datasets for RAG evaluation
Evaluate RAG responses against reference answers
Compute metrics (faithfulness, relevance, context precision)
Provide evaluation results to main application
Technology: Python, RAGAS library Integration: Used by llm-rag-citi for quality assessment

## System Interactions
┌──────────────┐
│   End Users  │
└──────┬───────┘
       │
       v
┌──────────────────────────────────┐
│       front-end (Next.js)        │
│  - Chat UI                       │
│  - Document Upload               │
│  - User Profile                  │
└─────┬───────────────┬────────────┘
      │               │
      │               └────────────────┐
      v                                v
┌─────────────┐              ┌──────────────────┐
│ PostgreSQL  │              │ QNAP NAS (SFTP)  │
│  Database   │              │ - Public docs    │
│ - Users     │              │ - Private docs   │
│ - Chats     │              └──────────────────┘
│ - Messages  │
│ - Documents │
└─────────────┘
      │
      v
┌────────────────────────────────────────┐
│    llm-rag-citi (Flask Backend)        │
│  - Document parsing & chunking         │
│  - Embedding generation                │
│  - Vector search (hybrid)              │
│  - LLM chat with streaming             │
│  - Mind map generation                 │
│  - TTS/Podcast generation              │
└─────┬──────────────┬──────────────────┘
      │              │
      v              v
┌─────────┐    ┌──────────────┐
│ Milvus  │    │  LLM Models  │
│ Vector  │    │  - Main LLM  │
│   DB    │    │  - HyDE LLM  │
│         │    │  - Embedding │
└─────────┘    └──────────────┘


┌──────────────┐
│    Admins    │
└──────┬───────┘
       │
       v
┌──────────────────────────────────┐
│  admin-interface (Next.js)       │
│  - User Management               │
│  - Document Management           │
│  - System Analytics              │
│  - Resource Monitoring           │
└─────┬────────────────┬───────────┘
      │                │
      v                v
[Same PostgreSQL]  [Same QNAP NAS]
      +                +
[llm-rag-citi API] [Docker Stats]

## Data Flow Example: User Asks a Question
1. User types question in front-end chat interface
2. Front-end sends request to /api/prompt → calls llm-rag-citi /llm/chat_with_llm
3. llm-rag-citi processes:
      Optionally applies HyDE to expand query
      Generates embeddings (dense + sparse)
      Searches Milvus vector DB for relevant chunks
      Optionally reranks results
      Sends context + question to LLM
      Streams response back via SSE
4. Front-end displays:
      Streamed answer in real-time
      Retrieved source documents
      Option to rate response
5. Evaluation (optional): RAGAS metrics calculated and stored in PostgreSQL

## Shared Resources
PostgreSQL Database - Shared by front-end and admin-interface
QNAP NAS (SFTP) - Document storage accessed by both interfaces and backend
llm-rag-citi Backend - Shared API for RAG operations
Milvus Vector DB - Managed exclusively by llm-rag-citi

## Key Technologies Summary
Component	Framework	Language	Database	Auth
llm-rag-citi	Flask	Python	Milvus	None (API)
front-end	Next.js 15	TypeScript	PostgreSQL	Clerk
admin-interface	Next.js 14	TypeScript	PostgreSQL	NextAuth
LightRAG	FastAPI	Python	Neo4j/PostgreSQL	N/A
ragas-local	-	Python	-	N/A
This is a microservices architecture where specialized services handle different concerns: document intelligence (llm-rag-citi), user experience (front-end), and administration (admin-interface), all coordinated through shared data stores and APIs.
---