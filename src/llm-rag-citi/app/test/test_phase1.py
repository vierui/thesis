#!/usr/bin/env python3
"""
Phase 1 test: Verify metrics infrastructure is working.
Tests without needing full Flask/Milvus setup.
"""

import os
import sys

# Test 1: Import metrics with ENABLE_METRICS=false
print("=== Test 1: ENABLE_METRICS=false ===")
os.environ['ENABLE_METRICS'] = 'false'

# Reload to pick up new environment variable
if 'app.main.metrics.config' in sys.modules:
    del sys.modules['app.main.metrics.config']

from app.main.metrics.config import ENABLE_METRICS
print(f"ENABLE_METRICS: {ENABLE_METRICS}")
assert ENABLE_METRICS == False, "ENABLE_METRICS should be False"
print("✓ Config loads correctly with metrics disabled\n")

# Test 2: Import metrics with ENABLE_METRICS=true
print("=== Test 2: ENABLE_METRICS=true ===")
os.environ['ENABLE_METRICS'] = 'true'

# Reload to pick up new environment variable
if 'app.main.metrics.config' in sys.modules:
    del sys.modules['app.main.metrics.config']

from app.main.metrics.config import ENABLE_METRICS
from app.main.metrics.registry import registry, request_total, request_duration, METRICS_PREFIX

print(f"ENABLE_METRICS: {ENABLE_METRICS}")
assert ENABLE_METRICS == True, "ENABLE_METRICS should be True"
print("✓ Config loads correctly with metrics enabled\n")

# Test 3: Verify metrics are defined
print("=== Test 3: Metrics Registry ===")
print(f"Metrics prefix: {METRICS_PREFIX}")
assert METRICS_PREFIX == "citi_rag_", "Prefix should be citi_rag_"
print("✓ Consistent prefix defined\n")

print(f"request_total: {request_total._name}")
# Note: Prometheus client strips "_total" suffix internally for counters
assert request_total._name == "citi_rag_requests", "Metric name incorrect"
print(f"  Labels: {request_total._labelnames}")
assert request_total._labelnames == ('endpoint', 'status', 'config'), "Labels incorrect"
print("✓ request_total metric correctly defined\n")

print(f"request_duration: {request_duration._name}")
assert request_duration._name == "citi_rag_request_duration_seconds", "Metric name incorrect"
print(f"  Labels: {request_duration._labelnames}")
assert request_duration._labelnames == ('endpoint', 'config'), "Labels incorrect"
print(f"  Buckets: {request_duration._upper_bounds}")
expected_buckets = [0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0, float('inf')]
assert request_duration._upper_bounds == expected_buckets, "Buckets incorrect"
print("✓ request_duration histogram correctly defined\n")

# Test 4: Generate Prometheus output
print("=== Test 4: Prometheus Output ===")
from prometheus_client import generate_latest
output = generate_latest(registry).decode('utf-8')

# Check output contains our metrics
assert "citi_rag_requests_total" in output, "Missing request_total in output"
assert "citi_rag_request_duration_seconds" in output, "Missing request_duration in output"
assert "HELP citi_rag_requests_total Total number of RAG requests" in output
assert "TYPE citi_rag_requests_total counter" in output
assert "TYPE citi_rag_request_duration_seconds histogram" in output

# Record a sample value to make buckets appear in output
request_duration.labels(endpoint="test", config="test").observe(0.5)

# Regenerate output with recorded value
output = generate_latest(registry).decode('utf-8')

# Now check buckets are present
assert 'le="0.01"' in output, "Missing 0.01 bucket"
assert 'le="0.05"' in output, "Missing 0.05 bucket"
assert 'le="0.5"' in output, "Missing 0.5 bucket"
assert 'le="+Inf"' in output, "Missing +Inf bucket"

print("Sample Prometheus output:")
print(output[:800])
print("...\n")
print("✓ Prometheus output format correct\n")

print("=" * 60)
print("✅ ALL PHASE 1 TESTS PASSED")
print("=" * 60)
print("\nPhase 1 Success Criteria Met:")
print("✅ Metrics package created")
print("✅ Custom Prometheus registry working")
print("✅ Metric names use consistent 'citi_rag_' prefix")
print("✅ Stable label schema defined (endpoint, status, config)")
print("✅ Fine-grained buckets (0.01s - 60s) configured")
print("✅ Prometheus format output generated correctly")
