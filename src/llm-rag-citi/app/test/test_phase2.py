#!/usr/bin/env python3
"""
Phase 2 test: Verify request-level metrics tracking.
Tests the RequestTimer class and format_config utility.
"""

import os
import sys
import time

# Test 1: format_config utility
print("=== Test 1: format_config Utility ===")
from app.main.metrics.collectors import format_config

# Test all combinations
configs = [
    (False, False, "hyde=false_rerank=false"),
    (True, False, "hyde=true_rerank=false"),
    (False, True, "hyde=false_rerank=true"),
    (True, True, "hyde=true_rerank=true"),
]

for hyde, rerank, expected in configs:
    result = format_config(hyde, rerank)
    assert result == expected, f"Expected {expected}, got {result}"
    print(f"✓ format_config({hyde}, {rerank}) = '{result}'")

print()

# Test 2: RequestTimer with metrics disabled
print("=== Test 2: RequestTimer (metrics disabled) ===")
os.environ['ENABLE_METRICS'] = 'false'

# Reload modules to pick up new environment
if 'app.main.metrics.config' in sys.modules:
    del sys.modules['app.main.metrics.config']
if 'app.main.metrics.collectors' in sys.modules:
    del sys.modules['app.main.metrics.collectors']

from app.main.metrics.collectors import RequestTimer
from app.main.metrics.config import ENABLE_METRICS

assert ENABLE_METRICS == False
timer = RequestTimer("test_endpoint", "hyde=false_rerank=false")
assert timer.start_time is None, "Timer should not start when metrics disabled"
timer.record_success()  # Should not crash
timer.record_error()    # Should not crash
print("✓ RequestTimer works safely when metrics disabled\n")

# Test 3: RequestTimer with metrics enabled
print("=== Test 3: RequestTimer (metrics enabled) ===")
os.environ['ENABLE_METRICS'] = 'true'

# Reload modules
if 'app.main.metrics.config' in sys.modules:
    del sys.modules['app.main.metrics.config']
if 'app.main.metrics.registry' in sys.modules:
    del sys.modules['app.main.metrics.registry']
if 'app.main.metrics.collectors' in sys.modules:
    del sys.modules['app.main.metrics.collectors']

from app.main.metrics.collectors import RequestTimer, format_config
from app.main.metrics.config import ENABLE_METRICS
from app.main.metrics.registry import registry, request_total, request_duration
from prometheus_client import generate_latest

assert ENABLE_METRICS == True
print(f"ENABLE_METRICS: {ENABLE_METRICS}\n")

# Test 3a: Success case
print("Test 3a: Success case")
timer_success = RequestTimer("chat_with_llm", "hyde=false_rerank=false")
assert timer_success.start_time is not None, "Timer should start"
time.sleep(0.05)  # Simulate work
timer_success.record_success()
assert timer_success.recorded == True, "Should be marked as recorded"

# Verify metrics were recorded
output = generate_latest(registry).decode('utf-8')
assert 'citi_rag_requests_total{config="hyde=false_rerank=false",endpoint="chat_with_llm",status="success"} 1.0' in output
print("✓ Success counter incremented")
assert 'citi_rag_request_duration_seconds_count{config="hyde=false_rerank=false",endpoint="chat_with_llm"} 1.0' in output
print("✓ Duration histogram recorded")
print()

# Test 3b: Error case
print("Test 3b: Error case")
timer_error = RequestTimer("chat_with_llm", "hyde=true_rerank=false")
time.sleep(0.02)
timer_error.record_error()

output = generate_latest(registry).decode('utf-8')
assert 'citi_rag_requests_total{config="hyde=true_rerank=false",endpoint="chat_with_llm",status="error"} 1.0' in output
print("✓ Error counter incremented")
# Duration should NOT be recorded for errors
assert 'citi_rag_request_duration_seconds_count{config="hyde=true_rerank=false",endpoint="chat_with_llm"}' not in output
print("✓ Duration not recorded for errors (preserves percentiles)")
print()

# Test 3c: Multiple calls
print("Test 3c: Multiple requests with different configs")
for i in range(3):
    t = RequestTimer("chat_with_llm", "hyde=true_rerank=true")
    time.sleep(0.01)
    t.record_success()

output = generate_latest(registry).decode('utf-8')
assert 'citi_rag_requests_total{config="hyde=true_rerank=true",endpoint="chat_with_llm",status="success"} 3.0' in output
print("✓ Multiple requests tracked correctly")
print()

# Test 3d: Idempotency (calling record twice)
print("Test 3d: Idempotency check")
timer_idem = RequestTimer("chat_with_llm", "hyde=false_rerank=true")
timer_idem.record_success()
timer_idem.record_success()  # Should be no-op

output_before = generate_latest(registry).decode('utf-8')
timer_idem.record_success()  # Third call
output_after = generate_latest(registry).decode('utf-8')
assert output_before == output_after, "Multiple record calls should be idempotent"
print("✓ record_success/record_error are idempotent")
print()

# Test 4: Prometheus output format
print("=== Test 4: Prometheus Output ===")
output = generate_latest(registry).decode('utf-8')

# Check metric definitions
assert '# HELP citi_rag_requests_total Total number of RAG requests' in output
assert '# TYPE citi_rag_requests_total counter' in output
assert '# TYPE citi_rag_request_duration_seconds histogram' in output
print("✓ Prometheus HELP and TYPE present")

# Check all configs present
for config in ["hyde=false_rerank=false", "hyde=true_rerank=false", "hyde=true_rerank=true", "hyde=false_rerank=true"]:
    assert f'config="{config}"' in output
print("✓ All config combinations present in output")

# Show sample output
print("\nSample Prometheus output:")
for line in output.split('\n')[:30]:
    if line.strip():
        print(f"  {line}")
print("  ...")
print()

print("=" * 60)
print("✅ ALL PHASE 2 TESTS PASSED")
print("=" * 60)
print("\nPhase 2 Success Criteria Met:")
print("✅ format_config() generates stable label strings")
print("✅ RequestTimer tracks E2E request duration")
print("✅ Success and error counters work correctly")
print("✅ Duration only recorded for successful requests")
print("✅ Config labels (hyde/rerank) properly tracked")
print("✅ Metrics safe when ENABLE_METRICS=false")
print("✅ Idempotent record calls prevent double-counting")
