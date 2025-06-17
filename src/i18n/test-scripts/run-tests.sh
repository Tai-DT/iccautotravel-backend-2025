#!/bin/bash

# Comprehensive i18n Test Runner
# This script runs all i18n tests: REST API, GraphQL API, and Performance tests

cd "$(dirname "$0")"

echo "🌍 ICCAutoTravel i18n Comprehensive Test Suite"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing test dependencies...${NC}"
    npm install
    echo ""
fi

# Check if server is running
echo -e "${BLUE}🔍 Checking if server is running...${NC}"
server_check=$(curl -s -X POST -H "Content-Type: application/json" -d '{"query":"{ getSupportedLanguages }"}' "http://localhost:3000/graphql" | grep -q "getSupportedLanguages" && echo "200" || echo "000")
if [ "$server_check" -ne 200 ]; then
    echo -e "${RED}❌ Server not running on http://localhost:3000${NC}"
    echo "Please start the NestJS server first:"
    echo "cd ../../.."
    echo "npm run start:dev"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Function to run test with timing
run_test_suite() {
    local test_name=$1
    local test_command=$2
    local start_time=$(date +%s)
    
    echo -e "${CYAN}🚀 Running ${test_name}...${NC}"
    echo "Command: ${test_command}"
    echo ""
    
    if eval "$test_command"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "${GREEN}✅ ${test_name} completed successfully in ${duration}s${NC}"
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "${RED}❌ ${test_name} failed after ${duration}s${NC}"
        return 1
    fi
    echo ""
    echo "----------------------------------------"
    echo ""
}

# Get test selection from user
echo "Select test suite to run:"
echo "1) REST API Tests only"
echo "2) GraphQL API Tests only"  
echo "3) Performance Tests only"
echo "4) Quick Tests (REST + GraphQL)"
echo "5) Full Test Suite (All tests)"
echo "6) Custom selection"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo -e "${YELLOW}Running REST API Tests only...${NC}"
        echo ""
        run_test_suite "REST API Tests" "npm run test:rest"
        ;;
    2)
        echo -e "${YELLOW}Running GraphQL API Tests only...${NC}"
        echo ""
        run_test_suite "GraphQL API Tests" "npm run test:graphql"
        ;;
    3)
        echo -e "${YELLOW}Running Performance Tests only...${NC}"
        echo ""
        run_test_suite "Performance Tests" "npm run test:performance"
        ;;
    4)
        echo -e "${YELLOW}Running Quick Tests (REST + GraphQL)...${NC}"
        echo ""
        run_test_suite "REST API Tests" "npm run test:rest" && \
        run_test_suite "GraphQL API Tests" "npm run test:graphql"
        ;;
    5)
        echo -e "${YELLOW}Running Full Test Suite...${NC}"
        echo ""
        total_start=$(date +%s)
        
        # Track results
        declare -a results
        
        if run_test_suite "REST API Tests" "npm run test:rest"; then
            results+=("✅ REST API Tests")
        else
            results+=("❌ REST API Tests")
        fi
        
        if run_test_suite "GraphQL API Tests" "npm run test:graphql"; then
            results+=("✅ GraphQL API Tests")
        else
            results+=("❌ GraphQL API Tests")
        fi
        
        if run_test_suite "Performance Tests" "npm run test:performance"; then
            results+=("✅ Performance Tests")
        else
            results+=("❌ Performance Tests")
        fi
        
        total_end=$(date +%s)
        total_duration=$((total_end - total_start))
        
        echo ""
        echo -e "${BLUE}📊 Final Test Summary${NC}"
        echo "===================="
        for result in "${results[@]}"; do
            echo "$result"
        done
        echo ""
        echo -e "${CYAN}🕒 Total execution time: ${total_duration}s${NC}"
        ;;
    6)
        echo ""
        echo "Custom test selection:"
        echo ""
        
        read -p "Run REST API tests? (y/n): " run_rest
        read -p "Run GraphQL tests? (y/n): " run_graphql
        read -p "Run Performance tests? (y/n): " run_performance
        
        echo ""
        
        if [[ "$run_rest" =~ ^[Yy]$ ]]; then
            run_test_suite "REST API Tests" "npm run test:rest"
        fi
        
        if [[ "$run_graphql" =~ ^[Yy]$ ]]; then
            run_test_suite "GraphQL API Tests" "npm run test:graphql"
        fi
        
        if [[ "$run_performance" =~ ^[Yy]$ ]]; then
            run_test_suite "Performance Tests" "npm run test:performance"
        fi
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Test execution completed!${NC}"
echo ""
echo -e "${CYAN}📚 Available test commands:${NC}"
echo "  npm run test:rest        - Run REST API tests"
echo "  npm run test:graphql     - Run GraphQL tests"
echo "  npm run test:performance - Run performance tests"
echo "  npm run test:quick       - Run REST + GraphQL tests"
echo "  npm run test:all         - Run all tests"
echo ""
echo -e "${CYAN}📋 Test files:${NC}"
echo "  test-rest-api.js         - REST API comprehensive tests"
echo "  test-graphql-api.js      - GraphQL API comprehensive tests"
echo "  test-performance.js      - Performance and load tests"
echo ""
echo -e "${CYAN}🔧 Configuration:${NC}"
echo "  Base URL: http://localhost:3000"
echo "  GraphQL: http://localhost:3000/graphql"
echo "  Languages: en, vi, ko"
echo "  Namespaces: common, services, booking, validation"
echo ""
