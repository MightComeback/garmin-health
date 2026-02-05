import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { open } from 'sqlite';
import Database from 'sqlite3';

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

const PORT = 17890;
const SYNC_URL_KEY = '@garmin_sync_url';

// Database setup
let db: Database.Database | null = null;

async function initDatabase() {
  db = await open({
    filename: 'garmin.sqlite',
    driver: Database.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS sync_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      garmin_configured INTEGER DEFAULT 0,
      garmin_authenticated INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS daily_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL UNIQUE,
      steps INTEGER,
      resting_heart_rate REAL,
      body_battery INTEGER,
      sleep_seconds INTEGER,
      hrv_status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      status TEXT,
      activities_count INTEGER,
      synced_days INTEGER
    );
  `);

  // Initialize sync status if not exists
  const statusCount = await db.get('SELECT COUNT(*) as count FROM sync_status');
  if (statusCount.count === 0) {
    await db.run('INSERT INTO sync_status (garmin_configured, garmin_authenticated) VALUES (0, 0)');
  }
}

// API endpoints

app.get('/health', (req, res) => {
  db?.get('SELECT * FROM sync_status ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) {
      res.status(500).json({ ok: false, error: err.message });
      return;
    }
    res.json({
      ok: true,
      garminConfigured: row?.garmin_configured || 0,
      garminAuthenticated: row?.garmin_authenticated || 0,
    });
  });
});

app.get('/daily', (req, res) => {
  db?.all('SELECT * FROM daily_metrics ORDER BY date DESC LIMIT 7', (err, rows) => {
    if (err) {
      res.status(500).json({ ok: false, error: err.message });
      return;
    }
    res.json({ items: rows || [] });
  });
});

app.get('/sync/status', (req, res) => {
  db?.all('SELECT * FROM sync_logs ORDER BY id DESC LIMIT 10', (err, rows) => {
    if (err) {
      res.status(500).json({ ok: false, error: err.message });
      return;
    }
    res.json({ recent: rows || [] });
  });
});

app.post('/sync', (req, res) => {
  db?.run('INSERT INTO sync_logs (status) VALUES (?)', ['running'], function(err) {
    if (err) {
      res.status(500).json({ ok: false, error: err.message });
      return;
    }

    const logId = this.lastID;

    // For now, simulate sync
    setTimeout(() => {
      db?.run(
        'UPDATE sync_logs SET ended_at = ?, status = ?, activities_count = ?, synced_days = ? WHERE id = ?',
        [new Date().toISOString(), 'success', 15, 1, logId],
        function(err) {
          if (err) {
            res.status(500).json({ ok: false, error: err.message });
            return;
          }
          res.json({ ok: true, synced: { activities: 15, days: 1 } });
        }
      );
    }, 1000);
  });
});

server.listen(PORT, async () => {
  await initDatabase();
  console.log(`Server running on port ${PORT}`);
});

export { app, server };
