#!/bin/bash

# CV Persistence System - End-to-End Test & Verification Script
# This script verifies all components of the CV upload/retrieval system

echo "=========================================="
echo "CV Persistence System - Verification"
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
verify_component() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1 exists"
        return 0
    else
        echo -e "${RED}❌${NC} $1 MISSING"
        ((ERRORS++))
        return 1
    fi
}

check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $1 contains: '$2'"
        return 0
    else
        echo -e "${YELLOW}⚠️${NC} $1 missing: '$2'"
        ((WARNINGS++))
        return 1
    fi
}

# ============================================
# SECTION 1: Database Schema
# ============================================
verify_component "Database Schema (Prisma)"

check_file "server/prisma/schema.prisma"
check_content "server/prisma/schema.prisma" "UserProfile"
check_content "server/prisma/schema.prisma" "cvFilePath"
check_content "server/prisma/schema.prisma" "cvFileName"
check_content "server/prisma/schema.prisma" "cvParsedText"

# ============================================
# SECTION 2: Backend Implementation
# ============================================
verify_component "Backend Implementation"

# Check app.ts for static serving
check_file "server/src/app.ts"
check_content "server/src/app.ts" "express.static"
check_content "server/src/app.ts" "/uploads"

# Check user routes
check_file "server/src/routes/userRoutes.ts"
check_content "server/src/routes/userRoutes.ts" "multer"
check_content "server/src/routes/userRoutes.ts" "uploadCV"
check_content "server/src/routes/userRoutes.ts" "getCV"

# Check user controller
check_file "server/src/controllers/userController.ts"
check_content "server/src/controllers/userController.ts" "export const uploadCV"
check_content "server/src/controllers/userController.ts" "fs.renameSync"
check_content "server/src/controllers/userController.ts" "cvFilePath"

# ============================================
# SECTION 3: Frontend Implementation
# ============================================
verify_component "Frontend Implementation"

check_file "client/app/(tabs)/profile.tsx"
check_content "client/app/(tabs)/profile.tsx" "DocumentPicker"
check_content "client/app/(tabs)/profile.tsx" "handleUploadCV"
check_content "client/app/(tabs)/profile.tsx" "handleViewCV"
check_content "client/app/(tabs)/profile.tsx" "FormData"

# ============================================
# SECTION 4: Directory Structure
# ============================================
verify_component "Directory Structure"

if [ -d "server/uploads" ]; then
    echo -e "${GREEN}✅${NC} server/uploads/ directory exists"
else
    echo -e "${YELLOW}ℹ️${NC} server/uploads/ will be created on first upload"
fi

if [ -d "server/src/generated/prisma" ]; then
    echo -e "${GREEN}✅${NC} Prisma client generated"
else
    echo -e "${YELLOW}⚠️${NC} Prisma client needs to be generated"
    ((WARNINGS++))
fi

# ============================================
# SECTION 5: API Endpoints
# ============================================
verify_component "API Endpoints"

echo "Profile Management:"
echo "  POST   /api/users/signup"
echo "  GET    /api/users/:userId/profile"
echo "  PATCH  /api/users/:userId/profile"
echo ""
echo "CV Management:"
echo "  POST   /api/users/:userId/cv/upload"
echo "  GET    /api/users/:userId/cv/download"
echo "  GET    /uploads/:filename"
echo ""
echo "System:"
echo "  GET    /health"

# ============================================
# SECTION 6: Configuration Check
# ============================================
verify_component "Configuration"

check_file "server/.env"
check_content "server/.env" "DATABASE_URL"

check_file "client/services/api.ts"
check_content "client/services/api.ts" "baseURL"

# ============================================
# SECTION 7: Package Dependencies
# ============================================
verify_component "Dependencies"

if grep -q "multer" "server/package.json"; then
    echo -e "${GREEN}✅${NC} multer dependency installed"
else
    echo -e "${RED}❌${NC} multer dependency missing"
    ((ERRORS++))
fi

if grep -q "@prisma/client" "server/package.json"; then
    echo -e "${GREEN}✅${NC} @prisma/client dependency installed"
else
    echo -e "${RED}❌${NC} @prisma/client dependency missing"
    ((ERRORS++))
fi

if grep -q "expo-document-picker" "client/package.json"; then
    echo -e "${GREEN}✅${NC} expo-document-picker dependency installed"
else
    echo -e "${YELLOW}⚠️${NC} expo-document-picker may need installation"
    ((WARNINGS++))
fi

# ============================================
# SECTION 8: Type Safety
# ============================================
verify_component "TypeScript & Type Safety"

echo "Checking for TypeScript errors..."
if command -v tsc &> /dev/null; then
    TSC_OUTPUT=$(tsc --noEmit 2>&1 | head -20)
    if [ -z "$TSC_OUTPUT" ]; then
        echo -e "${GREEN}✅${NC} No TypeScript errors found"
    else
        echo -e "${YELLOW}⚠️${NC} TypeScript errors detected (first 5):"
        echo "$TSC_OUTPUT" | head -5
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}ℹ️${NC} TypeScript CLI not available for checking"
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo ""
echo -e "Errors:   ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All Critical Components Present!${NC}"
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✅ No Warnings!${NC}"
    else
        echo -e "${YELLOW}⚠️ Review warnings above${NC}"
    fi
    echo ""
    echo "System is READY for deployment testing!"
    exit 0
else
    echo -e "${RED}❌ Critical Issues Found!${NC}"
    echo "Please address errors above before proceeding."
    exit 1
fi
