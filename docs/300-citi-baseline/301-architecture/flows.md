# 1. QUERY/CHAT FLOW ✅

Endpoint: POST /llm/chat_with_llm

Flow: 

User question → [Optional HyDE] → Embedding → Milvus retrieval → [Optional reranking] → Context formatting → LLM streaming → SSE response

Data Flow:

  [Frontend] → [Flask API] → [Milvus VectorDB] → [LLM Server]
       ↓            ↓              ↓                  ↓
    Mac 3000    Mac 5000    Ubuntu 19530      Ubuntu 8000

---
# 2. DOCUMENT INGESTION FLOW

Endpoint: POST /document/insert

Input:
- document_id - UUID identifier
- user_id - Owner
- tag - File extension (pdf, docx, csv, etc.)
- collection_name - 'private' or 'public'
- original_filename - Display name
- change - Boolean (move between collections?)
- parser - 'pymu' or 'mineru' or 'docling'

Flow:
1. Frontend uploads file → PostgreSQL metadata stored
2. File stored on SFTP server (Ubuntu ~/thesis-data/documents/)
3. Backend receives insert request

4. SFTP Retrieval:
   - Connect to SFTP (paramiko SSH client)
   - Download from remote path to local DOCUMENT_DIR
   - Path: {PRIVATE|PUBLIC}/{user_id}/{document_id}.{tag}

5. Document Parsing (parser-dependent):
   - PyMuPDF: Standard PDF parsing
   - Docling: Advanced PDF with layout analysis
   - MinerU: High-quality extraction with page metadata
   - ImageReader: OCR for images
   - Pandas: CSV/Excel data extraction

6. Text Cleaning:
   - Strip whitespace
   - Remove LaTeX math ($...$)
   
7. Chunking:
   - SentenceSplitter (chunk_size=512, overlap=10)
   - Preserves metadata (page_number)

8. Embedding (per chunk):
   - Call bge-m3 API on Ubuntu
   - Returns: {dense: [1024 floats], sparse: {int: float}}
   - Format sparse vector keys as integers

9. Milvus Insertion:
   - Each chunk → Vector DB entity:
      {
      id: UUID,
      vector: dense_embedding,
      sparse_vector: sparse_embedding,
      content: text,
      user_id: owner,
      document_id: source doc,
      document_name: filename,
      page_number: page
      }

10. Cleanup:
   - Delete local temporary file
   - SFTP file remains on server

11. Optional Move:
   - If 'change=True': Move file on SFTP (private ↔ public)
   - Update collection accordingly

Data Travel:
[Frontend] → [PostgreSQL - Mac] (metadata)
         ↓
[SFTP - Ubuntu] (file storage)
         ↓
[Flask - Mac] (orchestration)
         ↓
[Embedding API - Ubuntu] (bge-m3 inference)
         ↓
[Milvus - Ubuntu] (vector storage)

---
# 3. DOCUMENT DELETION FLOW

Endpoint: DELETE /document/delete?document_id=X&collection_name=Y

Flow:
1. Validate collection exists
2. Milvus: collection.delete(f"document_id == '{document_id}'")
3. Deletes ALL chunks belonging to that document
4. ⚠️ Does NOT delete from SFTP (file remains on server!)

Gap: Orphaned files on SFTP after deletion

---
# 4. DOCUMENT EXISTENCE CHECK FLOW

Endpoint: GET /document/check?document_id=X&collection_name=Y&user_id=Z

Flow:
1. Query Milvus: collection.query(
      expr=f"document_id == '{document_id}' && user_id == '{user_id}'",
      limit=1
   )
2. Return 200 if exists, 404 if not found

Use Case: Frontend verifies document before operations

---
# 5. MIND MAP GENERATION FLOW (from Document)

Endpoint: POST /document/mind_map

Input:
- document_id
- user_id
- tag
- collection_name

Flow:
1. SFTP Retrieval:
   - Download document from Ubuntu SFTP

2. Document Reading:
   - Parse entire document (not chunked)
   - Extract full text

3. LLM Processing:
   - Prompt: MINDMAP_PROMPT_TEMPLATE
   - Content: Full document text
   - LLM generates Markdown mindmap structure

4. Return:
   - Markdown text compatible with markmap visualization

5. Cleanup:
   - Local file deleted (SFTP copy remains)

Key Difference: Uses FULL document, not retrieved chunks

---
# 6. MIND MAP REGENERATION FLOW (from Query)

Endpoint: POST /llm/regenerate_mind_map

Input:
- question - Topic for mindmap
- user_id
- (Hardcoded: hyde=True, reranking=True)

Flow:
1. Query Expansion (HyDE):
   - Generate hypothetical context

2. Embedding + Retrieval:
   - Same as chat flow (hybrid search + reranking)

3. Context Formatting:
   - Retrieved chunks → structured context

4. LLM Mindmap Generation:
   - Prompt: REGENERATE_MIND_MAP_PROMPT
   - Input: question + retrieved context
   - Output: Markdown mindmap

5. Return: Markdown text

Key Difference: Uses RAG retrieval, not full document

---
# 7. TITLE GENERATION FLOW

Endpoint: POST /llm/generate-title

Input:
- prompt - User's first message in chat

Flow:
1. Format prompt with TITLE_PROMPT_TEMPLATE
2. LLM generates concise title (max 5 words)
3. Strip quotes and whitespace
4. Return title string

Use Case: Auto-name chat conversations

---
# 8. EVALUATION FLOW (Background)

Endpoint: POST /llm/evaluate

