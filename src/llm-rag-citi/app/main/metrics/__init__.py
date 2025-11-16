"""
Metrics package for performance monitoring.

This package provides Prometheus-based metrics collection for the CITI KMS RAG system.
All metrics are optional and controlled by the ENABLE_METRICS environment variable.
"""

from .config import ENABLE_METRICS
from .registry import registry

__all__ = ['ENABLE_METRICS', 'registry']