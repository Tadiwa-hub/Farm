require('dotenv').config();
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.RAW_TURSO_URL,
  authToken: process.env.RAW_TURSO_AUTH_TOKEN,
});

async function setupDB() {
  console.log('Creating tables on Turso...');

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "Batch" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "entryDate" DATETIME NOT NULL,
          "initialBirdCount" INTEGER NOT NULL,
          "currentBirdCount" INTEGER NOT NULL,
          "isActive" BOOLEAN NOT NULL DEFAULT 1,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS "FeedRecord" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "date" DATETIME NOT NULL,
          "amountKg" REAL NOT NULL,
          "batchId" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "FeedRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS "EggRecord" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "date" DATETIME NOT NULL,
          "count" INTEGER NOT NULL,
          "batchId" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "EggRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    console.log('Tables created successfully!');
  } catch (err) {
    console.error('Error creating tables:', err);
  }
}

setupDB();
