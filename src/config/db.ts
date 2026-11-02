import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'hopeharbor';

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

export const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  try {
    await client.connect();
    db = client.db(dbName);
    console.log(`🍃 Connected successfully to MongoDB Database: "${dbName}"`);

    // Ensure Database Indexes
    await ensureIndexes(db);

    return db;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

/**
 * Creates essential database indexes for performance and constraint safety:
 * 1. events collection: query by upcoming date and organizer
 * 2. joined_events collection: compound unique index to prevent duplicate joins
 */
async function ensureIndexes(database: Db) {
  try {
    const eventsCollection = database.collection('events');
    const joinedEventsCollection = database.collection('joined_events');

    // Fast lookups for upcoming events sorted by date
    await eventsCollection.createIndex({ date: 1 });
    // Fast lookup for organizer's events
    await eventsCollection.createIndex({ organizerEmail: 1 });

    // Enforce uniqueness: A user can only join a specific event once
    await joinedEventsCollection.createIndex(
      { eventId: 1, userEmail: 1 },
      { unique: true }
    );

    console.log('⚡ MongoDB collection indexes verified');
  } catch (indexError) {
    console.warn('⚠️ Index creation note:', indexError);
  }
}

export function getDB(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}