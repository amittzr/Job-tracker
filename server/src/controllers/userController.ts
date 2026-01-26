import { Request, Response } from 'express';
import prisma from '../config/db.js';

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