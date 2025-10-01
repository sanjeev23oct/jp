import { z } from 'zod';
import { PrototypeSchema, PageSchema, ComponentSchema, SpecificationSchema } from './prototype';
import { LLMRequestSchema, LLMResponseSchema } from './llm';

// API Response Wrapper
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.any().optional()
  }).optional(),
  metadata: z.object({
    timestamp: z.string(),
    requestId: z.string().optional()
  }).optional()
});

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId?: string;
  };
};

// Generate Prototype Request
export const GeneratePrototypeRequestSchema = z.object({
  specification: z.string(),
  name: z.string().optional(),
  options: z.object({
    includeExamples: z.boolean().optional(),
    style: z.enum(['minimal', 'modern', 'corporate', 'creative']).optional(),
    colorScheme: z.string().optional()
  }).optional()
});

export type GeneratePrototypeRequest = z.infer<typeof GeneratePrototypeRequestSchema>;

// Generate Page Request
export const GeneratePageRequestSchema = z.object({
  prototypeId: z.string(),
  specification: z.string(),
  name: z.string().optional()
});

export type GeneratePageRequest = z.infer<typeof GeneratePageRequestSchema>;

// Generate Component Request
export const GenerateComponentRequestSchema = z.object({
  specification: z.string(),
  context: z.object({
    pageId: z.string().optional(),
    parentComponentId: z.string().optional(),
    existingComponents: z.array(ComponentSchema).optional()
  }).optional()
});

export type GenerateComponentRequest = z.infer<typeof GenerateComponentRequestSchema>;

// Refine Request
export const RefineRequestSchema = z.object({
  targetId: z.string(),
  targetType: z.enum(['prototype', 'page', 'component']),
  instruction: z.string(),
  context: z.record(z.any()).optional()
});

export type RefineRequest = z.infer<typeof RefineRequestSchema>;

// Export Request
export const ExportRequestSchema = z.object({
  prototypeId: z.string(),
  format: z.enum(['html', 'zip', 'json']),
  options: z.object({
    includeAssets: z.boolean().optional(),
    minify: z.boolean().optional(),
    standalone: z.boolean().optional()
  }).optional()
});

export type ExportRequest = z.infer<typeof ExportRequestSchema>;

// Share Request
export const ShareRequestSchema = z.object({
  prototypeId: z.string(),
  expiresIn: z.number().optional(), // in seconds
  password: z.string().optional(),
  allowComments: z.boolean().optional()
});

export type ShareRequest = z.infer<typeof ShareRequestSchema>;

// Share Response
export const ShareResponseSchema = z.object({
  shareId: z.string(),
  url: z.string(),
  expiresAt: z.string().optional()
});

export type ShareResponse = z.infer<typeof ShareResponseSchema>;

