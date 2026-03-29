const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@libsql/client');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize LibSQL Client
const db = createClient({
  url: process.env.RAW_TURSO_URL,
  authToken: process.env.RAW_TURSO_AUTH_TOKEN,
});

const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// --- API ROUTES ---

app.get('/api/dashboard', async (req, res) => {
  try {
    const batchRes = await db.execute(`SELECT * FROM "Batch" WHERE "isActive" = 1`);
    const activeBatches = batchRes.rows;
    const totalChickens = activeBatches.reduce((acc, curr) => acc + curr.currentBirdCount, 0);

    const feedRes = await db.execute(`SELECT amountKg, date FROM "FeedRecord"`);
    const totalFeedConsumed = feedRes.rows.reduce((acc, curr) => acc + curr.amountKg, 0);

    const eggRes = await db.execute(`SELECT count, date FROM "EggRecord"`);
    const totalEggsCollected = eggRes.rows.reduce((acc, curr) => acc + curr.count, 0);

    // Grouping for Recharts Line Chart trend (Eggs vs Feed over time)
    const trendMap = {};
    const processDate = (isoString) => isoString.split('T')[0];

    feedRes.rows.forEach(f => {
      const d = processDate(f.date);
      if (!trendMap[d]) trendMap[d] = { date: d, eggs: 0, feed: 0 };
      trendMap[d].feed += f.amountKg;
    });

    eggRes.rows.forEach(e => {
      const d = processDate(e.date);
      if (!trendMap[d]) trendMap[d] = { date: d, eggs: 0, feed: 0 };
      trendMap[d].eggs += e.count;
    });

    // Sort chart data chronologically
    const chartData = Object.values(trendMap).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get 5 most recent activity items
    const feedActivity = feedRes.rows.map(f => ({ type: 'feed', date: f.date, amount: f.amountKg }));
    const eggActivity = eggRes.rows.map(e => ({ type: 'eggs', date: e.date, amount: e.count }));
    const allActivity = [...feedActivity, ...eggActivity].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    res.json({
      activeBatches: activeBatches.length,
      totalChickens,
      totalFeedConsumed,
      totalEggsCollected,
      chartData,
      recentActivity: allActivity
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Batches
app.get('/api/batches', async (req, res) => {
  try {
    const result = await db.execute(`SELECT * FROM "Batch" ORDER BY "createdAt" DESC`);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/batches', async (req, res) => {
  try {
    const { entryDate, initialBirdCount } = req.body;
    const id = uuidv4();
    const count = parseInt(initialBirdCount) || 0;
    await db.execute({
      sql: `INSERT INTO "Batch" ("id", "entryDate", "initialBirdCount", "currentBirdCount", "isActive") VALUES (?, ?, ?, ?, ?)`,
      args: [id, new Date(entryDate).toISOString(), count, count, 1]
    });
    res.status(201).json({ id, entryDate, initialBirdCount: count, currentBirdCount: count, isActive: 1 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/batches/:id', async (req, res) => {
  try {
    await db.execute({ sql: `DELETE FROM "Batch" WHERE "id" = ?`, args: [req.params.id] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Feed
app.get('/api/feed', async (req, res) => {
  try {
    const result = await db.execute(`SELECT * FROM "FeedRecord" ORDER BY "date" DESC`);
    const logs = result.rows.map(row => ({ ...row, batch: { id: row.batchId } }));
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/feed', async (req, res) => {
  try {
    const { date, amountKg, batchId } = req.body;
    const id = uuidv4();
    await db.execute({
      sql: `INSERT INTO "FeedRecord" ("id", "date", "amountKg", "batchId") VALUES (?, ?, ?, ?)`,
      args: [id, new Date(date).toISOString(), parseFloat(amountKg) || 0, batchId]
    });
    res.status(201).json({ id, date, amountKg, batchId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/feed/:id', async (req, res) => {
  try {
    await db.execute({ sql: `DELETE FROM "FeedRecord" WHERE "id" = ?`, args: [req.params.id] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Eggs
app.get('/api/eggs', async (req, res) => {
  try {
    const result = await db.execute(`SELECT * FROM "EggRecord" ORDER BY "date" DESC`);
    const logs = result.rows.map(row => ({ ...row, batch: { id: row.batchId } }));
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/eggs', async (req, res) => {
  try {
    const { date, count, batchId } = req.body;
    const id = uuidv4();
    await db.execute({
      sql: `INSERT INTO "EggRecord" ("id", "date", "count", "batchId") VALUES (?, ?, ?, ?)`,
      args: [id, new Date(date).toISOString(), parseInt(count) || 0, batchId]
    });
    res.status(201).json({ id, date, count, batchId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/eggs/:id', async (req, res) => {
  try {
    await db.execute({ sql: `DELETE FROM "EggRecord" WHERE "id" = ?`, args: [req.params.id] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
