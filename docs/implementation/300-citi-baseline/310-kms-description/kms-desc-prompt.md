# claude code

```txt
analyse and understand how these repos interact with each other. desribe their role briefly"
```

# gemini, gpt

```txt
Below is the flow chart and the source tree of a knowledge management system. Analyse it and tell me what you understood of it before I ask you to help me out with my engineering task. I am an computer science engineer. Project Path: 2-citi-kms


# Source Tree:

2-citi-kms
├── LightRAG-Implementation
│   ├── Dockerfile
│   ├── LICENSE
│   ├── README.md
│   ├── assets
│   │   └── logo.png
│   ├── config.ini.example
│   ├── database-server
│   │   ├── docker-compose.yml
│   │   ├── embedEtcd.yaml
│   │   ├── localhost-db-webui.txt
│   │   └── user.yaml
│   ├── docker-compose.yml
│   ├── docs
│   │   ├── Algorithm.md
│   │   └── DockerDeployment.md
│   ├── examples
│   │   ├── batch_eval.py
│   │   ├── copy_llm_cache_to_another_storage.py
│   │   ├── generate_query.py
│   │   ├── get_all_edges_nx.py
│   │   ├── graph_visual_with_html.py
│   │   ├── graph_visual_with_neo4j.py
│   │   ├── insert_custom_kg.py
│   │   ├── lightrag_api_ollama_demo.py
│   │   ├── lightrag_api_openai_compatible_demo.py
│   │   ├── lightrag_api_openai_compatible_demo_simplified.py
│   │   ├── lightrag_api_oracle_demo.py
│   │   ├── lightrag_azure_openai_demo.py
│   │   ├── lightrag_bedrock_demo.py
│   │   ├── lightrag_gemini_demo.py
│   │   ├── lightrag_hf_demo.py
│   │   ├── lightrag_jinaai_demo.py
│   │   ├── lightrag_llamaindex_direct_demo.py
│   │   ├── lightrag_llamaindex_litellm_demo.py
│   │   ├── lightrag_lmdeploy_demo.py
│   │   ├── lightrag_nvidia_demo.py
│   │   ├── lightrag_ollama_age_demo.py
│   │   ├── lightrag_ollama_demo.py
│   │   ├── lightrag_ollama_gremlin_demo.py
│   │   ├── lightrag_ollama_neo4j_milvus_mongo_demo.py
│   │   ├── lightrag_openai_compatible_demo.py
│   │   ├── lightrag_openai_compatible_demo_embedding_cache.py
│   │   ├── lightrag_openai_compatible_stream_demo.py
│   │   ├── lightrag_openai_demo.py
│   │   ├── lightrag_openai_mongodb_graph_demo.py
│   │   ├── lightrag_openai_neo4j_milvus_redis_demo.py
│   │   ├── lightrag_oracle_demo.py
│   │   ├── lightrag_siliconcloud_demo.py
│   │   ├── lightrag_tidb_demo.py
│   │   ├── lightrag_zhipu_demo.py
│   │   ├── lightrag_zhipu_postgres_demo.py
│   │   ├── myKG
│   │   │   └── kv_store_doc_status.json
│   │   ├── openai_README.md
│   │   ├── openai_README_zh.md
│   │   ├── query_keyword_separation_example.py
│   │   ├── test.py
│   │   └── vram_management_demo.py
│   ├── lightrag
│   │   ├── __init__.py
│   │   ├── api
│   │   │   ├── README.md
│   │   │   ├── __init__.py
│   │   │   ├── docs
│   │   │   │   └── LightRagWithPostGRESQL.md
│   │   │   ├── lightrag_server.py
│   │   │   ├── requirements.txt
│   │   │   ├── routers
│   │   │   │   ├── __init__.py
│   │   │   │   ├── document_routes.py
│   │   │   │   ├── graph_routes.py
│   │   │   │   ├── ollama_api.py
│   │   │   │   └── query_routes.py
│   │   │   ├── utils_api.py
│   │   │   └── webui
│   │   │       ├── assets
│   │   │       │   ├── index-DbuMPJAD.js
│   │   │       │   └── index-rP-YlyR1.css
│   │   │       ├── index.html
│   │   │       └── logo.png
│   │   ├── base.py
│   │   ├── exceptions.py
│   │   ├── kg
│   │   │   ├── __init__.py
│   │   │   ├── age_impl.py
│   │   │   ├── chroma_impl.py
│   │   │   ├── faiss_impl.py
│   │   │   ├── gremlin_impl.py
│   │   │   ├── json_doc_status_impl.py
│   │   │   ├── json_kv_impl.py
│   │   │   ├── milvus_impl.py
│   │   │   ├── mongo_impl.py
│   │   │   ├── nano_vector_db_impl.py
│   │   │   ├── neo4j_impl.py
│   │   │   ├── networkx_impl.py
│   │   │   ├── oracle_impl.py
│   │   │   ├── postgres_impl.py
│   │   │   ├── qdrant_impl.py
│   │   │   ├── redis_impl.py
│   │   │   └── tidb_impl.py
│   │   ├── lightrag.py
│   │   ├── llm
│   │   │   ├── Readme.md
│   │   │   ├── __init__.py
│   │   │   ├── azure_openai.py
│   │   │   ├── bedrock.py
│   │   │   ├── hf.py
│   │   │   ├── jina.py
│   │   │   ├── llama_index_impl.py
│   │   │   ├── lmdeploy.py
│   │   │   ├── lollms.py
│   │   │   ├── nvidia_openai.py
│   │   │   ├── ollama.py
│   │   │   ├── openai.py
│   │   │   ├── siliconcloud.py
│   │   │   └── zhipu.py
│   │   ├── llm.py
│   │   ├── namespace.py
│   │   ├── operate.py
│   │   ├── prompt.py
│   │   ├── tools
│   │   │   ├── __init__.py
│   │   │   └── lightrag_visualizer
│   │   │       ├── README-zh.md
│   │   │       ├── README.md
│   │   │       ├── __init__.py
│   │   │       ├── assets
│   │   │       │   ├── Geist-Regular.ttf
│   │   │       │   ├── LICENSE - Geist.txt
│   │   │       │   ├── LICENSE - SmileySans.txt
│   │   │       │   ├── SmileySans-Oblique.ttf
│   │   │       │   └── place_font_here
│   │   │       ├── graph_visualizer.py
│   │   │       └── requirements.txt
│   │   ├── types.py
│   │   └── utils.py
│   ├── lightrag-api
│   ├── lightrag.service.example
│   ├── lightrag_webui
│   │   ├── README.md
│   │   ├── bun.lock
│   │   ├── components.json
│   │   ├── eslint.config.js
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── public
│   │   │   └── logo.png
│   │   ├── src
│   │   │   ├── App.tsx
│   │   │   ├── api
│   │   │   │   └── lightrag.ts
│   │   │   ├── components
│   │   │   │   ├── ApiKeyAlert.tsx
│   │   │   │   ├── MessageAlert.tsx
│   │   │   │   ├── ThemeProvider.tsx
│   │   │   │   ├── ThemeToggle.tsx
│   │   │   │   ├── documents
│   │   │   │   │   ├── ClearDocumentsDialog.tsx
│   │   │   │   │   └── UploadDocumentsDialog.tsx
│   │   │   │   ├── graph
│   │   │   │   │   ├── FocusOnNode.tsx
│   │   │   │   │   ├── FullScreenControl.tsx
│   │   │   │   │   ├── GraphControl.tsx
│   │   │   │   │   ├── GraphLabels.tsx
│   │   │   │   │   ├── GraphSearch.tsx
│   │   │   │   │   ├── LayoutsControl.tsx
│   │   │   │   │   ├── PropertiesView.tsx
│   │   │   │   │   ├── Settings.tsx
│   │   │   │   │   ├── StatusCard.tsx
│   │   │   │   │   ├── StatusIndicator.tsx
│   │   │   │   │   └── ZoomControl.tsx
│   │   │   │   ├── retrieval
│   │   │   │   │   ├── ChatMessage.tsx
│   │   │   │   │   └── QuerySettings.tsx
│   │   │   │   └── ui
│   │   │   │       ├── Alert.tsx
│   │   │   │       ├── AlertDialog.tsx
│   │   │   │       ├── AsyncSearch.tsx
│   │   │   │       ├── AsyncSelect.tsx
│   │   │   │       ├── Badge.tsx
│   │   │   │       ├── Button.tsx
│   │   │   │       ├── Card.tsx
│   │   │   │       ├── Checkbox.tsx
│   │   │   │       ├── Command.tsx
│   │   │   │       ├── DataTable.tsx
│   │   │   │       ├── Dialog.tsx
│   │   │   │       ├── EmptyCard.tsx
│   │   │   │       ├── FileUploader.tsx
│   │   │   │       ├── Input.tsx
│   │   │   │       ├── NumberInput.tsx
│   │   │   │       ├── Popover.tsx
│   │   │   │       ├── Progress.tsx
│   │   │   │       ├── ScrollArea.tsx
│   │   │   │       ├── Select.tsx
│   │   │   │       ├── Separator.tsx
│   │   │   │       ├── Table.tsx
│   │   │   │       ├── Tabs.tsx
│   │   │   │       ├── Text.tsx
│   │   │   │       └── Tooltip.tsx
│   │   │   ├── features
│   │   │   │   ├── ApiSite.tsx
│   │   │   │   ├── DocumentManager.tsx
│   │   │   │   ├── GraphViewer.tsx
│   │   │   │   ├── RetrievalTesting.tsx
│   │   │   │   └── SiteHeader.tsx
│   │   │   ├── hooks
│   │   │   │   ├── useDebounce.tsx
│   │   │   │   ├── useLightragGraph.tsx
│   │   │   │   ├── useRandomGraph.tsx
│   │   │   │   └── useTheme.tsx
│   │   │   ├── index.css
│   │   │   ├── lib
│   │   │   │   ├── constants.ts
│   │   │   │   └── utils.ts
│   │   │   ├── main.tsx
│   │   │   ├── stores
│   │   │   │   ├── graph.ts
│   │   │   │   ├── settings.ts
│   │   │   │   └── state.ts
│   │   │   └── vite-env.d.ts
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   ├── reproduce
│   │   ├── Step_0.py
│   │   ├── Step_1.py
│   │   ├── Step_1_openai_compatible.py
│   │   ├── Step_2.py
│   │   ├── Step_3.py
│   │   └── Step_3_openai_compatible.py
│   ├── requirements.txt
│   ├── setup.py
│   └── tests
├── admin-interface
│   ├── README.md
│   ├── __tests__
│   │   └── DocumentTable.test.ts
│   ├── components.json
│   ├── jest.config.ts
│   ├── jest.setup.js
│   ├── next.config.mjs
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── prisma
│   │   └── schema.prisma
│   ├── public
│   │   └── images
│   │       └── company-logo.png
│   ├── src
│   │   ├── app
│   │   │   ├── (dashboard)
│   │   │   │   ├── document-manager
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── main
│   │   │   │   │   └── page.tsx
│   │   │   │   └── user-manager
│   │   │   │       └── page.tsx
│   │   │   ├── api
│   │   │   │   ├── auth
│   │   │   │   │   └── [...nextauth]
│   │   │   │   │       ├── authOption.ts
│   │   │   │   │       └── route.ts
│   │   │   │   ├── documents
│   │   │   │   │   ├── [action]
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── informations
│   │   │   │   │   └── [info]
│   │   │   │   │       └── route.ts
│   │   │   │   └── users
│   │   │   │       └── route.ts
│   │   │   ├── favicon.ico
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   ├── login
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── components
│   │   │   ├── Card.tsx
│   │   │   ├── Chart.tsx
│   │   │   ├── Clickable.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── DetailSheet.tsx
│   │   │   ├── DocFilter.tsx
│   │   │   ├── DocTable.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── NetworkChart.tsx
│   │   │   ├── PerformanceCard.tsx
│   │   │   ├── RenameAble.tsx
│   │   │   ├── ResourceUsage.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── UploadCard.tsx
│   │   │   ├── UserTable.tsx
│   │   │   └── ui
│   │   │       ├── alert-dialog.tsx
│   │   │       ├── avatar.tsx
│   │   │       ├── button.tsx
│   │   │       ├── calendar.tsx
│   │   │       ├── card.tsx
│   │   │       ├── checkbox.tsx
│   │   │       ├── input.tsx
│   │   │       ├── label.tsx
│   │   │       ├── popover.tsx
│   │   │       ├── select.tsx
│   │   │       ├── sheet.tsx
│   │   │       └── table.tsx
│   │   ├── constants
│   │   │   └── index.ts
│   │   ├── contexts
│   │   │   └── session-provider.tsx
│   │   ├── lib
│   │   │   ├── useStore.ts
│   │   │   ├── useToast.tsx
│   │   │   └── utils.ts
│   │   ├── middleware.ts
│   │   ├── types
│   │   │   └── index.ts
│   │   └── utils
│   │       ├── db.ts
│   │       ├── index.ts
│   │       ├── response.ts
│   │       ├── server-queries.ts
│   │       └── sftp.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── front-end
│   ├── Dockerfile
│   ├── README.md
│   ├── __tests__
│   │   └── api
│   │       ├── chatbox.test.ts
│   │       ├── document.test.ts
│   │       ├── documents.test.ts
│   │       ├── message.test.ts
│   │       └── prompt.test.ts
│   ├── components.json
│   ├── da
│   ├── env.example
│   ├── jest.config.ts
│   ├── jest.setup.ts
│   ├── next.config.mjs
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── prisma
│   │   └── schema.prisma
│   ├── public
│   │   ├── next.svg
│   │   ├── taiwan-tech.png
│   │   └── vercel.svg
│   ├── req.sh
│   ├── src
│   │   ├── app
│   │   │   ├── (auth)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── log-out
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── sign-in
│   │   │   │   │   └── [[...sign-in]]
│   │   │   │   │       └── page.tsx
│   │   │   │   └── sign-up
│   │   │   │       └── [[...sign-up]]
│   │   │   │           └── page.tsx
│   │   │   ├── api
│   │   │   │   ├── chatbox
│   │   │   │   │   ├── [chatboxId]
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── document
│   │   │   │   │   └── route.ts
│   │   │   │   ├── documents
│   │   │   │   │   └── route.ts
│   │   │   │   ├── evaluate
│   │   │   │   │   └── route.ts
│   │   │   │   ├── generate-title
│   │   │   │   │   └── route.ts
│   │   │   │   ├── message
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── status
│   │   │   │   │       └── [messageId]
│   │   │   │   │           └── route.ts
│   │   │   │   ├── mind_map
│   │   │   │   │   └── route.ts
│   │   │   │   ├── prompt
│   │   │   │   │   └── route.ts
│   │   │   │   ├── protected.js
│   │   │   │   ├── regenerate_mind_map
│   │   │   │   │   └── route.ts
│   │   │   │   ├── retrievedocs
│   │   │   │   │   └── [messageId]
│   │   │   │   │       └── route.ts
│   │   │   │   ├── route.ts
│   │   │   │   ├── tts
│   │   │   │   │   ├── download
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── podcast
│   │   │   │   │       └── conversational
│   │   │   │   │           └── route.ts
│   │   │   │   └── update-scores
│   │   │   │       └── [messageId]
│   │   │   │           └── route.ts
│   │   │   ├── dashboard
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── my-documents
│   │   │   │   │   └── [[...slug]]
│   │   │   │   │       ├── document-page.tsx
│   │   │   │   │       └── page.tsx
│   │   │   │   └── profile
│   │   │   │       └── [[...slug]]
│   │   │   │           ├── layout.tsx
│   │   │   │           └── page.tsx
│   │   │   ├── favicon.ico
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   ├── notebook
│   │   │   │   ├── [[...slug]]
│   │   │   │   │   ├── notebook-page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── prompt
│   │   │       ├── [[...slug]]
│   │   │       │   ├── page.tsx
│   │   │       │   └── prompt-page.tsx
│   │   │       └── layout.tsx
│   │   ├── components
│   │   │   ├── dashboard
│   │   │   │   ├── action-options.tsx
│   │   │   │   ├── command-option.tsx
│   │   │   │   ├── doctable-dashboard.tsx
│   │   │   │   ├── filter-table.tsx
│   │   │   │   ├── pagination-table.tsx
│   │   │   │   ├── sidebar-dashboard.tsx
│   │   │   │   └── upload-card.tsx
│   │   │   ├── notebook
│   │   │   │   ├── ChatPanel.tsx
│   │   │   │   ├── SourcesPanel.tsx
│   │   │   │   ├── StudioPanel.tsx
│   │   │   │   └── markmap.ts
│   │   │   ├── prompt
│   │   │   │   ├── chat-box.tsx
│   │   │   │   ├── chat-name.tsx
│   │   │   │   ├── eval-result-modal.tsx
│   │   │   │   ├── model-options.tsx
│   │   │   │   ├── sidebar-prompt.tsx
│   │   │   │   ├── source-detail-modal.tsx
│   │   │   │   ├── three-dot-sidebar.tsx
│   │   │   │   └── user-profile.tsx
│   │   │   ├── session_dialog.tsx
│   │   │   └── ui
│   │   │       ├── alert-dialog.tsx
│   │   │       ├── alert.tsx
│   │   │       ├── avatar.tsx
│   │   │       ├── badge.tsx
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── checkbox.tsx
│   │   │       ├── command.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── dropdown-menu.tsx
│   │   │       ├── form.tsx
│   │   │       ├── hover-card.tsx
│   │   │       ├── input.tsx
│   │   │       ├── label.tsx
│   │   │       ├── popover.tsx
│   │   │       ├── progress.tsx
│   │   │       ├── scroll-area.tsx
│   │   │       ├── select.tsx
│   │   │       ├── separator.tsx
│   │   │       ├── skeleton.tsx
│   │   │       ├── sonner.tsx
│   │   │       ├── switch.tsx
│   │   │       ├── table.tsx
│   │   │       ├── textarea.tsx
│   │   │       ├── toast.tsx
│   │   │       ├── toaster.tsx
│   │   │       └── use-toast.tsx
│   │   ├── constants
│   │   │   └── index.ts
│   │   ├── db.ts
│   │   ├── hooks
│   │   │   └── useTheme.tsx
│   │   ├── lib
│   │   │   ├── api.ts
│   │   │   ├── cn.ts
│   │   │   ├── document-queries.ts
│   │   │   ├── useClickOutside.tsx
│   │   │   ├── useStore.tsx
│   │   │   ├── user-queries.ts
│   │   │   └── utils.ts
│   │   ├── middleware.ts
│   │   └── types
│   │       └── index.ts
│   ├── tailwind.config.ts
│   ├── tes.sh
│   └── tsconfig.json
├── llm-rag-citi
│   ├── Dockerfile
│   ├── README.md
│   ├── app
│   │   ├── __init__.py
│   │   ├── main
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   ├── constant
│   │   │   │   ├── __init__.py
│   │   │   │   ├── document.py
│   │   │   │   ├── llm.py
│   │   │   │   └── tts.py
│   │   │   ├── controller
│   │   │   │   ├── __init__.py
│   │   │   │   ├── document.py
│   │   │   │   ├── llm.py
│   │   │   │   └── tts.py
│   │   │   ├── middleware
│   │   │   │   └── logging.py
│   │   │   ├── response.py
│   │   │   ├── route
│   │   │   │   ├── ___init__.py
│   │   │   │   ├── document_route.py
│   │   │   │   ├── llm_route.py
│   │   │   │   └── tts_route.py
│   │   │   ├── service
│   │   │   │   ├── __init__.py
│   │   │   │   ├── document_service.py
│   │   │   │   ├── evaluate.py
│   │   │   │   ├── llm_service.py
│   │   │   │   └── tts_service.py
│   │   │   └── util
│   │   │       ├── __init__.py
│   │   │       ├── demo
│   │   │       │   └── demo.py
│   │   │       ├── document.py
│   │   │       ├── embedding.py
│   │   │       ├── llm.py
│   │   │       └── tes.py
│   │   └── test
│   │       └── __init__.py
│   ├── docker-build.yml
│   ├── files
│   │   ├── 1.docx
│   │   ├── 11.pdf
│   │   ├── 17.pdf
│   │   ├── 18.pdf
│   │   ├── 19.pdf
│   │   ├── 2.pdf
│   │   ├── 32.pdf
│   │   ├── 42.txt
│   │   ├── 43.txt
│   │   ├── 78.xlsx
│   │   └── Test Ragas Input.pdf
│   ├── mindmap_output.html
│   ├── requirements copy.txt
│   ├── requirements.txt
│   ├── result.txt
│   ├── runner.py
│   ├── scripts
│   │   ├── create_db.py
│   │   ├── create_db_hybrid.py
│   │   └── delete_db.py
│   └── test.md
└── ragas-local-implementation
    ├── README.md
    ├── create_vector.py
    ├── data
    │   ├── pdf_files
    │   │   ├── 267.pdf
    │   │   ├── 269.pdf
    │   │   └── 270.pdf
    │   └── vector
    │       ├── 267_pdf_vector_set.npy
    │       └── set_vector_doc_1.npy
    ├── evaluation.py
    ├── example.env
    ├── requirements.txt
    ├── result
    │   ├── coba.csv
    │   └── test_Faithfulness.pkl
    └── testset_generation.py

```

