import { describe, it } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import mongoose from 'mongoose';

describe('Health endpoint', { timeout: 10000 }, () => {
  it('returns 503 when database is disconnected', async () => {
    const app = express();
    app.get('/api/health', (req, res) => {
      const dbState = mongoose.connection.readyState;
      const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
      const healthy = dbState === 1;
      res.status(healthy ? 200 : 503).json({
        success: healthy,
        status: healthy ? 'healthy' : 'unhealthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatus[dbState] || 'unknown',
      });
    });

    const server = app.listen(0);
    await new Promise((resolve) => server.on('listening', resolve));
    const { port } = server.address();

    try {
      const res = await fetch(`http://localhost:${port}/api/health`);
      assert.strictEqual(res.status, 503);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.status, 'unhealthy');
      assert.strictEqual(body.database, 'disconnected');
      assert.ok(typeof body.uptime === 'number');
      assert.ok(typeof body.timestamp === 'string');
    } finally {
      server.close();
    }
  });
});
