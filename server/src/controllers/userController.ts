import { Request, Response } from 'express';
import prisma from '../config/db.js';
import fs from 'fs';
import path from 'path';

// Ensure uploads directory exists on startup
const UPLOADS_DIR = path.resolve('uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('[Server] Created uploads/ directory at:', UPLOADS_DIR);
}

/**
 * User Signup - Create or retrieve user by email
 */
export const signup = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email }
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
};

/**
 * Get User Profile - Retrieve user profile by userId
 */
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req.params.userId as string);

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!profile) {
      return res.status(404).json({ error: "User profile not found" });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error("[User Controller] Error fetching profile:", error);
    res.status(500).json({ error: "Failed to retrieve profile" });
  }
};

/**
 * Update or Create User Profile - Save user profile details
 */
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { fullName, professionalTitle, contactInfo, skills } = req.body;

    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        fullName,
        professionalTitle,
        contactInfo,
        skills: Array.isArray(skills) ? JSON.stringify(skills) : skills,
        updatedAt: new Date()
      },
      create: {
        userId,
        fullName,
        professionalTitle,
        contactInfo,
        skills: Array.isArray(skills) ? JSON.stringify(skills) : skills
      }
    });

    res.status(200).json({ message: "Profile updated successfully", profile });
  } catch (error) {
    console.error("[User Controller] Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

/**
 * Extract text from a file based on its MIME type.
 * - text/plain  → read directly
 * - application/pdf → use pdf-parse (install: npm i pdf-parse @types/pdf-parse)
 * - docx        → use mammoth  (install: npm i mammoth)
 * Falls back to a placeholder so the upload never fails.
 */
async function extractTextFromFile(filePath: string, mimeType: string, originalName: string): Promise<string> {
  try {
    if (mimeType === 'text/plain') {
      return fs.readFileSync(filePath, 'utf-8');
    }

    if (mimeType === 'application/pdf') {
      // Dynamically import so the app still boots even if pdf-parse isn't installed yet
      // @ts-ignore
      const pdfParse = (await import('pdf-parse')).default;
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      // @ts-ignore
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }

    return `[Binary file: ${originalName} — text extraction not supported for this type]`;
  } catch (err) {
    console.warn('[extractText] Could not extract text:', (err as Error).message);
    return `[Could not extract text from ${originalName}]`;
  }
}

/**
 * Upload CV File - Store CV file and extract text for AI processing
 */
export const uploadCV = async (req: Request, res: Response) => {
  console.log('[uploadCV] ========== START ==========');

  try {
    const userId = req.params.userId as string;
    const file = req.file;

    console.log('[uploadCV] userId:', userId);
    console.log('[uploadCV] file:', file ? `${file.originalname} (${file.mimetype}, ${file.size} bytes)` : 'NO FILE');

    if (!file) {
      return res.status(400).json({ error: "No file uploaded. Make sure the field name is 'cv'." });
    }

    // Verify the file actually landed on disk
    if (!fs.existsSync(file.path)) {
      console.error('[uploadCV] File missing on disk after multer:', file.path);
      return res.status(500).json({ error: "File was not saved to disk. Check that uploads/ directory is writable." });
    }

    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      fs.unlinkSync(file.path);
      return res.status(404).json({ error: "User not found" });
    }

    // Delete old CV file from disk if it exists
    const existing = await prisma.userProfile.findUnique({ where: { userId } });
    if (existing?.cvFilePath && fs.existsSync(existing.cvFilePath)) {
      try {
        fs.unlinkSync(existing.cvFilePath);
        console.log('[uploadCV] Deleted old CV:', existing.cvFilePath);
      } catch (e) {
        console.warn('[uploadCV] Could not delete old CV file:', e);
      }
    }

    console.log('[uploadCV] Extracting text from file...');
    const cvParsedText = await extractTextFromFile(file.path, file.mimetype, file.originalname);
    console.log('[uploadCV] Extracted', cvParsedText.length, 'characters');

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        cvFilePath: file.path,
        cvFileName: file.originalname,
        cvParsedText: cvParsedText.substring(0, 5000),
        updatedAt: new Date()
      },
      create: {
        userId,
        cvFilePath: file.path,
        cvFileName: file.originalname,
        cvParsedText: cvParsedText.substring(0, 5000)
      }
    });

    console.log('[uploadCV] ✓ Saved. cvFilePath:', profile.cvFilePath);

    res.status(200).json({
      message: "CV uploaded successfully",
      profile: {
        cvFileName: profile.cvFileName,
        updatedAt: profile.updatedAt,
        textPreview: cvParsedText.substring(0, 200)
      }
    });

    console.log('[uploadCV] ========== COMPLETE ==========');

  } catch (error) {
    console.error('[uploadCV] ❌ ERROR:', error);

    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }

    res.status(500).json({ error: (error instanceof Error ? error.message : String(error)) });
  }
};

/**
 * Get CV File - Stream user's CV to the client
 */
export const getCV = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    const profile = await prisma.userProfile.findUnique({ where: { userId } });

    if (!profile?.cvFilePath) {
      return res.status(404).json({ error: "No CV on record for this user" });
    }

    if (!fs.existsSync(profile.cvFilePath)) {
      return res.status(404).json({ error: "CV file missing on server — please re-upload" });
    }

    // Set header so browsers / React Native file handlers know the filename
    res.setHeader('Content-Disposition', `attachment; filename="${profile.cvFileName || 'CV'}"`);
    res.download(profile.cvFilePath, profile.cvFileName || 'CV');
  } catch (error) {
    console.error("[User Controller] Error downloading CV:", error);
    res.status(500).json({ error: "Failed to download CV" });
  }
};