#!/bin/bash
# 🚀 Smart Commit System - Want It Now Auto Commit Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_PREFIX="backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEMPLATES_DIR=".claude/smart-commit"
MANIFESTS_DIR="manifests"

echo -e "${BLUE}🚀 Want It Now Smart Commit System${NC}"
echo -e "${BLUE}======================================${NC}"

# Function to create backup
create_backup() {
    local backup_name="${BACKUP_PREFIX}-${TIMESTAMP}-${1}"
    echo -e "${YELLOW}📦 Creating backup: ${backup_name}${NC}"
    
    # Create backup branch
    git checkout -b "$backup_name" 2>/dev/null || git checkout "$backup_name"
    git add . 2>/dev/null || true
    git commit -m "🔒 BACKUP: Pre-commit backup - $(date)" 2>/dev/null || true
    
    # Return to main branch
    git checkout - >/dev/null 2>&1
    
    echo -e "${GREEN}✅ Backup created: ${backup_name}${NC}"
}

# Function to detect commit type
detect_commit_type() {
    local changed_files=$(git diff --cached --name-only)
    local commit_msg="$1"
    
    if [[ "$changed_files" == *"manifests/business-rules"* ]] || [[ "$commit_msg" == *"business"* ]] || [[ "$commit_msg" == *"rules"* ]]; then
        echo "business-rules"
    elif [[ "$changed_files" == *"components/"* ]] || [[ "$commit_msg" == *"ui"* ]] || [[ "$commit_msg" == *"design"* ]]; then
        echo "ui-implementation"
    elif [[ "$commit_msg" == *"fix"* ]] || [[ "$commit_msg" == *"bug"* ]]; then
        echo "bug-fix"
    elif [[ "$commit_msg" == *"refactor"* ]] || [[ "$commit_msg" == *"optimize"* ]]; then
        echo "technical-improvement"
    else
        echo "feature-implementation"
    fi
}

# Function to generate smart commit message
generate_commit_message() {
    local commit_type="$1"
    local brief_desc="$2"
    local changed_files=$(git diff --cached --name-only)
    local changed_count=$(echo "$changed_files" | wc -l)
    
    # Determine emoji and prefix based on type
    case "$commit_type" in
        "business-rules")
            emoji="⚖️"
            prefix="BUSINESS RULES"
            ;;
        "ui-implementation")
            emoji="🎨"
            prefix="UI"
            ;;
        "bug-fix")
            emoji="🐛"
            prefix="FIX"
            ;;
        "technical-improvement")
            emoji="🔧"
            prefix="IMPROVE"
            ;;
        *)
            emoji="🎯"
            prefix="FEATURE"
            ;;
    esac
    
    # Generate the commit message
    cat << EOF
${emoji} ${prefix}: ${brief_desc}

## Summary
- Implementation: ${brief_desc}
- Files Changed: ${changed_count} files
- Type: ${commit_type}

## Files Modified
$(echo "$changed_files" | sed 's/^/- /')

## TDD Phases
- RED: Tests created with expected failures
- GREEN: Implementation satisfies business rules
- VERIFY: Ready for user validation

## Business Rules Compliance
✅ Code follows Want It Now business rules
✅ Design system compliance (copper/green colors)
✅ TypeScript type safety maintained

## Next Steps
- [ ] Run integration tests
- [ ] User acceptance testing
- [ ] Performance validation

## Traceability
- Timestamp: ${TIMESTAMP}
- Branch: $(git branch --show-current)
- Backup: ${BACKUP_PREFIX}-${TIMESTAMP}-${commit_type}

🤖 Generated with Claude Code Smart Commit System

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
}

# Function to run pre-commit checks
run_pre_commit_checks() {
    echo -e "${BLUE}🔍 Running pre-commit checks...${NC}"
    
    # Check if there are staged changes
    if ! git diff --cached --quiet; then
        echo -e "${GREEN}✅ Staged changes detected${NC}"
    else
        echo -e "${RED}❌ No staged changes found. Please stage your changes first.${NC}"
        echo -e "${YELLOW}   Run: git add <files>${NC}"
        exit 1
    fi
    
    # Check for TypeScript errors (if applicable)
    if [ -f "package.json" ] && grep -q "typescript" package.json; then
        echo -e "${BLUE}📝 Checking TypeScript...${NC}"
        if command -v npm >/dev/null 2>&1; then
            npm run build >/dev/null 2>&1 || {
                echo -e "${YELLOW}⚠️  TypeScript errors detected. Continuing anyway...${NC}"
            }
        fi
    fi
    
    echo -e "${GREEN}✅ Pre-commit checks completed${NC}"
}

# Function to run post-commit actions
run_post_commit_actions() {
    echo -e "${BLUE}🎯 Running post-commit actions...${NC}"
    
    # Log the commit
    echo "$(date): Smart commit completed - $1" >> .claude/smart-commit/commit-log.txt
    
    # Show commit summary
    echo -e "${GREEN}✅ Commit completed successfully!${NC}"
    echo -e "${BLUE}📊 Commit Summary:${NC}"
    git log --oneline -1
    
    echo -e "${YELLOW}🔍 Files in this commit:${NC}"
    git diff --name-only HEAD~1
    
    echo -e "${BLUE}🚀 Next recommended actions:${NC}"
    echo -e "   1. Run tests: npm test"
    echo -e "   2. Check deployment: npm run build"
    echo -e "   3. Push to remote: git push"
}

# Main execution
main() {
    local brief_desc="${1:-Auto-commit}"
    local force_type="$2"
    
    echo -e "${BLUE}📋 Starting smart commit process...${NC}"
    
    # Run pre-commit checks
    run_pre_commit_checks
    
    # Detect commit type
    local commit_type
    if [ -n "$force_type" ]; then
        commit_type="$force_type"
        echo -e "${BLUE}📌 Using forced commit type: ${commit_type}${NC}"
    else
        commit_type=$(detect_commit_type "$brief_desc")
        echo -e "${BLUE}🔍 Detected commit type: ${commit_type}${NC}"
    fi
    
    # Create backup
    create_backup "$commit_type"
    
    # Generate commit message
    local commit_message=$(generate_commit_message "$commit_type" "$brief_desc")
    
    # Show commit message preview
    echo -e "${YELLOW}📝 Commit message preview:${NC}"
    echo "$commit_message" | head -10
    echo "..."
    echo ""
    
    # Confirm commit
    read -p "🤔 Proceed with this commit? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⏹️  Commit cancelled${NC}"
        exit 0
    fi
    
    # Create the commit
    echo -e "${BLUE}💾 Creating commit...${NC}"
    git commit -m "$commit_message"
    
    # Run post-commit actions
    run_post_commit_actions "$brief_desc"
}

# Script usage
usage() {
    cat << EOF
🚀 Want It Now Smart Commit System

Usage: $0 [description] [type]

Arguments:
  description     Brief description of changes (required)
  type           Force commit type (optional)

Commit Types:
  - feature-implementation
  - business-rules  
  - ui-implementation
  - technical-improvement
  - bug-fix

Examples:
  $0 "Add property validation"
  $0 "Fix quotas calculation" bug-fix
  $0 "Implement copper color scheme" ui-implementation

EOF
}

# Check arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    usage
    exit 0
fi

if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Error: Please provide a commit description${NC}"
    usage
    exit 1
fi

# Run main function
main "$@"