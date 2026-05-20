#!/bin/bash

# CV Persistence - Quick Verification Script
# This script verifies all CV persistence components are properly configured

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        CV PERSISTENCE - VERIFICATION SCRIPT                ║"
echo "║                                                            ║"
echo "║  This script checks all components for CV upload,          ║"
echo "║  storage, and retrieval functionality.                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

PROJECT_ROOT="$(pwd)"
BACKEND_DIR="$PROJECT_ROOT/server"
FRONTEND_DIR="$PROJECT_ROOT/client"
PRISMA_DIR="$BACKEND_DIR/prisma"

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

check_passed() {
  echo -e "${GREEN}✓${NC} $1"
}

check_failed() {
  echo -e "${RED}✗${NC} $1"
}

check_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

check_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

FAILED_CHECKS=0

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. DATABASE SCHEMA VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check schema.prisma file
if [ -f "$PRISMA_DIR/schema.prisma" ]; then
  check_passed "schema.prisma exists"
  
  # Check for UserProfile model
  if grep -q "model UserProfile" "$PRISMA_DIR/schema.prisma"; then
    check_passed "UserProfile model defined"
  else
    check_failed "UserProfile model not found"
    ((FAILED_CHECKS++))
  fi
  
  # Check for CV fields
  if grep -q "cvFilePath" "$PRISMA_DIR/schema.prisma"; then
    check_passed "cvFilePath field exists"
  else
    check_failed "cvFilePath field missing"
    ((FAILED_CHECKS++))
  fi
  
  if grep -q "cvFileName" "$PRISMA_DIR/schema.prisma"; then
    check_passed "cvFileName field exists"
  else
    check_failed "cvFileName field missing"
    ((FAILED_CHECKS++))
  fi
  
  if grep -q "cvParsedText" "$PRISMA_DIR/schema.prisma"; then
    check_passed "cvParsedText field exists"
  else
    check_failed "cvParsedText field missing"
    ((FAILED_CHECKS++))
  fi
