import { z } from 'zod';

const pasteLanguages = [
  'text',
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'csharp',
  'go',
  'rust',
  'html',
  'css',
  'json',
  'markdown',
  'sql',
  'bash'
] as const;

export const createPasteSchema = z.object({
  content: z.string().min(1),
  ttl_seconds: z.number().int().min(1).optional(),
  max_views: z.number().int().min(1).optional(),
  language: z.enum(pasteLanguages).optional()
});
