# Repo Overview
The system is a full-stack knowledge management solution with graph-based RAG capabilities, dual interfaces (user + admin), vector + graph storage, and built-in quality evaluation.

```
[Users] → [front-end] ─┐
                       ├→ [llm-rag-citi API] ← [Milvus Vector DB]
[Admins] → [admin-interface] ─┘          ↓
                                   [LightRAG Engine] ← [Neo4J/PostgreSQL Graph DB]
                                          ↓
                                      [LLM Services]
                                          
[ragas-local-implementation] → Evaluation & Testing Loop
```

The system is a full-stack knowledge management solution with graph-based RAG capabilities, dual interfaces (user + admin), vector + graph storage, and built-in quality evaluation.

### **1. [LightRAG-Implementation/](https://github.com/CITI-KnowledgeManagementSystem/LightRAG-Implementation.git)**

**Role:** Core RAG (Retrieval-Augmented Generation) engine  
**Architecture Position:** Backend - Knowledge Graph & Vector Search Layer

A Python-based implementation of LightRAG, a fast retrieval-augmented generation system that uses knowledge graphs combined with vector search. It supports multiple query modes (naive, local, global, hybrid, mix) and can work with various LLM providers (OpenAI, Ollama, HuggingFace). Includes database support (Neo4J, PostgreSQL) and features for entity extraction, graph storage, and document insertion.

---
### **2. [front-end/](https://github.com/CITI-KnowledgeManagementSystem/front-end.git)**

**Role:** User-facing web interface  
**Architecture Position:** Frontend - End User Layer

Next.js application with TypeScript, Prisma ORM, and Tailwind CSS. This is the main user interface where users interact with the knowledge management system to submit queries, view results, and manage documents. Connects to the backend RAG services.

---
### **3. [llm-rag-citi/](https://github.com/CITI-KnowledgeManagementSystem/llm-rag-citi.git)**

**Role:** RAG orchestration & API layer  
**Architecture Position:** Backend - API Gateway & Vector Database Integration
 
Python Flask application that serves as the main backend API, integrating with Milvus vector database for document storage/retrieval and connecting to LLM endpoints. Handles document processing, embedding generation, and query orchestration between the frontend and the LightRAG engine.

---
### **4. [admin-interface/](https://github.com/CITI-KnowledgeManagementSystem/admin-interface.git)**

**Role:** Administrative dashboard  
**Architecture Position:** Frontend - Admin Management Layer

Another Next.js application (with Prisma) providing administrative capabilities for managing the system - likely for document management, user management, system configuration, and monitoring. Separate from the main user interface.

---
### **5. [ragas-local-implementation/](https://github.com/CITI-KnowledgeManagementSystem/ragas-local-implementation.git)**

**Role:** Evaluation & testing framework  
**Architecture Position:** Quality Assurance Layer

Python implementation using RAGAS (Retrieval-Augmented Generation Assessment) for generating test datasets and evaluating RAG system performance. Creates test queries, references, and contexts, then measures response quality against references for continuous system improvement.

---
