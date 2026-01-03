#!/bin/bash

# POS.com RMS Dashboard - E2E Test Runner
# Usage: ./run-tests.sh [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
MODE="headless"
BROWSER="chromium"
REPORT=false
CLEAN=false

# Print header
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   POS.com RMS Dashboard E2E Test Runner   ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
    echo ""
}

# Print usage
print_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -u, --ui            Run tests in UI mode"
    echo "  -d, --debug         Run tests in debug mode"
    echo "  -H, --headed        Run tests in headed mode"
    echo "  -b, --browser NAME  Specify browser (chromium, firefox, webkit)"
    echo "  -r, --report        Show report after tests"
    echo "  -c, --clean         Clean previous test results"
    echo "  -t, --test PATTERN  Run tests matching pattern"
    echo ""
    echo "Examples:"
    echo "  $0                  # Run all tests in headless mode"
    echo "  $0 --ui             # Run with interactive UI"
    echo "  $0 --headed         # Run in headed mode"
    echo "  $0 --debug          # Run in debug mode"
    echo "  $0 -t \"Login\"       # Run only Login tests"
    echo "  $0 --clean --report # Clean, run, show report"
    echo ""
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            print_header
            print_usage
            exit 0
            ;;
        -u|--ui)
            MODE="ui"
            shift
            ;;
        -d|--debug)
            MODE="debug"
            shift
            ;;
        -H|--headed)
            MODE="headed"
            shift
            ;;
        -b|--browser)
            BROWSER="$2"
            shift 2
            ;;
        -r|--report)
            REPORT=true
            shift
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -t|--test)
            TEST_PATTERN="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            print_usage
            exit 1
            ;;
    esac
done

print_header

# Check if we're in the right directory
if [ ! -f "playwright.config.ts" ]; then
    echo -e "${RED}Error: playwright.config.ts not found${NC}"
    echo "Please run this script from the dashboard package directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Check if Playwright browsers are installed
if [ ! -d "$HOME/.cache/ms-playwright" ] && [ ! -d "$HOME/Library/Caches/ms-playwright" ]; then
    echo -e "${YELLOW}Installing Playwright browsers...${NC}"
    npx playwright install chromium
fi

# Clean previous results if requested
if [ "$CLEAN" = true ]; then
    echo -e "${YELLOW}Cleaning previous test results...${NC}"
    rm -rf playwright-report/ test-results/ playwright-screenshots/
    echo -e "${GREEN}✓ Cleaned${NC}"
    echo ""
fi

# Build command based on mode
echo -e "${BLUE}Running tests...${NC}"
echo -e "Mode: ${GREEN}$MODE${NC}"
echo -e "Browser: ${GREEN}$BROWSER${NC}"
echo ""

case $MODE in
    ui)
        npx playwright test --ui ${TEST_PATTERN:+-g "$TEST_PATTERN"}
        ;;
    debug)
        npx playwright test --debug ${TEST_PATTERN:+-g "$TEST_PATTERN"}
        ;;
    headed)
        npx playwright test --headed --project=$BROWSER ${TEST_PATTERN:+-g "$TEST_PATTERN"}
        ;;
    *)
        npx playwright test --project=$BROWSER ${TEST_PATTERN:+-g "$TEST_PATTERN"}
        TEST_EXIT_CODE=$?
        ;;
esac

# Capture exit code
if [ -z "$TEST_EXIT_CODE" ]; then
    TEST_EXIT_CODE=$?
fi

echo ""

# Show results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
else
    echo -e "${RED}✗ Some tests failed${NC}"
fi

# Show report if requested
if [ "$REPORT" = true ]; then
    echo ""
    echo -e "${BLUE}Opening test report...${NC}"
    npx playwright show-report
fi

exit $TEST_EXIT_CODE