# flowchart

flowchart TB
subgraph "1. KNOWLEDGE CAPTURE & ACQUISITION"

U1[User Interface - Front-end]

U2[Admin Interface]

U3[Document Upload]

U1 -->|User Documents| U3

U2 -->|Admin Documents| U3

end

subgraph "2. DATA PREPARATION & TOKENIZATION"

U3 -->|PDF/DOC/PPT| DOC_PROC[Document Processor<br/>MinERU/PyPDF]

DOC_PROC -->|Raw Text| CHUNK[Text Chunker<br/>RecursiveCharacterTextSplitter]

CHUNK -->|Text Chunks| EMB_API[Embedding API<br/>BGE-M3 Model]

EMB_API -->|Dense Embeddings| DENSE[Dense Vectors<br/>1024-dim]

EMB_API -->|Sparse Embeddings| SPARSE[Sparse Vectors<br/>BM25-style]

end

subgraph "3. KNOWLEDGE STORAGE & INDEXING"

DENSE --> MILVUS[(Milvus Vector DB)]

SPARSE --> MILVUS

MILVUS -->|Collections| PRIV[Private Collection<br/>user_id filtered]

MILVUS -->|Collections| PUB[Public Collection<br/>shared docs]

DOC_PROC -->|Metadata| POSTGRES[(PostgreSQL<br/>Prisma ORM)]

