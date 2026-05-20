# CV Persistence - Quick Start Guide ⚡

## 5-Minute Setup

### Start Backend
```bash
cd server && npm run dev
```
Expected: `🚀 Server ready at http://localhost:3000`

### Start Frontend
```bash
cd client && npx expo start
```
Expected: QR code displayed

### Verify Everything
```bash
bash verify_cv_persistence_detailed.sh
```
Expected: All checks ✓ pass

---

## Test in 1 Minute (cURL)

```bash
USER_ID="1fba5933-6f98-49d6-ab46-ba9c12cb4be4"

# 1. Create test file
echo "Test CV Content" > test.txt

# 2. Upload
curl -X POST http://localhost:3000/api/users/$USER_ID/cv/upload \
  -F "cv=@test.txt"

# 3. Download
curl -X GET http://localhost:3000/api/users/$USER_ID/cv/download

# 4. List files
ls -la server/uploads/
```

---

## System Architecture

```
Frontend (React Native)
  ↓ (DocumentPicker)
Multer (temp storage)
  ↓ (fs.renameSync)
/uploads/ (permanent)
  ↓ (database link)
UserProfile (PostgreSQL)
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/users/:id/cv/upload` | Upload file |
| GET | `/api/users/:id/cv/download` | Download file |
| GET | `/uploads/:filename` | Direct access |
| GET | `/api/users/:id/profile` | Get profile+CV info |
| PATCH | `/api/users/:id/profile` | Update profile |

---

## Key Files

| Path | Purpose |
|------|---------|
| `server/src/app.ts` | Static serving (/uploads) |
| `server/src/controllers/userController.ts` | Upload/download logic |
| `server/src/routes/userRoutes.ts` | API routes |
| `server/prisma/schema.prisma` | CV database fields |
| `client/app/(tabs)/profile.tsx` | Upload UI component |

---

## What Gets Saved

**File System**: `server/uploads/userid_timestamp_filename.pdf`  
**Database**: UserProfile.cvFilePath, cvFileName, cvParsedText  
**Accessible**: `/uploads/filename` + `/api/users/:id/cv/download`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No such file: uploads | First upload creates it automatically |
| Cannot find multer | `cd server && npm install` |
| File not in database | `cd server && npx prisma generate` |
| Backend not starting | Check port 3000 isn't in use |

---

## Complete Testing

See [CV_PERSISTENCE_TESTING.md](CV_PERSISTENCE_TESTING.md) for:
- 11-part testing guide
- cURL examples
- Error handling tests
- Performance tests

See [CV_PERSISTENCE_IMPLEMENTATION.md](CV_PERSISTENCE_IMPLEMENTATION.md) for:
- Full technical documentation
- Code walkthrough
- Architecture details

---

**Status**: ✅ Ready for Testing  
**Quick Start**: 5 minutes  
**Full Testing**: 2 hours
