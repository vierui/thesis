import os
from flask import Flask
from flask_cors import CORS
from pymilvus import connections
from llama_index.core import Settings
# from langchain_openai import ChatOpenAI
from llama_index.llms.openai_like import OpenAILike
import os
# Set default API key for OpenAI-compatible APIs
os.environ["OPENAI_API_KEY"] = "test"
# from llama_index.llms.ollama import Ollama
# from llama_index.embeddings.langchain import LangchainEmbedding
from .util.embedding import CustomAPIEmbeddings
# from llama_index.agent.openai import OpenAIAgent
# from llama_index.core.agent.workflow import FunctionAgent

from llama_index.core.agent.workflow import AgentWorkflow
# from llama_index.tools.duckduckgo import DuckDuckGoSearchToolSpec
import threading

from .config import config_by_name
from .constant.llm import TEMPERATURE, MODEL, N_HYDE_INSTANCE, HYDE_LLM_URL, LLM_URL, MAX_TOKENS
from .metrics.config import ENABLE_METRICS

# Conditional imports for metrics
if ENABLE_METRICS:
    from prometheus_client import generate_latest
    from .metrics.registry import registry

# embedding_model = SentenceTransformer(EMBEDDING_MODEL, trust_remote_code=True, device='cuda' if torch.cuda.is_available() else 'cpu')

EMBEDDING_API_URL = os.getenv('EMBEDDING_URL')

langchain_embedding_model = CustomAPIEmbeddings(api_url=EMBEDDING_API_URL)

# llama_index_embedding_model = LangchainEmbedding(langchain_embedding_model)


# Settings.embed_model = llama_index_embedding_model
# Settings.llm = generation_llm

# embedding_model = SentenceTransformer(
#     EMBEDDING_MODEL,
#     device= "cuda",
#     trust_remote_code=True,
# )

# hyde_llm_old = ChatOpenAI(
#     openai_api_base = HYDE_LLM_URL,
#     model_name = MODEL,
#     n=N_HYDE_INSTANCE,
#     temperature=TEMPERATURE,
#     openai_api_key="None",
# )

# Use OpenAILike for vLLM compatibility (no model validation)
hyde_llm = OpenAILike(
    api_base = HYDE_LLM_URL,
    model = MODEL,
    # n=N_HYDE_INSTANCE,
    temperature=TEMPERATURE,
    api_key="None",
    is_chat_model=True,
)

# hyde_llm = Ollama(
#     base_url = HYDE_LLM_URL,
#     model = MODEL,
#     # n=N_HYDE_INSTANCE,
#     # temperature=TEMPERATURE,
#     # api_key="None",
# )

semaphore = threading.Semaphore(2)

# generation_llm = ChatOpenAI(
#     openai_api_base = LLM_URL,
#     model_name=MODEL,
#     temperature=TEMPERATURE,
#     openai_api_key="test",
#     max_tokens=MAX_TOKENS,
# )

# gaudi_generation_llm = ChatOpenAI(
#     openai_api_base = LLM_URL,
#     model_name=MODEL,
#     temperature=TEMPERATURE,
#     openai_api_key="test",
#     max_tokens=MAX_TOKENS,
# )

# Use OpenAILike for vLLM compatibility (no model validation)
generation_llm = OpenAILike(
    api_base = LLM_URL,
    model=MODEL,
    temperature=TEMPERATURE,
    api_key="test",
    max_tokens=MAX_TOKENS,
    is_chat_model=True,
)

# ddg_spec = DuckDuckGoSearchToolSpec()


# agent = AgentWorkflow.from_tools_or_functions(
#     tools_or_functions=ddg_spec.to_tool_list(),
#     llm=generation_llm,
#     verbose=True
# )

# Kita bikin agent-nya.
# Dia punya otak (llm) dan tangan (tools) buat kerja.
# verbose=True biar kita bisa liat di console agent-nya lagi ngapain, bagus buat debugging.
# agent = OpenAIAgent.from_tools(
#     tools=ddg_spec.to_tool_list(),
#     llm=generation_llm,
#     verbose=True
# )


# agent = OpenAIAgent.from_tools(
#     tools=ddg_spec.to_tool_list(),
#     llm=generation_llm,
#     verbose=True
# )

# generation_llm = Ollama(
#     base_url = LLM_URL,
#     model=MODEL,
#     temperature=TEMPERATURE,
#     # api_key="test",
#     # max_tokens=MAX_TOKENS,
# )

# Use OpenAILike for vLLM compatibility (no model validation)
gaudi_generation_llm = OpenAILike(
    api_base = LLM_URL,
    model=MODEL,
    temperature=TEMPERATURE,
    api_key="test",
    max_tokens=MAX_TOKENS,
    is_chat_model=True,
)

# gaudi_generation_llm = Ollama(
#     base_url = LLM_URL,
#     model=MODEL,
#     temperature=TEMPERATURE,
#     # api_key="test",
#     # max_tokens=MAX_TOKENS,
# )

def create_app(config_name:str):
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])
    CORS(app=app)


    # connect to milvus
    connections.connect(
        uri=config_by_name[config_name].MILVUS_URI,
        user=config_by_name[config_name].MILVUS_USER,
        password=config_by_name[config_name].MILVUS_PASSWORD,
        db_name=config_by_name[config_name].MILVUS_DB_NAME
    )

    # register blueprints
    # routes need to be imported inside to avoid conflict
    from .route import document_route, llm_route, tts_route
    app.register_blueprint(document_route.blueprint)
    app.register_blueprint(llm_route.blueprint)
    app.register_blueprint(tts_route.blueprint)

    # Health check endpoint for Docker/K8s
    @app.route('/health')
    def health_check():
        return {"status": "healthy", "environment": config_name}, 200

    # Metrics endpoint (Prometheus format)
    if ENABLE_METRICS:
        @app.route('/metrics')
        def metrics():
            return generate_latest(registry), 200, {'Content-Type': 'text/plain; charset=utf-8'}

    print(f"The app is running in {config_name} environment")

    return app