POSTGRES -->|Tables| T1[User]

POSTGRES -->|Tables| T2[Document]

POSTGRES -->|Tables| T3[ChatBox]

POSTGRES -->|Tables| T4[Message]

POSTGRES -->|Tables| T5[vdb mapping]

end

subgraph "4. QUERY PROCESSING PIPELINE"

USER[User Query] -->|Question| FE[Front-end Web Interface]

FE -->|HTTP POST| API[llm-rag-citi Flask API]

API -->|Semaphore<br/>max=2| QUEUE{Request Queue}

QUEUE -->|Query| HYDE_DECISION{HyDE Mode?}

HYDE_DECISION -->|Yes| HYDE_LLM[HyDE LLM<br/>Query Expansion]

HYDE_DECISION -->|No| EMB_QUERY[Direct Embedding]

HYDE_LLM -->|Hypothetical Document| EMB_QUERY

EMB_QUERY -->|Dense + Sparse| VEC_SEARCH[Vector Search<br/>Milvus Hybrid Search]

VEC_SEARCH -->|Top-K Results| PRIV

VEC_SEARCH -->|Top-K Results| PUB

PRIV -->|Retrieved Chunks| RERANK_CHECK{Reranking?}

PUB -->|Retrieved Chunks| RERANK_CHECK

