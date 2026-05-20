# 🚀 CV Upload - Quick Test Guide

## Start Here (2 minutes)

### Terminal 1: Start Backend
```bash
cd server
npm run dev
```

**You should see:**
```
🚀 Server ready at http://localhost:3000
```

### Terminal 2: Start Frontend
```bash
cd client
npx expo start
```

**You should see:**
```
Expo start completed successfully
Press w to open web, a for android, i for iOS
```

### Terminal 3 (Optional): Test via cURL
```bash
# Create test file
echo "My CV content" > test.txt

# Get a user ID from the app first
# Then use it here:
USER_ID="your-user-id"

# Upload
curl -X POST http://localhost:3000/api/users/$USER_ID/cv/upload \
  -F "cv=@test.txt"
```

---

## Test in App (3 minutes)

### 1. Login
- Open app in browser (press `w` in expo terminal)
- Enter any email: `test@example.com`
- Click Sign Up/Login

### 2. Go to Profile Tab
- Click **Profile** at the bottom

### 3. Upload CV
- Scroll down to "Upload CV" section
- Click **"Upload CV"** button
- Select a file (PDF, Word, or TXT)
- Wait for upload...

### 4. Check for Success
- ✅ **Success message** should appear
- ✅ **CV filename** should display below the button
- ✅ **"View Current CV"** button should appear

---

## 🔍 Monitor Console While Testing

### Browser Console (Press F12)

When you upload, you should see:
```
[Profile] Starting CV upload...
[Profile] File selected: resume.pdf
[Profile] Uploading to: http://localhost:3000/api/users/xxx/cv/upload
[Profile] Upload response: { message: 'CV uploaded successfully' ... }
```

**No messages?** → Backend not responding
**Error message?** → See CV_UPLOAD_DEBUGGING.md

### Backend Console

When file uploads, you should see:
```
[uploadCV] ========== CV UPLOAD REQUEST ==========
[uploadCV] User ID: xxx
[uploadCV] File: { name: 'resume.pdf', mime: 'application/pdf', size: 1234 }
[uploadCV] ✓ File type validation passed
[uploadCV] ✓ User found in database
[uploadCV] ✓ File saved successfully to disk
[uploadCV] ✓ Database updated successfully
[uploadCV] ========== CV UPLOAD COMPLETE ==========
```

**Missing logs?** → Request not reaching backend

---

## ✅ Success Checklist

After uploading:

- [ ] No error alerts appeared
- [ ] "CV uploaded: filename.pdf" success message shown
- [ ] Profile tab shows CV filename
- [ ] Profile tab shows upload date
- [ ] "View Current CV" button appears
- [ ] Browser console shows [Profile] logs
- [ ] Backend console shows [uploadCV] logs
- [ ] File exists in `server/uploads/`:
  ```bash
  ls -la server/uploads/
  ```
- [ ] Database has file path:
  ```bash
  psql -h localhost -p 5433 -U postgres -d job_tracker_db
  SELECT "cvFileName", "cvFilePath" FROM "UserProfile" WHERE "cvFileName" IS NOT NULL;
  ```

---

## 🐛 If Something Goes Wrong

### No success message?
→ Check browser console for [Profile] logs
→ Check backend console for [uploadCV] logs
→ See CSV_UPLOAD_DEBUGGING.md

### File not in server/uploads/?
→ Check backend logs for "File saved"
→ Check directory permissions: `chmod 755 server/uploads/`

### Database not updated?
→ Check backend logs for "DB updated"
→ Check database connection: `psql -h localhost -p 5433 -U postgres -d job_tracker_db`

### Button not triggering?
→ Check if you're logged in
→ Check browser console for any errors
→ Try refreshing the page

---

## 📊 Test Files

Use these to test:

```bash
# TXT file
echo "This is my CV in text format" > test.txt

# Large TXT file
for i in {1..100}; do echo "Line $i of my CV" >> test_large.txt; done
```

Or download:
- Sample PDF: [Example](https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table.pdf)
- Sample DOCX: Create in Word and save as .docx

---

## 🎯 Expected Results

| Step | Expected Result |
|------|-----------------|
| Click Upload CV | File picker opens |
| Select file | File name shown in picker |
| Click Upload | Loading indicator appears |
| After 1-2 seconds | Success alert appears |
| Scroll down | CV filename displays |
| See "View CV" button | Button is clickable |

---

## 📋 Quick Reference

| Action | Command |
|--------|---------|
| Start backend | `cd server && npm run dev` |
| Start frontend | `cd client && npx expo start` |
| Test with cURL | `curl -X POST http://localhost:3000/api/users/ID/cv/upload -F "cv=@file.txt"` |
| Check files | `ls -la server/uploads/` |
| Check database | `psql -h localhost -p 5433 -U postgres -d job_tracker_db -c 'SELECT "cvFileName" FROM "UserProfile";'` |
| View server logs | Watch terminal running `npm run dev` |
| View frontend logs | Open browser F12 → Console tab |

---

## 🚨 Error Messages Explained

| Error | Cause | Fix |
|-------|-------|-----|
| "Network Error: Backend not responding" | Backend not running | `cd server && npm run dev` |
| "No file uploaded" | File not selected | Try selecting again |
| "Invalid file type" | Wrong file format | Use PDF, Word, or TXT |
| "User not found" | Not logged in | Login first |
| "Failed to upload CV" | Server error | Check backend logs |

---

## 🎓 What Happens Behind the Scenes

```
1. User picks file
   ↓
2. FormData created with file
   ↓
3. axios sends POST to /api/users/:id/cv/upload
   ↓
4. Backend multer receives file (temp storage)
   ↓
5. Backend validates (file type, user)
   ↓
6. Backend moves file → /uploads/ (permanent)
   ↓
7. Backend updates database (file path stored)
   ↓
8. Backend sends success response
   ↓
9. Frontend shows success alert
   ↓
10. Frontend reloads profile data
    ↓
11. User sees CV filename on screen
    ↓
12. File is now saved forever! ✅
```

---

## 💡 Pro Tips

**Tip 1:** Check both console AND backend logs when troubleshooting

**Tip 2:** If upload hangs, check:
- Is backend still running?
- Is network connection active?
- Did you select a valid file?

**Tip 3:** Test with small files first (< 1MB)

**Tip 4:** After fixing issues, restart both frontend and backend

---

## ✨ Next Steps After Success

1. ✅ Upload CV works
2. ✅ Click "View CV" to download it
3. ✅ Try uploading another CV (should replace the old one)
4. ✅ Close and reopen app → CV should still be there!
5. ✅ Ready for future features (CV analysis, etc.)

---

**Status**: ✅ Ready to Test  
**Time**: ~5 minutes  
**Difficulty**: Easy  

🚀 **Let's go! Start with Terminal 1 above.**
