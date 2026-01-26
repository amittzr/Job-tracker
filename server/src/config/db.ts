// server/src/config/db.ts
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

export default prisma;