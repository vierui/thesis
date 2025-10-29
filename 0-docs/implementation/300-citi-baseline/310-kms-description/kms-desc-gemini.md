Based on the source tree and flowchart, I've synthesized the following analysis of your `2-citi-kms` project.

It's a comprehensive, full-stack **Retrieval-Augmented Generation (RAG)** knowledge management system, built using a poly-repo architecture. The system is designed to ingest documents, process them into a searchable knowledge base, and provide a chat interface for users to query that knowledge.

Here’s a breakdown of the components and the data flow.

### 🏛️ System Architecture & Components

The project is divided into several distinct applications:

- **`llm-rag-citi` (The Core Backend):** This is a **Python/Flask** API that serves as the system's brain. It implements the entire RAG pipeline described in your flowchart, including document processing, query handling, interfacing with the vector DB, and calling the LLM. This is the service identified as `llm-rag-citi Flask API` in the chart.
    
- **`front-end` (User Interface):** A **Next.js (React/TypeScript)** application. This is the primary chat interface (`U1` and `FE` in the chart) where users submit queries and receive streaming responses. It interacts with the `llm-rag-citi` backend.
    
- **`admin-interface` (Admin Dashboard):** A separate **Next.js (React/TypeScript)** application. This is the control panel (`U2` and `ADMIN_DASH`) for administrators to manage documents, users, and monitor system performance by visualizing the RAGAS evaluation metrics.
    
- **`ragas-local-implementation` (Evaluation Module):** A standalone **Python** project. As per the flowchart, this is triggered asynchronously by the backend to evaluate the quality of the RAG system's answers using metrics like `Faithfulness` and `Answer Relevancy`.
    
- **`LightRAG-Implementation` (RAG Framework):** This appears to be a separate, highly-featured Python RAG framework, complete with its own API, extensive examples, and connectors for numerous LLMs and databases (Neo4j, Milvus, Mongo, etc.). It doesn't seem to be the _primary_ API server in the main flow (that's `llm-rag-citi`), but it could be a foundational library, a reference implementation, or a parallel, more advanced experiment.
    

---

### 🔄 Data & Processing Flow (The RAG Pipeline)

The flowchart details the logic implemented primarily within the **`llm-rag-citi`** application.

#### 1. Ingestion (Knowledge Capture)

- **Trigger:** An admin or user uploads a document (PDF, DOC, etc.) via the `admin-interface` or `front-end`.
    
- **Processing:** The `llm-rag-citi` API receives the file.
    
    1. **Text Extraction:** Uses `MinERU/PyPDF` to get raw text.
        
    2. **Chunking:** Employs `RecursiveCharacterTextSplitter` to break the text into manageable chunks.
        
    3. **Embedding:** Calls an external **Embedding API** (specified as `BGE-M3`) to generate both **dense** (1024-dim) and **sparse** (BM25-style) vectors for hybrid search.
        
- **Storage:**
    
    - **Vector DB:** The dense and sparse embeddings are stored in **Milvus**. The system maintains separate collections for public (shared) and private (user-specific) documents.
        
    - **Relational DB:** **PostgreSQL** is used to store all metadata. The Next.js apps (`front-end` and `admin-interface`) use **Prisma** as an ORM to interact with tables like `User`, `Document`, `ChatBox`, and `Message`.
        

#### 2. Retrieval & Generation (Query Pipeline)

- **Trigger:** A user sends a query from the `front-end` chat interface.
    
- **Processing (`llm-rag-citi` API):**
    
    1. **Queueing:** The request is first placed in a queue with a `Semaphore (max=2)` to manage concurrency.
        
    2. **Query Expansion (Optional):** The system checks if **HyDE** (Hypothetical Document Embeddings) mode is active. If yes, it first asks an LLM to generate a hypothetical answer to the query, and _that_ answer is embedded to find more relevant documents.
        
    3. **Vector Search:** It performs a **hybrid search** in Milvus using the query's vectors (either direct or from HyDE) to retrieve the top-K relevant chunks from both public and private collections.
        
    4. **Reranking (Optional):** The retrieved chunks can be passed to a **cross-encoder reranker model** to improve the relevance of the top results (e.g., re-ranking to a final Top-5).
        
    5. **Context & Prompting:** The final, reranked chunks are formatted into a context, which is combined with the system prompt and conversation history.
        
    6. **LLM Generation:** This final prompt is sent to an external, **OpenAI-compatible Generation LLM**.
        
    7. **Streaming Response:** The system is configured for streaming. It sends the response back to the `front-end` token-by-token using **Server-Sent Events (SSE)**, which allows the chat UI to display the answer as it's being generated.
        

---

### 📊 Evaluation & Scope

- **Asynchronous Evaluation:** After a non-streaming response is generated, the backend triggers the `ragas-local-implementation` in a background thread. This script runs the RAGAS evaluation (using the question, answer, and retrieved contexts) and writes the resulting metrics (`Faithfulness`, etc.) back to the `PostgreSQL` database.
    
- **Monitoring:** The `admin-interface` reads these metrics from Postgres and displays them on a dashboard, allowing for continuous monitoring of the system's performance.
    
- **System Scope:** As noted in the flowchart, this project is an **AI _application_ and integrator**. It consumes external, pre-trained models as "black box" services (for embedding, HyDE, and generation). It does not perform any foundational model training, fine-tuning, or low-level operations like quantization itself.
    

This looks like a robust and well-architected system. Let me know what engineering task you'd like my help with.