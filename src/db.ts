import { MongoClient, type Db, type Collection } from 'mongodb';
import type { PasteDoc } from './types';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDb(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
  }

  console.log('Connecting to MongoDB...');
  await cachedClient.connect();
  cachedDb = cachedClient.db();
  console.log(`Connected to MongoDB database: ${cachedDb.databaseName}`);
  return cachedDb;
}

export async function getPastesCollection(): Promise<Collection<PasteDoc>> {
  const db = await getDb();
  return db.collection<PasteDoc>('pastes');
}
