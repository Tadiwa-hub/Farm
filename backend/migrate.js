const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.RAW_TURSO_URL,
  authToken: process.env.RAW_TURSO_AUTH_TOKEN,
});

async function migrate() {
  try {
    console.log("Starting migration...");
    
    // Add 'name' to Batch
    console.log("Adding 'name' column to Batch...");
    try {
      await db.execute('ALTER TABLE "Batch" ADD COLUMN "name" TEXT');
    } catch (e) {
      console.log("'name' column may already exist, skipping.");
    }
    
    // Create MortalityRecord table
    console.log("Creating MortalityRecord table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "MortalityRecord" (
        "id" TEXT PRIMARY KEY,
        "date" DATETIME NOT NULL,
        "count" INTEGER NOT NULL,
        "cause" TEXT,
        "batchId" TEXT NOT NULL,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE
      )
    `);

    console.log("Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
