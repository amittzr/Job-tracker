#!/bin/bash

# System Refactoring Verification Script
# Verifies that all components of the unified Profile Tab refactoring are in place

echo "================================"
echo "System Refactoring Verification"
echo "================================"
echo ""

ERRORS=0
WARNINGS=0

# Helper functions
check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1 exists"
        return 0
    else
        echo "❌ $1 MISSING"
        ((ERRORS++))
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo "✅ $1 directory exists"
        return 0
    else
        echo "❌ $1 directory MISSING"
        ((ERRORS++))
        return 1
    fi
}

check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo "✅ $1 contains '$2'"
        return 0
    else
        echo "⚠️  $1 might be missing '$2'"
        ((WARNINGS++))
        return 1
    fi
}

# Section 1: Frontend Files
echo ""
echo "=== Frontend Files ==="
echo ""

check_file "client/app/(tabs)/profile.tsx"
check_content "client/app/(tabs)/profile.tsx" "const ProfileTab"
check_content "client/app/(tabs)/profile.tsx" "handleUploadCV"
check_content "client/app/(tabs)/profile.tsx" "useIsFocused"

# Section 2: Updated Navigation
echo ""
echo "=== Navigation Files ==="
echo ""

check_file "client/app/(tabs)/_layout.tsx"
check_content "client/app/(tabs)/_layout.tsx" "name=\"profile\""

check_file "client/app/_layout.tsx"
check_content "client/app/_layout.tsx" "Stack"

# Section 3: Backend Files
echo ""
echo "=== Backend Files ==="
echo ""

check_file "server/src/app.ts"
check_content "server/src/app.ts" "app.use('/uploads'"
check_content "server/src/app.ts" "express.static"

check_file "server/src/controllers/userController.ts"
check_content "server/src/controllers/userController.ts" "uploadCV"
check_content "server/src/controllers/userController.ts" "fs.renameSync"

# Section 4: Database Files
echo ""
echo "=== Database Files ==="
echo ""

check_file "server/prisma/schema.prisma"
check_content "server/prisma/schema.prisma" "UserProfile"

# Section 5: Documentation
echo ""
echo "=== Documentation Files ==="
echo ""

check_file "REFACTORING_GUIDE.md"
check_file "TESTING_GUIDE.md"
check_file "REFACTORING_SUMMARY.md"

# Section 6: Configuration
echo ""
echo "=== Configuration Files ==="
echo ""

check_file "package.json"
check_file "client/package.json"
check_file "server/package.json"

# Section 7: Key Features Verification
echo ""
echo "=== Key Features Verification ==="
echo ""

echo "Checking Frontend Features:"
check_content "client/app/(tabs)/profile.tsx" "fullName"
check_content "client/app/(tabs)/profile.tsx" "DocumentPicker"
check_content "client/app/(tabs)/profile.tsx" "cvFileName"

echo ""
echo "Checking Backend Features:"
check_content "server/src/controllers/userController.ts" "cvFilePath"
check_content "server/src/controllers/userController.ts" "cvParsedText"
check_content "server/src/controllers/userController.ts" "file validation"

# Section 8: TypeScript Compilation Check (if dev environment available)
echo ""
echo "=== TypeScript Check ==="
echo ""

if command -v tsc &> /dev/null; then
    echo "Checking for TypeScript errors..."
    TSC_OUTPUT=$(tsc --noEmit 2>&1)
    if echo "$TSC_OUTPUT" | grep -q "error"; then
        echo "⚠️  TypeScript errors found:"
        echo "$TSC_OUTPUT" | grep "error" | head -5
        ((WARNINGS++))
    else
        echo "✅ No TypeScript errors"
    fi
else
    echo "⚠️  TypeScript CLI not available"
fi

# Section 9: Directory Structure
echo ""
echo "=== Directory Structure Check ==="
echo ""

check_dir "client/app/(tabs)"
check_dir "client/app/job"
check_dir "server/src/controllers"
check_dir "server/src/routes"
check_dir "server/prisma"

# Summary
echo ""
echo "================================"
echo "Verification Summary"
echo "================================"
echo ""
echo "Errors:   $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✅ All critical components verified!"
    if [ $WARNINGS -eq 0 ]; then
        echo "✅ No warnings!"
    else
        echo "⚠️  Some warnings detected - review above"
    fi
    exit 0
else
    echo "❌ Critical issues found - review above"
    exit 1
fi
