#!/bin/bash
#
# CITI KMS GPU Node Connectivity Test
# Tests connectivity to all GPU nodes via network
#
# Node Addresses:
# - LLM Node: 140.118.101.67 (vLLM:8000, LocalAI:8080)
# - Milvus Node: 140.118.101.181 (Milvus:19530, Management:9091)
# - BGE-M3 Node: 140.118.101.211 (BGE-M3:1234)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================================================"
echo "CITI KMS GPU Node Connectivity Test"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================================================"
echo ""

# Test function
test_service() {
    local name="$1"
    local host="$2"
    local port="$3"
    local http_path="$4"

    printf "  ${BLUE}${name}${NC} (port ${port}): "

    # Port scan
    if nc -zv -w 3 "$host" "$port" > /dev/null 2>&1; then
        printf "${GREEN}✓ Port open${NC}"

        # HTTP test if path provided
        if [ -n "$http_path" ] && [ "$http_path" != "-" ]; then
            http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "http://$host:$port$http_path" 2>&1)
            if [ "$http_code" = "200" ]; then
                printf " | ${GREEN}✓ HTTP 200${NC}\n"
            elif [ "$http_code" != "000" ]; then
                printf " | ${YELLOW}⚠ HTTP ${http_code}${NC}\n"
            else
                printf " | ${RED}✗ HTTP failed${NC}\n"
            fi
        else
            printf "\n"
        fi
    else
        printf "${RED}✗ Port closed${NC}\n"
    fi
}

# Test node connectivity
test_node() {
    local node_name="$1"
    local host="$2"

    echo ""
    echo "=== $node_name ($host) ==="

    # Ping test (may be blocked by firewall, so don't exit on failure)
    printf "Network (ICMP): "
    if ping -c 2 -W 2 "$host" > /dev/null 2>&1; then
        printf "${GREEN}✓ Ping OK${NC}\n"
    else
        printf "${YELLOW}⚠ Ping blocked/timeout (testing ports anyway)${NC}\n"
    fi
}

# Test LLM Node
test_node "LLM NODE" "140.118.101.67"
test_service "vLLM" "140.118.101.67" "8000" "/v1/models"
test_service "LocalAI" "140.118.101.67" "8080" "/v1/models"

# Test Milvus Node
test_node "MILVUS NODE" "140.118.101.181"
test_service "Milvus Vector DB" "140.118.101.181" "19530" "-"
test_service "Milvus Management" "140.118.101.181" "9091" "/healthz"

# Test BGE-M3 Node (requires campus network or Tailscale access)
test_node "BGE-M3 NODE (Campus IP)" "140.118.101.211"
test_service "BGE-M3 Embedding" "140.118.101.211" "1234" "/health"

echo ""
echo "======================================================================"
echo "DETAILED SERVICE INFO"
echo "======================================================================"

# Get vLLM model info
echo ""
echo "vLLM Available Models:"
if curl -s http://140.118.101.67:8000/v1/models 2>/dev/null | grep -q "object"; then
    curl -s http://140.118.101.67:8000/v1/models | python3 -m json.tool 2>/dev/null | grep -E '"id"|"max_model_len"' || echo "  (JSON parsing unavailable)"
fi

# Get Milvus health
echo ""
echo "Milvus Health Status:"
curl -s http://140.118.101.181:9091/healthz 2>/dev/null || echo "  Failed to fetch"

echo ""
echo ""
echo "======================================================================"
echo "Test completed at $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================================================"
