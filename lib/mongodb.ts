import { MongoClient, MongoClientOptions, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Missing MONGODB_URI in environment (e.g., .env.local)');
}

const options: MongoClientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

// In dev, cache the client across HMR; in prod, a new client per cold start (serverless-safe)
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Reuse the promise in dev to prevent multiple connections during hot reloads
if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise!;
} else {
  // In production/serverless, create a new client per execution context
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export helpers
export async function getClient() {
  return clientPromise;
}

export async function getDb(name = process.env.MONGODB_DB) {
  const dbName = (name ?? '').trim();
  if (!dbName) {
    throw new Error("No DB name provided. Pass getDb('<dbName>') or set MONGODB_DB in env.");
  }
  const client = await clientPromise;
  return client.db(dbName);
}
