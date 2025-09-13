#!/bin/bash

# 🎭 Vérone E2E Test Runner
# Script pour exécution tests Playwright avec reporting complet

set -e

echo "🚀 Vérone Back Office - E2E Test Suite"
echo "======================================"

# Configuration
REPORTS_DIR=".playwright-mcp"
BASE_URL="http://localhost:3000"
TEST_ENV="e2e"

# Créer dossiers de rapport
mkdir -p "$REPORTS_DIR/reports"
mkdir -p "$REPORTS_DIR/test-results"
mkdir -p "$REPORTS_DIR/screenshots"

# Fonctions utilitaires
check_server() {
    echo "🔌 Checking server availability at $BASE_URL..."

    max_attempts=30
    attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
            echo "✅ Server is running at $BASE_URL"
            return 0
        fi

        echo "⏳ Attempt $attempt/$max_attempts - Server not ready, waiting 2s..."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo "❌ Server failed to start after $max_attempts attempts"
    return 1
}

run_test_suite() {
    local suite_name="$1"
    local test_pattern="$2"
    local project="$3"

    echo ""
    echo "🧪 Running $suite_name..."
    echo "Pattern: $test_pattern"
    echo "Project: $project"
    echo "----------------------------------------"

    if [ -n "$project" ]; then
        npx playwright test "$test_pattern" --project="$project" --reporter=list,html,json
    else
        npx playwright test "$test_pattern" --reporter=list,html,json
    fi

    if [ $? -eq 0 ]; then
        echo "✅ $suite_name - PASSED"
    else
        echo "❌ $suite_name - FAILED"
        return 1
    fi
}

# Parsing arguments
SUITE="all"
PROJECT=""
HEADED=false
DEBUG=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --suite)
            SUITE="$2"
            shift 2
            ;;
        --project)
            PROJECT="$2"
            shift 2
            ;;
        --headed)
            HEADED=true
            shift
            ;;
        --debug)
            DEBUG=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --suite <name>     Run specific suite (critical|performance|api|all)"
            echo "  --project <name>   Run specific project (chrome-business-critical|mobile-workflows|performance-benchmarks|api-tests)"
            echo "  --headed           Run in headed mode (visible browser)"
            echo "  --debug            Run with debug options"
            echo "  --help             Show this help"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Run all tests"
            echo "  $0 --suite critical                  # Run critical tests only"
            echo "  $0 --project performance-benchmarks  # Run performance tests only"
            echo "  $0 --headed --debug                  # Run with visible browser and debug"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Configuration environnement
export PLAYWRIGHT_TEST_BASE_URL="$BASE_URL"
export NODE_ENV="$TEST_ENV"

if [ "$HEADED" = true ]; then
    export PLAYWRIGHT_LAUNCH_OPTIONS='{"headless": false}'
fi

if [ "$DEBUG" = true ]; then
    export PWDEBUG=1
fi

echo "🎯 Configuration:"
echo "   Suite: $SUITE"
echo "   Project: ${PROJECT:-"all"}"
echo "   Base URL: $BASE_URL"
echo "   Headed: $HEADED"
echo "   Debug: $DEBUG"
echo ""

# Vérifier serveur
if ! check_server; then
    echo "💡 Starting development server..."
    npm run dev &
    DEV_SERVER_PID=$!

    # Attendre démarrage
    sleep 5
    if ! check_server; then
        echo "❌ Failed to start development server"
        kill $DEV_SERVER_PID 2>/dev/null || true
        exit 1
    fi

    # Cleanup function
    cleanup() {
        echo "🧹 Cleaning up..."
        kill $DEV_SERVER_PID 2>/dev/null || true
    }
    trap cleanup EXIT
fi

# Installation Playwright si nécessaire
if ! command -v playwright >/dev/null 2>&1; then
    echo "📦 Installing Playwright..."
    npx playwright install
fi

echo ""
echo "🎭 Starting Playwright E2E Tests..."
echo "==================================="

# Exécution selon suite choisie
case $SUITE in
    "critical")
        run_test_suite "Critical Business Workflows" "business-workflows.spec.ts" "$PROJECT"
        ;;
    "performance")
        run_test_suite "Performance Critical Tests" "performance-critical.spec.ts" "$PROJECT"
        ;;
    "api")
        run_test_suite "API Business Rules" "api-business-rules.spec.ts" "$PROJECT"
        ;;
    "all")
        echo "🔄 Running complete E2E test suite..."

        # Business workflows (critique)
        run_test_suite "Critical Business Workflows" "business-workflows.spec.ts" "chrome-business-critical"

        # Performance tests
        run_test_suite "Performance Validation" "performance-critical.spec.ts" "performance-benchmarks"

        # API tests
        run_test_suite "API Business Rules" "api-business-rules.spec.ts" "api-tests"

        # Mobile responsive (sous-ensemble)
        run_test_suite "Mobile Responsive" "business-workflows.spec.ts" "mobile-workflows"
        ;;
    *)
        echo "❌ Unknown suite: $SUITE"
        echo "Available suites: critical, performance, api, all"
        exit 1
        ;;
esac

# Résultats et reporting
echo ""
echo "📊 Test Results Summary"
echo "======================"

if [ -f "$REPORTS_DIR/results.json" ]; then
    echo "📄 JSON Report: $REPORTS_DIR/results.json"
fi

if [ -d "$REPORTS_DIR/reports" ]; then
    echo "📋 HTML Report: $REPORTS_DIR/reports/index.html"
    echo ""
    echo "💡 To view HTML report:"
    echo "   npx playwright show-report $REPORTS_DIR/reports"
fi

# Résumé performance si disponible
if [ -f "$REPORTS_DIR/results.json" ]; then
    echo ""
    echo "⚡ Performance Summary:"

    # Extraire métriques de performance du JSON (si jq disponible)
    if command -v jq >/dev/null 2>&1; then
        echo "   Dashboard Load Times: $(jq '.suites[].specs[] | select(.title | contains("Dashboard")) | .tests[].results[].duration' "$REPORTS_DIR/results.json" 2>/dev/null | head -3 | tr '\n' ' ')ms"
        echo "   API Response Times: $(jq '.suites[].specs[] | select(.title | contains("API")) | .tests[].results[].duration' "$REPORTS_DIR/results.json" 2>/dev/null | head -3 | tr '\n' ' ')ms"
    fi
fi

echo ""
echo "✅ E2E Test Suite Completed!"
echo "🔍 Check reports in: $REPORTS_DIR/"
echo ""