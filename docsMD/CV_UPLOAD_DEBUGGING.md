# CV Upload - Debugging Guide

## 🔧 What We Fixed

Added comprehensive logging to help debug the CV upload issue. Now you'll see detailed messages in both frontend and backend console.

---

## 🚀 How to Debug CV Upload Issues

### Step 1: Start Backend with Logging
```bash
cd server
npm run dev
```

**Watch for these messages in the backend:**
```
[uploadCV] ========== CV UPLOAD REQUEST ==========
[uploadCV] User ID: xxx
[uploadCV] File: { name: 'resume.pdf', mime: 'application/pdf', size: xxx }
[uploadCV] ✓ File type validation passed
[uploadCV] ✓ User found in database
[uploadCV] ✓ File saved successfully to disk
[uploadCV] ✓ Database updated successfully
[uploadCV] ========== CV UPLOAD COMPLETE ==========
```

### Step 2: Start Frontend
```bash
cd client
npx expo start
```

### Step 3: Open Browser Console (F12)

**Watch for these logs when you upload:**
```
[Profile] Starting CV upload, API_BASE_URL: http://localhost:3000/api User ID: xxx
[Profile] File selected: { name: 'resume.pdf', uri: '...', type: 'application/pdf' }
[Profile] Uploading to: http://localhost:3000/api/users/xxx/cv/upload
[Profile] Upload response: { message: 'CV uploaded successfully', ... }
```

---

## 🔍 Common Issues & Solutions

### Issue 1: "Network Error: Backend not responding"

**This means:**
- Backend is not running
- Network is not connecting

**Check:**
```bash
# Verify backend is running
curl http://localhost:3000/health

# Should return: {"status":"ok","message":"Server is running"}
```

**Solution:**
```bash
cd server && npm run dev
```

---

### Issue 2: "API_BASE_URL is incorrect"

**Check frontend console for:**
```
[Profile] API_BASE_URL: undefined
```

**Solution:**
Verify `API_BASE_URL` is set correctly in [client/app/(tabs)/profile.tsx](client/app/(tabs)/profile.tsx):

```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
```

Should show: `http://localhost:3000/api`

---

### Issue 3: "Upload Failed" - No specific error

**Check server logs:**
- Look for `[uploadCV] ERROR:` messages
- Check if multer is properly configured

**Solution:**
```bash
# Restart backend
cd server && npm run dev
```

---

### Issue 4: "No file uploaded" error

**This means:**
- File selection was cancelled
- FormData is not including the file

**Check:**
```
[Profile] DocumentPicker result: (should show type: 'success')
[Profile] File selected: (should show file details)
```

**Solution:**
- Make sure you're selecting a file and not cancelling the picker
- Try with a different file format

---

### Issue 5: "User not found" error

**This means:**
- The userId in the database doesn't match
- User not logged in properly

**Check:**
```
[Profile] User ID: xxx
```

**Solution:**
1. Make sure you're logged in
2. Check database has the user:
   ```bash
   psql -h localhost -p 5433 -U postgres -d job_tracker_db
   SELECT id, email FROM "User" LIMIT 1;
   ```

---

### Issue 6: "Invalid file type" error

**This means:**
- File MIME type not recognized
- Using wrong file format

**Check:**
```
[uploadCV] File mime type: ??? | Is allowed: false
```

**Allowed types:**
- application/pdf
- application/msword
- application/vnd.openxmlformats-officedocument.wordprocessingml.document
- text/plain

**Solution:**
- Use PDF, Word (.docx), or TXT file
- Verify file extension is correct

---

## 📊 Complete Upload Flow (With Logging)

