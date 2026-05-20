import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validation Middleware Factory
 * Takes a Zod schema and returns a middleware that validates req.body against it.
 * If validation fails — returns 400 with clear error messages.
 * If validation passes — attaches cleaned data to req.body and continues.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate — also strips unknown fields and applies defaults
      const parsed = schema.parse(req.body);
      req.body = parsed; // Replace body with cleaned/validated data
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into readable messages
        const messages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          error: 'Validation failed',
          details: messages,
        });
      }
      next(error);
    }
  };
}
