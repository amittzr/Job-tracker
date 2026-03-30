#!/bin/bash
# Quick Verification Script for Job Tracker AI Fix

echo "=========================================="
echo "Job Tracker AI - Verification Checklist"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: aiService.ts exists and has proper code
echo "1. Checking aiService.ts..."
if grep -q "fetchWebText" "server/src/services/aiService.ts" && \
   grep -q "response_mime_type" "server/src/services/aiService.ts" && \
   grep -q "cheerio" "server/src/services/aiService.ts"; then
  echo -e "${GREEN}✓ aiService.ts properly updated${NC}"
else
  echo -e "${RED}✗ aiService.ts has issues${NC}"
fi
echo ""

# Check 2: jobController.ts has auto-add function
echo "2. Checking jobController.ts..."
if grep -q "autoCreateJob" "server/src/controllers/jobController.ts" && \
   grep -q "status: \"pending\"" "server/src/controllers/jobController.ts"; then
  echo -e "${GREEN}✓ jobController.ts properly updated${NC}"
else
  echo -e "${RED}✗ jobController.ts has issues${NC}"
fi
echo ""

# Check 3: jobRoutes.ts has correct order
echo "3. Checking jobRoutes.ts route order..."
if grep -q "router.post('/auto-add'" "server/src/routes/jobRoutes.ts"; then
  # Check if auto-add comes before :userId
  auto_add_line=$(grep -n "router.post('/auto-add'" "server/src/routes/jobRoutes.ts" | cut -d: -f1)
  user_id_line=$(grep -n "router.get('/:userId'" "server/src/routes/jobRoutes.ts" | cut -d: -f1)
  
  if [ -z "$auto_add_line" ] || [ -z "$user_id_line" ]; then
    echo -e "${YELLOW}⚠ Could not verify route order${NC}"
  elif [ "$auto_add_line" -lt "$user_id_line" ]; then
    echo -e "${GREEN}✓ jobRoutes.ts routes are in correct order${NC}"
  else
    echo -e "${RED}✗ /auto-add route must come BEFORE /:userId${NC}"
  fi
else
  echo -e "${RED}✗ /auto-add route not found${NC}"
fi
echo ""

# Check 4: api.ts has proper logging
echo "4. Checking client/services/api.ts..."
if grep -q "console.log.*userId" "client/services/api.ts" && \
   grep -q "error.response" "client/services/api.ts"; then
  echo -e "${GREEN}✓ api.ts has enhanced error logging${NC}"
else
  echo -e "${RED}✗ api.ts may have issues${NC}"
fi
echo ""

# Check 5: index.tsx has English error messages
echo "5. Checking frontend error handling..."
if grep -q "Please enter a valid URL" "client/app/(tabs)/index.tsx" && \
   grep -q "User not found" "client/app/(tabs)/index.tsx"; then
  echo -e "${GREEN}✓ Frontend error messages are in English${NC}"
else
  echo -e "${RED}✗ Frontend error messages may need updates${NC}"
fi
echo ""

# Check 6: No Hebrew comments in TypeScript files
echo "6. Checking for mixed language comments (this is a warning)..."
hebrew_found=0
for file in server/src/services/aiService.ts server/src/controllers/jobController.ts; do
  if grep -q '[א-ת]' "$file" 2>/dev/null; then
    hebrew_found=$((hebrew_found + 1))
  fi
done

if [ $hebrew_found -eq 0 ]; then
  echo -e "${GREEN}✓ No Hebrew text in main code files${NC}"
else
  echo -e "${YELLOW}⚠ Found Hebrew text in $hebrew_found file(s) - may be in old comments${NC}"
fi
echo ""

# Check 7: package.json dependencies
echo "7. Checking server dependencies..."
if grep -q "cheerio" "server/package.json" && \
   grep -q "axios" "server/package.json"; then
  echo -e "${GREEN}✓ Required dependencies are in package.json${NC}"
else
  echo -e "${YELLOW}⚠ Missing dependencies - may need: npm install cheerio axios${NC}"
fi
echo ""

# Check 8: Environment variables
echo "8. Checking environment setup..."
if [ -f "server/.env" ]; then
  if grep -q "GEMINI_API_KEY" "server/.env"; then
    echo -e "${GREEN}✓ GEMINI_API_KEY is configured${NC}"
  else
    echo -e "${RED}✗ GEMINI_API_KEY not set in .env${NC}"
  fi
else
  echo -e "${RED}✗ server/.env file not found${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. [ ] Run: cd server && npm install"
echo "2. [ ] Update DEV_MACHINE_IP in client/services/api.ts"
echo "3. [ ] Verify user ID exists in database"
echo "4. [ ] Test with a real job posting URL"
echo ""
echo "To test the API:"
echo ""
echo "curl -X POST http://localhost:3000/api/jobs/auto-add \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"url\": \"https://...\", \"userId\": \"1fba5933-6f98-49d6-ab46-ba9c12cb4be4\"}'"
echo ""
echo "=========================================="