```
FRONTEND
┌─────────────────────────────────────────┐
│ 1. User clicks "Upload CV" button       │
│    [Profile] Starting CV upload...      │
│                                         │
│ 2. DocumentPicker opens                 │
│    [Profile] DocumentPicker result...   │
│                                         │
│ 3. File selected                        │
│    [Profile] File selected: resume.pdf  │
│                                         │
│ 4. FormData created                     │
│    [Profile] Uploading to: /api/...     │
│                                         │
│ 5. axios.post() sends file              │
└─────────────────────────────────────────┘
           ↓ HTTP POST ↓

BACKEND
┌─────────────────────────────────────────┐
│ 6. Request received                     │
│    [uploadCV] User ID: xxx              │
│    [uploadCV] File: resume.pdf          │
│                                         │
│ 7. Validate file type                   │
│    [uploadCV] ✓ File type OK            │
│                                         │
│ 8. Check user exists                    │
│    [uploadCV] ✓ User found              │
│                                         │
│ 9. Move file to /uploads                │
│    [uploadCV] ✓ File saved to disk      │
│                                         │
│ 10. Update database                     │
│     [uploadCV] ✓ DB updated             │
│                                         │
│ 11. Send response                       │
│     [uploadCV] ========== COMPLETE     │
└─────────────────────────────────────────┘
           ↓ JSON Response ↓

FRONTEND
┌─────────────────────────────────────────┐
│ 12. Response received                   │
│     [Profile] Upload response: success  │
│                                         │
│ 13. Show success alert                  │
│     "Success: CV uploaded: resume.pdf"  │
│                                         │
│ 14. Reload profile                      │
│     [Profile] Loading profile...        │
│                                         │
│ 15. Show CV info on screen              │
│     CV Filename: resume.pdf             │
│     Uploaded: Apr 13, 2026              │
└─────────────────────────────────────────┘
```

---

## 🎯 Step-by-Step Debugging

### If upload fails:

**Step 1:** Check browser console (F12)
- Copy any error messages
- Look for `[Profile]` logs

**Step 2:** Check server console
- Look for `[uploadCV]` logs
- Find where it stops

**Step 3:** Based on where it stops:
- **No upload request logged**: Network/Frontend issue
- **"No file uploaded"**: FormData issue
- **"User not found"**: Database issue
- **"File type error"**: MIME type issue
- **Database error**: Prisma/DB connection issue

**Step 4:** Use the solutions above for your specific error

---

## 📝 Test Commands

### Quick Test
```bash
# Create a test file
echo "This is my CV" > test.txt

# Get a user ID from database
psql -h localhost -p 5433 -U postgres -d job_tracker_db
SELECT id FROM "User" LIMIT 1;

# Upload the file
USER_ID="xxx"  # Replace with actual ID
curl -X POST http://localhost:3000/api/users/$USER_ID/cv/upload \
  -F "cv=@test.txt"

# Should see:
# {"message":"CV uploaded successfully",...}
```

---

## 🧹 Clean Up & Reset

### Reset CV uploads (if needed)
```bash
# Remove all uploaded files
rm -rf server/uploads/

# Clear CV data from database
psql -h localhost -p 5433 -U postgres -d job_tracker_db
UPDATE "UserProfile" SET "cvFileName" = NULL, "cvFilePath" = NULL, "cvParsedText" = NULL;
```

---

## ✅ Verification

**Everything is working if you see:**

1. ✅ Frontend uploads file without error
2. ✅ Backend logs show each step
3. ✅ Success alert appears
4. ✅ CV info displays on Profile tab
5. ✅ File exists in `server/uploads/`
6. ✅ File path saved in database

---

## 📞 Logs to Check

| Component | File | Search For |
|-----------|------|-----------|
| Frontend Upload | Browser console (F12) | `[Profile]` |
| Backend Upload | Terminal running `npm run dev` | `[uploadCV]` |
| Database | Prisma Studio | UserProfile table |
| Files | File system | `server/uploads/` |

---

## 🚀 Next Steps

1. Start backend: `cd server && npm run dev`
2. Start frontend: `cd client && npx expo start`
3. Open browser console: Press **F12**
4. Try uploading a CV file
5. Check logs for errors
6. Use this guide to debug any issues

**Good luck! 🎉**
