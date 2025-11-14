Based on my exploration of the CITI KMS codebase, here's a comprehensive overview of all models used in the system:

# Models in CITI KMS

  1. Main LLM (Language Model)

  - Model: YannQi/R-4B (4B parameter model)
  - Location: 2-citi-kms/infra/vlm-model/docker-compose.yml:16
  - Infrastructure: vLLM server on Ubuntu GPU (port 8000)
  - Usage: Question answering, RAG generation, mindmap generation, title generation

  2. Embedding Model

  - Model: bge-m3 (BAAI/bge-m3)
  - Location: 2-citi-kms/llm-rag-citi/app/main/util/embedding.py:8
  - Features:
    - Dual-mode: Dense + Sparse embeddings
    - Supports hybrid search
    - Custom API wrapper for embedding server
  - Usage: Document and query embedding for retrieval

  3. Reranking

  - Primary: vLLM semantic ranker (model-based)
  - Location: 2-citi-kms/llm-rag-citi/app/main/util/document.py:200-213
  - Fallback: WeightedRanker (0.5 dense, 0.5 sparse weights)
  - Usage: Reranking retrieved documents for better relevance

  4. TTS (Text-to-Speech)

  - Model: tts-1 (OpenAI-compatible)
  - Location: 2-citi-kms/llm-rag-citi/app/main/constant/tts.py:19
  - Usage: Podcast generation, audio synthesis

  5. LightRAG Implementation (Alternative RAG system)

  - LLM: solar-mini (Upstage API)
  - Embedding: solar-embedding-1-large-query (4096 dimensions)
  - Location: 2-citi-kms/LightRAG-Implementation/reproduce/Step_1_openai_compatible.py

  6. RAGAS Evaluation Framework

  - LLM: Configurable (uses same endpoint as main LLM)
  - Embedding: SentenceTransformer models (configurable)
  - Location: 2-citi-kms/ragas-local-implementation/evaluation.py
  - Usage: RAG evaluation metrics (faithfulness, context recall, etc.)

  Summary

  Total distinct model types: 4-5
  - 1 main LLM (R-4B)
  - 1 embedding model (bge-m3)
  - 1 reranking model (via vLLM)
  - 1 TTS model
  - Alternative models for LightRAG (solar-mini + solar-embedding)