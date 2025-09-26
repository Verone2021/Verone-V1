#!/bin/bash

# 🚨 NUCLEAR RESET - EMERGENCY SECURITY PROTOCOL
# Vérone Back Office 2025 - Complete YOLO Environment Reset

set -euo pipefail

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${RED}🚨 NUCLEAR RESET PROTOCOL INITIATED${NC}"
echo "============================================="
echo -e "${YELLOW}⚠️  WARNING: This will completely destroy${NC}"
echo -e "${YELLOW}    the YOLO development environment${NC}"
echo "============================================="

# Confirmation prompt
read -p "Are you sure you want to proceed? This cannot be undone. (yes/NO): " -r
if [[ ! $REPLY =~ ^yes$ ]]; then
    echo -e "${GREEN}✅ Nuclear reset cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${RED}🚨 BEGINNING COMPLETE RESET...${NC}"

# 1. Stop and remove all YOLO containers
echo "🛑 Stopping YOLO containers..."
docker stop verone-yolo-secure 2>/dev/null || echo "  Container not running"
docker rm verone-yolo-secure 2>/dev/null || echo "  Container already removed"
echo -e "${GREEN}✅ Containers destroyed${NC}"

# 2. Remove YOLO network
echo "🌐 Removing YOLO network..."
docker network rm verone-yolo-net 2>/dev/null || echo "  Network already removed"
echo -e "${GREEN}✅ Network isolation removed${NC}"

# 3. Remove YOLO volumes
echo "💾 Removing YOLO volumes..."
docker volume rm $(docker volume ls -q | grep yolo) 2>/dev/null || echo "  No YOLO volumes found"
echo -e "${GREEN}✅ Volumes purged${NC}"

# 4. Clean Docker system (optional)
read -p "Clean entire Docker system? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Cleaning Docker system..."
    docker system prune -f
    echo -e "${GREEN}✅ Docker system cleaned${NC}"
fi

# 5. Remove temporary files
echo "🗂️ Removing temporary files..."
rm -rf /tmp/claude/* 2>/dev/null || true
rm -rf .next/cache/* 2>/dev/null || true
echo -e "${GREEN}✅ Temporary files removed${NC}"

# 6. Reset environment variables
echo "🔧 Resetting environment variables..."
unset DOCKER_MODE
unset NETWORK_ISOLATION
unset PROTECTION_LEVEL
unset ALLOWED_PATHS
echo -e "${GREEN}✅ Environment reset${NC}"

# 7. Optional: Remove health check endpoint
read -p "Remove health check endpoint? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf src/app/api/health 2>/dev/null || true
    echo -e "${GREEN}✅ Health endpoint removed${NC}"
fi

# 8. Verify clean state
echo ""
echo "🔍 Verifying clean state..."

# Check for running containers
if docker ps | grep -q "verone"; then
    echo -e "${YELLOW}⚠️ Warning: Vérone containers still running${NC}"
else
    echo -e "${GREEN}✅ No Vérone containers running${NC}"
fi

# Check for networks
if docker network ls | grep -q "verone"; then
    echo -e "${YELLOW}⚠️ Warning: Vérone networks still exist${NC}"
else
    echo -e "${GREEN}✅ No Vérone networks found${NC}"
fi

# Check for volumes
if docker volume ls | grep -q "verone\|yolo"; then
    echo -e "${YELLOW}⚠️ Warning: Vérone/YOLO volumes still exist${NC}"
else
    echo -e "${GREEN}✅ No Vérone/YOLO volumes found${NC}"
fi

echo ""
echo "============================================="
echo -e "${GREEN}🎉 NUCLEAR RESET COMPLETED${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Restart development with: npm run dev"
echo "  2. Or re-enable YOLO: .claude/security/start-yolo-mode.sh"
echo "  3. Check console for any remaining issues"
echo ""
echo "============================================="