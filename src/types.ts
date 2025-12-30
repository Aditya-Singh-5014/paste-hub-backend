import type { ObjectId } from 'mongodb';

export type PasteLanguage =
  | 'text'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'html'
  | 'css'
  | 'json'
  | 'markdown'
  | 'sql'
  | 'bash';

export interface PasteDoc {
  _id?: ObjectId;
  content: string;
  createdAt: Date;
  expiresAt: Date | null;
  maxViews: number | null;
  views: number;
  language: PasteLanguage;
}

export interface CreatePasteResponse {
  id: string;
  url: string;
}

export interface FetchPasteResponse {
  content: string;
  remaining_views: number | null;
  expires_at: string | null;
  language: PasteLanguage;
}
