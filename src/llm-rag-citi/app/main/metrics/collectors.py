"""
Metrics collection utilities.

Provides context managers and decorators for collecting performance metrics
without modifying core business logic.
"""

import time
from contextlib import contextmanager
from typing import Optional
from .config import ENABLE_METRICS

if ENABLE_METRICS:
    from .registry import request_total, request_duration


@contextmanager
def track_request(endpoint: str, config: str):
    """
    Context manager to track request-level metrics.

    Tracks:
    - Total request duration (E2E)
    - Success/error counts
    - Configuration labels

    Args:
        endpoint: Endpoint name (e.g., "chat_with_llm")
        config: Configuration string (e.g., "hyde=true_rerank=false")

    Yields:
        dict: Metrics collector with 'mark_error' method

    Example:
        >>> with track_request("chat_with_llm", "hyde=false_rerank=false") as metrics:
        ...     result = do_work()
        ...     # On exception, metrics automatically marked as error
        ...     return result
    """
    if not ENABLE_METRICS:
        yield {"mark_error": lambda: None}
        return

    start_time = time.perf_counter()
    status = "success"
    error_marked = False

    def mark_error():
        """Mark this request as having an error."""
        nonlocal status, error_marked
        status = "error"
        error_marked = True

    try:
        yield {"mark_error": mark_error}
    except Exception:
        # Exception will be re-raised, but mark as error first
        status = "error"
        raise
    finally:
        # Record metrics regardless of success/failure
        duration = time.perf_counter() - start_time

        # Record counter
        request_total.labels(
            endpoint=endpoint,
            status=status,
            config=config
        ).inc()

        # Record duration (only for successful requests to avoid skewing percentiles)
        if status == "success":
            request_duration.labels(
                endpoint=endpoint,
                config=config
            ).observe(duration)


def format_config(hyde: bool, reranking: bool) -> str:
    """
    Format configuration into consistent label string.

    Args:
        hyde: Whether HyDE is enabled
        reranking: Whether reranking is enabled

    Returns:
        str: Formatted config string (e.g., "hyde=true_rerank=false")

    Example:
        >>> format_config(True, False)
        'hyde=true_rerank=false'
        >>> format_config(False, True)
        'hyde=false_rerank=true'
    """
    return f"hyde={str(hyde).lower()}_rerank={str(reranking).lower()}"


class RequestTimer:
    """
    Manual request timer for streaming responses.

    For streaming responses, the context manager pattern doesn't work
    because the response is returned before the stream completes.
    This class allows manual control of when metrics are recorded.

    Example:
        >>> timer = RequestTimer("chat_with_llm", "hyde=false_rerank=false")
        >>> # ... do work ...
        >>> timer.record_success()  # or timer.record_error()
    """

    def __init__(self, endpoint: str, config: str):
        """
        Initialize timer and start timing.

        Args:
            endpoint: Endpoint name
            config: Configuration string
        """
        self.endpoint = endpoint
        self.config = config
        self.start_time = time.perf_counter() if ENABLE_METRICS else None
        self.recorded = False

    def record_success(self):
        """Record successful request completion."""
        if not ENABLE_METRICS or self.recorded:
            return

        duration = time.perf_counter() - self.start_time

        # Record counter
        request_total.labels(
            endpoint=self.endpoint,
            status="success",
            config=self.config
        ).inc()

        # Record duration
        request_duration.labels(
            endpoint=self.endpoint,
            config=self.config
        ).observe(duration)

        self.recorded = True

    def record_error(self):
        """Record failed request completion."""
        if not ENABLE_METRICS or self.recorded:
            return

        # Only record counter for errors (duration skipped to avoid skewing percentiles)
        request_total.labels(
            endpoint=self.endpoint,
            status="error",
            config=self.config
        ).inc()

        self.recorded = True
