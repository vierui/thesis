#!/bin/bash
#
# CITI KMS RAG Pipeline Query Test
# Tests the full RAG pipeline with a sample query
#
# Usage: ./src/test_query.sh

QUERY="What is RAGAS framework?"

echo "======================================================================"
echo "CITI KMS RAG PIPELINE QUERY TEST"
echo "======================================================================"
echo ""
echo "Query: \"$QUERY\""
echo ""

# 1. Test BGE-M3 Embedding
echo "1. Testing BGE-M3 Embedding Generation..."
curl -s -X POST http://140.118.101.211:1234/embed \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"$QUERY\"}" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'   ✓ Status: Success')
    print(f'   Dense embedding dimensions: {len(data[\"dense_embeddings\"])}')
    print(f'   First 5 values: {data[\"dense_embeddings\"][:5]}')
except Exception as e:
    print(f'   ✗ Error: {e}')
"

echo ""

# 2. Test vLLM Chat Completion
echo "2. Testing vLLM Chat Completion (LLM Response)..."
curl -s -X POST http://140.118.101.67:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"google/gemma-3n-E4B-it\",
    \"messages\": [{\"role\": \"user\", \"content\": \"$QUERY Answer in 2-3 sentences.\"}],
    \"max_tokens\": 150,
    \"temperature\": 0.3
  }" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    answer = data['choices'][0]['message']['content']
    print(f'   ✓ LLM Response:')
    print(f'   {answer}')
except Exception as e:
    print(f'   ✗ Error: {e}')
"

echo ""

# 3. Test Milvus Health
echo "3. Testing Milvus Vector Database..."
MILVUS_HEALTH=$(curl -s http://140.118.101.181:9091/healthz)
echo "   Status: $MILVUS_HEALTH"

echo ""
echo "======================================================================"
echo "TEST COMPLETE"
echo "======================================================================"