RERANK_CHECK -->|Yes| RERANK[Reranker Model<br/>Cross-encoder]

RERANK_CHECK -->|No| CONTEXT_BUILD[Context Builder]

RERANK -->|Top-5 Docs| CONTEXT_BUILD

end

subgraph "5. LLM INFERENCE & GENERATION"

CONTEXT_BUILD -->|Formatted Context| PROMPT_TEMPLATE[Prompt Template<br/>System + Context + Query]

PROMPT_TEMPLATE -->|Conversation History| HISTORY[Format History<br/>ChatMessage objects]

HISTORY -->|Final Prompt| LLM_ROUTER{Streaming?}

LLM_ROUTER -->|Yes| STREAM_LLM[Generation LLM<br/>OpenAI API Compatible<br/>Streaming Mode]

LLM_ROUTER -->|No| SYNC_LLM[Generation LLM<br/>Async Complete]

STREAM_LLM -->|Token Stream| SSE[Server-Sent Events]

SYNC_LLM -->|Complete Response| JSON_RESP[JSON Response]

SSE -->|data: chunks| FE

JSON_RESP --> FE

end

subgraph "6. KNOWLEDGE APPLICATION & RESPONSE"

FE -->|Display| CHAT_UI[Chat Interface<br/>React + Markdown]

