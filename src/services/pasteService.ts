import { ObjectId } from 'mongodb';
import { getPastesCollection } from '../db';
import type { CreatePasteResponse, FetchPasteResponse, PasteDoc, PasteLanguage } from '../types';
import type { OptionalId } from 'mongodb';
import { ApiError } from '../utils/errors';

interface CreatePasteInput {
  content: string;
  ttlSeconds?: number;
  maxViews?: number;
  language?: PasteLanguage;
}

export async function createPaste({
  content,
  ttlSeconds,
  maxViews,
  language
}: CreatePasteInput): Promise<CreatePasteResponse> {
  const expiresAt = typeof ttlSeconds === 'number'
    ? new Date(Date.now() + ttlSeconds * 1000)
    : null;

  const doc: OptionalId<PasteDoc> = {
    content,
    createdAt: new Date(),
    expiresAt,
    maxViews: typeof maxViews === 'number' ? maxViews : null,
    views: 0,
    language: language || 'text'
  };

  const collection = await getPastesCollection();
  const result = await collection.insertOne(doc);

  const baseUrl = process.env.PUBLIC_WEB_BASE_URL;
  if (!baseUrl) {
    throw new ApiError(500, 'PUBLIC_WEB_BASE_URL is not set');
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  const id = result.insertedId.toHexString();

  return {
    id,
    url: `${normalizedBaseUrl}/p/${id}`
  };
}

export async function fetchPaste({
  id,
  nowMs
}: {
  id: string;
  nowMs: number;
}): Promise<FetchPasteResponse | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const collection = await getPastesCollection();
  const now = new Date(nowMs);
  const maxViewsFallback = Number.MAX_SAFE_INTEGER;

  const docResult = await collection.findOneAndUpdate(
    {
      _id: new ObjectId(id),
      $and: [
        {
          $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
        },
        {
          $expr: {
            $lt: [
              { $ifNull: ['$views', 0] },
              { $ifNull: ['$maxViews', maxViewsFallback] }
            ]
          }
        }
      ]
    },
    {
      $inc: { views: 1 }
    },
    {
      returnDocument: 'after'
    }
  );

  if (!docResult) {
    return null;
  }

  const doc = docResult;
  const remainingViews = doc.maxViews === null
    ? null
    : Math.max(doc.maxViews - doc.views, 0);

  return {
    content: doc.content,
    remaining_views: remainingViews,
    expires_at: doc.expiresAt ? doc.expiresAt.toISOString() : null,
    language: doc.language || 'text'
  };
}