else
  check_failed "schema.prisma not found"
  ((FAILED_CHECKS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. BACKEND CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

APP_FILE="$BACKEND_DIR/src/app.ts"
if [ -f "$APP_FILE" ]; then
  check_passed "app.ts exists"
  
  # Check for static file serving
  if grep -q "'/uploads'" "$APP_FILE" && grep -q "express.static" "$APP_FILE"; then
    check_passed "Static file serving configured (/uploads)"
  else
    check_failed "Static file serving not configured"
    ((FAILED_CHECKS++))
  fi
else
  check_failed "app.ts not found"
  ((FAILED_CHECKS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. MULTER CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ROUTES_FILE="$BACKEND_DIR/src/routes/userRoutes.ts"
if [ -f "$ROUTES_FILE" ]; then
  check_passed "userRoutes.ts exists"
  
  if grep -q "multer" "$ROUTES_FILE"; then
    check_passed "Multer imported"
  else
    check_failed "Multer not imported"
    ((FAILED_CHECKS++))
  fi
  
  if grep -q "upload.single" "$ROUTES_FILE"; then
    check_passed "Single file upload middleware configured"
  else
    check_failed "Single file upload middleware not configured"
    ((FAILED_CHECKS++))
  fi
else
  check_failed "userRoutes.ts not found"
  ((FAILED_CHECKS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. UPLOAD CONTROLLER IMPLEMENTATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

CONTROLLER_FILE="$BACKEND_DIR/src/controllers/userController.ts"
if [ -f "$CONTROLLER_FILE" ]; then
  check_passed "userController.ts exists"
  
  if grep -q "export const uploadCV" "$CONTROLLER_FILE"; then
    check_passed "uploadCV function exported"
  else
    check_failed "uploadCV function not exported"
    ((FAILED_CHECKS++))
  fi
  
  if grep -q "fs.renameSync" "$CONTROLLER_FILE"; then
    check_passed "File persistence (fs.renameSync) implemented"
  else
    check_failed "File persistence not implemented"
    ((FAILED_CHECKS++))
  fi
  
  if grep -q "prisma.userProfile.upsert" "$CONTROLLER_FILE"; then
    check_passed "Database update (upsert) implemented"
  else
    check_failed "Database update not implemented"
    ((FAILED_CHECKS++))
  fi
  
  if grep -q "export const getCV" "$CONTROLLER_FILE"; then
    check_passed "getCV download function implemented"
  else
    check_failed "getCV download function missing"
    ((FAILED_CHECKS++))
  fi
else
  check_failed "userController.ts not found"
  ((FAILED_CHECKS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. FRONTEND COMPONENTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PROFILE_FILE="$FRONTEND_DIR/app/(tabs)/profile.tsx"
if [ -f "$PROFILE_FILE" ]; then
  check_passed "profile.tsx exists"
  
  if grep -q "DocumentPicker" "$PROFILE_FILE"; then
    check_passed "DocumentPicker integrated"
  else
    check_failed "DocumentPicker not integrated"
    ((FAILED_CHECKS++))
  fi
  
  if grep -q "axios.post" "$PROFILE_FILE" && grep -q "cv/upload" "$PROFILE_FILE"; then
    check_passed "CV upload handler implemented"
  else
    check_failed "CV upload handler missing"
    ((FAILED_CHECKS++))
  fi
  
  if grep -q "FormData" "$PROFILE_FILE"; then
    check_passed "FormData for file upload used"
  else
    check_failed "FormData not used"
    ((FAILED_CHECKS++))
  fi
else
  check_failed "profile.tsx not found"
  ((FAILED_CHECKS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. API ROUTES VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "$ROUTES_FILE" ]; then
  # Check POST upload endpoint
  if grep -q "post.*cv/upload" "$ROUTES_FILE"; then
    check_passed "POST /:userId/cv/upload endpoint configured"
  else
    check_failed "POST /:userId/cv/upload endpoint missing"
    ((FAILED_CHECKS++))
  fi
  
  # Check GET download endpoint
  if grep -q "get.*cv/download" "$ROUTES_FILE"; then
    check_passed "GET /:userId/cv/download endpoint configured"
  else
    check_failed "GET /:userId/cv/download endpoint missing"
    ((FAILED_CHECKS++))
  fi
  
  # Check profile endpoints
  if grep -q "get.*profile" "$ROUTES_FILE"; then
    check_passed "GET /:userId/profile endpoint configured"
  else
    check_failed "GET /:userId/profile endpoint missing"
    ((FAILED_CHECKS++))
  fi
  
  if grep -q "patch.*profile" "$ROUTES_FILE"; then
    check_passed "PATCH /:userId/profile endpoint configured"
  else
    check_failed "PATCH /:userId/profile endpoint missing"
    ((FAILED_CHECKS++))
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. DEPENDENCIES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Backend dependencies
BACKEND_PKG="$BACKEND_DIR/package.json"
if [ -f "$BACKEND_PKG" ]; then
  if grep -q "multer" "$BACKEND_PKG"; then
    check_passed "multer installed (backend)"
  else
    check_warning "multer not in package.json (may need npm install)"
  fi
  
  if grep -q "prisma" "$BACKEND_PKG"; then
    check_passed "prisma installed (backend)"
  else
    check_failed "prisma not installed"
    ((FAILED_CHECKS++))
  fi
fi

# Frontend dependencies
FRONTEND_PKG="$FRONTEND_DIR/package.json"
if [ -f "$FRONTEND_PKG" ]; then
  if grep -q "axios" "$FRONTEND_PKG"; then
    check_passed "axios installed (frontend)"
  else
    check_failed "axios not installed"
    ((FAILED_CHECKS++))
  fi
  
  if grep -q "document-picker" "$FRONTEND_PKG"; then
    check_passed "expo-document-picker installed (frontend)"
  else
    check_failed "expo-document-picker not installed"
    ((FAILED_CHECKS++))
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. FILE STRUCTURE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d "$PROJECT_ROOT" ]; then
  check_passed "Project root exists"
fi

if [ -d "$BACKEND_DIR" ]; then
  check_passed "Backend directory exists"
fi

if [ -d "$FRONTEND_DIR" ]; then
  check_passed "Frontend directory exists"
fi

if [ -d "$PRISMA_DIR" ]; then
  check_passed "Prisma directory exists"
fi

# Check if uploads directory needs to be created
UPLOADS_DIR="$BACKEND_DIR/uploads"
if [ -d "$UPLOADS_DIR" ]; then
  check_passed "uploads/ directory exists"
  FILE_COUNT=$(ls -1 "$UPLOADS_DIR" 2>/dev/null | wc -l)
  check_info "Files in uploads/: $FILE_COUNT"
else
  check_warning "uploads/ directory doesn't exist yet (will be created on first upload)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9. TYPESCRIPT COMPILATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if command -v npx &> /dev/null; then
  check_info "Checking backend TypeScript..."
  if (cd "$BACKEND_DIR" && npx tsc --noEmit 2>/dev/null); then
    check_passed "Backend TypeScript: No errors"
  else
    check_warning "Backend TypeScript: Has errors (check with: cd server && npx tsc --noEmit)"
  fi
else
  check_warning "npx not found, skipping TypeScript check"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed!${NC}"
  echo ""
  echo "Your CV persistence system is properly configured."
  echo "You can now proceed with testing:"
  echo ""
  echo "  1. Start backend:  cd server && npm run dev"
  echo "  2. Start frontend: cd client && npx expo start"
  echo "  3. Follow: CV_PERSISTENCE_TESTING.md"
  echo ""
else
  echo -e "${RED}✗ $FAILED_CHECKS check(s) failed${NC}"
  echo ""
  echo "Please fix the issues above before proceeding."
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit $FAILED_CHECKS
