"""
Prometheus metrics registry and metric definitions.

All metrics use a custom registry to avoid polluting the default Prometheus registry.
Metrics are added incrementally across phases.

Label schema (stable across all phases):
- endpoint: chat_with_llm, (future: chat_with_agent, etc.)
- status: success, error
- config: hyde={true|false}_rerank={true|false} (e.g., "hyde=true_rerank=false")
"""

from prometheus_client import Counter, Histogram, CollectorRegistry

# Custom registry to avoid pollution
registry = CollectorRegistry()

# Consistent metric naming prefix
METRICS_PREFIX = "citi_rag_"

# ============================================================================
# PHASE 1: Request-level metrics
# ============================================================================

request_total = Counter(
    f"{METRICS_PREFIX}requests_total",
    "Total number of RAG requests",
    ["endpoint", "status", "config"],  # Stable label set for all phases
    registry=registry
)

request_duration = Histogram(
    f"{METRICS_PREFIX}request_duration_seconds",
    "End-to-end RAG request duration in seconds",
    ["endpoint", "config"],
    buckets=(0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0),
    registry=registry
)

# ============================================================================
# PHASE 3: Pipeline stage metrics (to be added in Phase 3)
# ============================================================================
# hyde_duration, embedding_duration, retrieval_duration, rerank_duration

# ============================================================================
# PHASE 4: LLM streaming metrics (to be added in Phase 4)
# ============================================================================
# llm_ttft, llm_tokens_generated, llm_generation_duration

# ============================================================================
# PHASE 5: Remote GPU metrics (to be added in Phase 5)
# ============================================================================
# vllm_gpu_cache_usage, vllm_num_requests_running, vllm_num_requests_waiting

# ============================================================================
# PHASE 6: System resource metrics (to be added in Phase 6)
# ============================================================================
# system_cpu_percent, system_memory_mb, system_energy_j
# Derived metrics: energy_per_token_j, energy_per_answer_j