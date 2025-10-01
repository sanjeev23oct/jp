import { z } from 'zod';

/**
 * Validates data against a Zod schema and returns typed result
 */
export function validate<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}

/**
 * Validates data and throws if invalid
 */
export function validateOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Creates a validator function for a schema
 */
export function createValidator<T>(schema: z.ZodType<T>) {
  return (data: unknown) => validate(schema, data);
}

