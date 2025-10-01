import { z } from 'zod';

// Component Types
export const ComponentTypeSchema = z.enum([
  'container',
  'text',
  'heading',
  'button',
  'input',
  'textarea',
  'image',
  'link',
  'list',
  'card',
  'form',
  'navigation',
  'hero',
  'footer',
  'custom'
]);

export type ComponentType = z.infer<typeof ComponentTypeSchema>;

// Style Schema
export const StyleSchema = z.object({
  width: z.string().optional(),
  height: z.string().optional(),
  padding: z.string().optional(),
  margin: z.string().optional(),
  backgroundColor: z.string().optional(),
  color: z.string().optional(),
  fontSize: z.string().optional(),
  fontWeight: z.string().optional(),
  textAlign: z.string().optional(),
  display: z.string().optional(),
  flexDirection: z.string().optional(),
  justifyContent: z.string().optional(),
  alignItems: z.string().optional(),
  gap: z.string().optional(),
  border: z.string().optional(),
  borderRadius: z.string().optional(),
  boxShadow: z.string().optional(),
  position: z.string().optional(),
  top: z.string().optional(),
  right: z.string().optional(),
  bottom: z.string().optional(),
  left: z.string().optional(),
  zIndex: z.number().optional(),
  cursor: z.string().optional(),
  overflow: z.string().optional(),
  custom: z.record(z.string()).optional()
});

export type Style = z.infer<typeof StyleSchema>;

// Interaction Schema
export const InteractionTypeSchema = z.enum([
  'navigate',
  'toggle',
  'show',
  'hide',
  'scroll',
  'custom'
]);

export const InteractionSchema = z.object({
  id: z.string(),
  type: InteractionTypeSchema,
  trigger: z.enum(['click', 'hover', 'focus', 'submit', 'load']),
  targetPageId: z.string().optional(),
  targetComponentId: z.string().optional(),
  animation: z.string().optional(),
  customScript: z.string().optional()
});

export type Interaction = z.infer<typeof InteractionSchema>;

// Component Schema
export const ComponentSchema: z.ZodType<any> = z.lazy(() => z.object({
  id: z.string(),
  type: ComponentTypeSchema,
  name: z.string(),
  content: z.string().optional(),
  props: z.record(z.any()).optional(),
  styles: StyleSchema.optional(),
  children: z.array(ComponentSchema).optional(),
  interactions: z.array(InteractionSchema).optional(),
  metadata: z.record(z.any()).optional()
}));

export type Component = z.infer<typeof ComponentSchema>;

// Page Schema
export const PageSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  title: z.string(),
  description: z.string().optional(),
  components: z.array(ComponentSchema),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Page = z.infer<typeof PageSchema>;

// Prototype Schema
export const PrototypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  pages: z.array(PageSchema),
  globalStyles: z.string().optional(),
  globalScripts: z.string().optional(),
  assets: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    url: z.string(),
    size: z.number().optional()
  })).optional(),
  version: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

export type Prototype = z.infer<typeof PrototypeSchema>;

// Version Schema
export const VersionSchema = z.object({
  id: z.string(),
  prototypeId: z.string(),
  version: z.number(),
  snapshot: PrototypeSchema,
  message: z.string().optional(),
  createdAt: z.string(),
  createdBy: z.string().optional()
});

export type Version = z.infer<typeof VersionSchema>;

// Specification Schema
export const SpecificationSchema = z.object({
  id: z.string(),
  prototypeId: z.string().optional(),
  content: z.string(),
  parsedRequirements: z.array(z.object({
    type: z.string(),
    description: z.string(),
    priority: z.enum(['high', 'medium', 'low']).optional()
  })).optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Specification = z.infer<typeof SpecificationSchema>;

// Comment Schema
export const CommentSchema = z.object({
  id: z.string(),
  prototypeId: z.string(),
  pageId: z.string().optional(),
  componentId: z.string().optional(),
  content: z.string(),
  author: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  resolved: z.boolean().optional()
});

export type Comment = z.infer<typeof CommentSchema>;

