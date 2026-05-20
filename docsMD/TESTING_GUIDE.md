# Quick Start: Unified Profile Tab Testing

## Prerequisites
- PostgreSQL running on `localhost:5433`
- Node.js v20+ installed
- Expo CLI installed
- Updated machine IP in `client/services/api.ts`

---

## 1. Start the Backend Server

```bash
cd server
npm install
npm run dev
```

Expected output:
```
🚀 Server ready at http://localhost:3000
```

---

## 2. Start the Frontend

```bash
cd client
npm install
npx expo start
```

Press `w` for web or scan QR code for mobile.

---

## 3. Test Workflow

### Step 1: Login
1. Navigate to login screen
2. Enter test email: `test@example.com`
3. Click Sign Up/Login

### Step 2: Access Profile Tab
1. Bottom tab bar shows: **My Jobs | Profile | Dashboard**
2. Click **Profile** tab

Expected:
- Profile header displays "test" (email prefix)
- Shows email address
- Form fields are empty

### Step 3: Complete Profile
1. Enter Full Name: `Test User`
2. Enter Professional Title: `Software Engineer`
3. Enter Contact: `+1234567890`
4. Enter Skills: `JavaScript, React, Node.js`
5. Click **Save Profile**

Expected:
- Success alert appears
- Profile reloads with saved data

### Step 4: Upload CV
1. Click **Upload CV** button
2. Select a file (PDF, Word, or TXT)
3. Wait for upload to complete

Expected:
- Success alert appears
- CV filename and date display in CV card
- **View Current CV** button appears

### Step 5: View CV
1. Click **View Current CV** button
2. File download dialog appears (or opens file viewer)

Expected:
- File accessible and downloadable
- Correct filename preserved

### Step 6: Update Profile
1. Change one field (e.g., add new skill)
2. Click **Save Profile**
3. Verify changes persist

### Step 7: Test Refresh
1. Pull down to refresh the profile tab
2. Verify all data reloads correctly

### Step 8: Test Persistence
1. Close the app completely
2. Reopen and log in again
3. Open Profile tab

Expected:
- All profile data persists
- CV information still displays
- File remains accessible

---

## 4. API Testing (with cURL)

### Get Profile
```bash
curl -X GET http://localhost:3000/api/users/1fba5933-6f98-49d6-ab46-ba9c12cb4be4/profile \
  -H "Content-Type: application/json"
```

Expected Response:
```json
{
  "id": "...",
  "userId": "1fba5933-6f98-49d6-ab46-ba9c12cb4be4",
  "fullName": "Test User",
  "professionalTitle": "Software Engineer",
  "contactInfo": "+1234567890",
  "skills": "[\"JavaScript\",\"React\",\"Node.js\"]",
  "cvFileName": "resume.pdf",
  "cvFilePath": "/absolute/path/to/resume.pdf",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Update Profile
```bash
curl -X PATCH http://localhost:3000/api/users/1fba5933-6f98-49d6-ab46-ba9c12cb4be4/profile \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Updated Name",
    "professionalTitle": "Senior Engineer",
    "contactInfo": "+9876543210",
    "skills": ["JavaScript", "TypeScript", "React", "Node.js"]
  }'
```

### Upload CV (File Required)
```bash
curl -X POST http://localhost:3000/api/users/1fba5933-6f98-49d6-ab46-ba9c12cb4be4/cv/upload \
  -F "cv=@/path/to/resume.pdf"
```

Expected Response:
```json
{
  "message": "CV uploaded successfully",
  "profile": {
    "cvFileName": "resume.pdf",
    "cvUrl": "/uploads/userid_timestamp_resume.pdf",
    "updatedAt": "..."
  }
}
```

### Download CV
```bash
curl -X GET http://localhost:3000/api/users/1fba5933-6f98-49d6-ab46-ba9c12cb4be4/cv/download \
  -o downloaded_cv.pdf
```

### Access CV Directly
```bash
curl -X GET http://localhost:3000/uploads/userid_timestamp_resume.pdf \
  -o direct_access_cv.pdf
```

---

## 5. Database Verification

### Connect to PostgreSQL
```bash
psql -h localhost -p 5433 -U postgres -d job_tracker_db
```

### Check UserProfile Table
```sql
SELECT id, "userId", "fullName", "cvFileName", "updatedAt" 
FROM "UserProfile" 
ORDER BY "updatedAt" DESC;
```

### Verify File Storage
```bash
ls -lah server/uploads/
```

Expected:
- Files named: `userid_timestamp_filename`
- Multiple files for multiple uploads

---

## 6. Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Profile data empty on load | Verify user ID is saved in AsyncStorage during login |
| File upload fails with 404 | Check if user ID in URL matches logged-in user |
| CV file not showing | Verify file exists in `server/uploads/` directory |
| Download returns 404 | Ensure `/uploads` static route is configured in `app.ts` |
| CORS error on file upload | Check CORS middleware is enabled in Express app |
| Profile tab missing | Verify `profile.tsx` exists in `client/app/(tabs)/` |

---

## 7. Performance Notes

- Profile data loads on tab focus (~100-200ms)
- File upload time depends on file size and network speed
- CV text extraction: instant for TXT, placeholder for PDF/Word
- Database queries indexed on userId for fast retrieval

---

## 8. Next Steps After Testing

1. **Deploy Backend**: Move to staging/production server
2. **Update API URLs**: Configure for production domain
3. **Cloud Storage**: Migrate file uploads to S3/GCS
4. **PDF Parsing**: Integrate pdfjs-dist for text extraction
5. **Mobile Build**: Generate APK/IPA for app stores
6. **Monitoring**: Set up logging and error tracking

---

## Success Criteria

✅ Profile data persists after app restart  
✅ CV files accessible via both routes  
✅ Form validation prevents empty submissions  
✅ Loading states show during operations  
✅ Error messages are user-friendly  
✅ Email prefix auto-populates name field  
✅ Multiple uploads work without conflicts  
✅ Database records maintain file references  

---

## Support

For issues or questions:
1. Check logs: `npm run dev` output in terminal
2. Verify database connection in `.env`
3. Ensure all dependencies installed: `npm install`
4. Check file permissions: `ls -l server/uploads/`
5. Test API endpoint directly with cURL

Good luck! 🚀