CHAT_UI -->|Retrieved Docs| SOURCE_DISPLAY[Source Citations<br/>Doc Name + Page #]

CHAT_UI -->|Rating/Feedback| FEEDBACK[User Feedback]

FEEDBACK -->|Store| POSTGRES

end

subgraph "7. EVALUATION & MONITORING"

JSON_RESP -->|Message ID| EVAL_TRIGGER[Evaluation Trigger<br/>Background Thread]

EVAL_TRIGGER -->|Question + Answer + Contexts| RAGAS[RAGAS Evaluation<br/>ragas-local-implementation]

RAGAS -->|Metrics| METRICS[Faithfulness<br/>Answer Relevancy<br/>Context Precision<br/>Context Relevance]

METRICS -->|Update| POSTGRES

POSTGRES -->|Analytics| ADMIN_DASH[Admin Dashboard<br/>Metrics Visualization]

ADMIN_DASH --> U2

end

subgraph "EXTERNAL SERVICES"

LLM_ENDPOINT[LLM Inference Server<br/>LLM_URL endpoint]

HYDE_ENDPOINT[HyDE LLM Server<br/>HYDE_LLM_URL endpoint]

EMB_ENDPOINT[Embedding Server<br/>EMBEDDING_URL endpoint]

STREAM_LLM -.->|HTTP| LLM_ENDPOINT

SYNC_LLM -.->|HTTP| LLM_ENDPOINT

HYDE_LLM -.->|HTTP| HYDE_ENDPOINT

EMB_API -.->|HTTP| EMB_ENDPOINT

end

subgraph "MISSING/NOT IMPLEMENTED (from LLM fundamentals)"

MISSING1[❌ Model Pretraining<br/>No custom LLM training]

MISSING2[❌ Fine-tuning Pipeline<br/>No domain adaptation]

MISSING3[❌ KV Cache Optimization<br/>Not controlled]

MISSING4[❌ Quantization<br/>External to system]

MISSING5[❌ Multi-head Attention<br/>Black box in external LLM]

MISSING6[❌ Tokenizer Training<br/>Uses external tokenizer]

end

classDef storage fill:#4A90E2,stroke:#2E5C8A,color:#fff

classDef processing fill:#F5A623,stroke:#C17D11,color:#fff

classDef llm fill:#7ED321,stroke:#5FA319,color:#000

classDef interface fill:#BD10E0,stroke:#8B0AA8,color:#fff

classDef missing fill:#D0021B,stroke:#8A0112,color:#fff

class MILVUS,POSTGRES storage

class DOC_PROC,CHUNK,EMB_API,RERANK processing

class HYDE_LLM,STREAM_LLM,SYNC_LLM,LLM_ENDPOINT,HYDE_ENDPOINT llm

class U1,U2,FE,CHAT_UI,ADMIN_DASH interface

class MISSING1,MISSING2,MISSING3,MISSING4,MISSING5,MISSING6 missing
´´´