Input:
- message_id - Chat message to evaluate
- question - User query
- answer - LLM response
- contexts - Retrieved chunks

Flow:
1. Request received → Return 202 Accepted immediately

2. Background Thread Spawned:

   3. RAGAS Evaluation:
      - Create dataset from single Q&A pair
      - Run 4 metrics:
         * Faithfulness (answer grounded in context?)
         * Answer Relevancy (addresses question?)
         * Context Precision (relevant chunks retrieved?)
         * Context Relevance (context quality)

   4. Score Sanitization:
      - Convert numpy types → Python floats
      - Handle NaN/infinity → None

   5. Opik Logging:
      - Track evaluation run with metadata

   6. Frontend Callback:
      - PATCH {FRONTEND_SERVER_EVALUATE_URL}/{message_id}
      - Send scores as JSON
      - Authenticate with INTERNAL_SECRET_KEY

Data Travel:
[Frontend Request] → [Flask - Mac] → [Thread Spawn]
                              ↓
                     [RAGAS Evaluation]
                              ↓
                     [LLM - Ubuntu] (metric computation)
                              ↓
                     [Opik Cloud] (telemetry)
                              ↓
                     [Frontend Callback - Mac] (display scores)

Models Used:
- Same LLM (R-4B) for metric computation
- Same embedding model (bge-m3)

---
# 9. TTS GENERATION FLOW (Basic)

Endpoint: POST /tts/generate

Input:
- text - Content to synthesize
- Voice parameters (mode, ID, temperature, speed, etc.)

Flow:
1. Validate text exists
2. Call TTS server: POST {TTS_SERVER_URL}/generate
3. Receive audio bytes (WAV format)
4. Save to AUDIO_DIR with UUID filename
5. Return audio file path

TTS Server: External service (not part of CITI repos)

---
# 10. TTS GENERATION FLOW (OpenAI-Compatible)

Endpoint: POST /tts/v1/audio/speech

Input:
- input - Text to synthesize
- model - TTS model (default: tts-1)
- voice - Voice ID (default: alloy)
- speed, response_format, seed

Flow: Same as basic TTS, different API contract

---
# 11. PODCAST GENERATION FLOW (Simple)

Endpoint: POST /tts/podcast

Input:
- question - Topic
- user_id
- voice_options - Optional TTS settings
- use_openai_compatible - Boolean

Flow:
1. RAG Content Generation:
   - Call question_answer(hyde=True, reranking=True)
   - Get answer text + sources

2. TTS Synthesis:
   - Convert answer → audio
   - Use specified voice settings

3. Return:
   - Audio file path
   - Original content
   - Source documents

Use Case: Single-voice podcast from RAG content

---
# 12. CONVERSATIONAL PODCAST FLOW (NotebookLM-style)

Endpoint: POST /tts/podcast/conversational

Input:
- question - Topic
- user_id
- speaker_voices - Optional custom voice configs

Flow:
1. RAG Content Generation:
   - question_answer(hyde=True, reranking=True)
   - Get factual answer

2. Script Generation:
   - LLM converts answer → dialogue format
   - Prompt: PODCAST_SCRIPT_TEMPLATE
   - Output format:
      HOST_A: [analytical statement]
      HOST_B: [clarifying question]
      HOST_A: [answer with examples]
      ...

3. Script Parsing:
   - Regex extract: (HOST_A|HOST_B): text
   - Split into segments

4. Multi-Voice TTS:
   - For each segment:
      * Select speaker voice config
      * Generate audio chunk
      * Save temporary file

5. Audio Concatenation:
   - Use ffmpeg to join segments
   - Add silence between speakers (0.5s)
   - Save final podcast WAV

6. Return:
   - Final audio path
   - Full script text
   - Segment metadata
   - Source documents

Key Feature: Two-speaker dialogue simulation

---
# 13. AUDIO DOWNLOAD FLOW

Endpoint: GET /tts/download?filename=X

Flow:
1. Validate filename parameter
2. Check file exists in AUDIO_DIR
3. Flask send_file(audio_path, as_attachment=True)
4. Stream file to client

Use Case: Retrieve previously generated audio

---
Cross-Flow Dependencies

Document Ingestion → Query Flow (provides searchable content)
                  ↓
               Query Flow → Evaluation Flow (measures quality)
                  ↓
               Query Flow → Podcast Flows (content source)
                  ↓
      Podcast Generation → TTS Flows (audio synthesis)

---
Shared Infrastructure Across Flows

Mac Services (Development, Orchestration):

- Flask API (all endpoints)
- PostgreSQL (metadata only, not visible in backend code)
- Frontend (Next.js user interface)

Ubuntu Services (Heavy Compute):

- vLLM (R-4B inference) - Used by: Query, Title, Mindmap, Podcast script, Evaluation
- Embedding API (bge-m3) - Used by: Ingestion, Query
- Milvus - Used by: Ingestion, Query, Check, Delete
- SFTP Server - Used by: Ingestion, Mindmap
- TTS Server - Used by: All audio flows

External Services:

- Opik Cloud (evaluation telemetry)
- Tailscale VPN (Mac ↔ Ubuntu mesh network)

---
# Missing/Implied Flows (Not in Code)

1. User Authentication - Referenced (user_id) but not implemented in backend
2. File Upload - Frontend → SFTP direct (backend only retrieves)
3. Admin Operations - Separate admin-interface repo (not analyzed)
4. Collection Migration - change=True flag exists but logic unclear
5. Cache Management - No cache invalidation flows
6. Model Reloading - No endpoints for updating models

---