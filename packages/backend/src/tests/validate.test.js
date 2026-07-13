import { describe, it } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';

function createTestApp(schema) {
  const app = express();
  app.use(express.json());
  app.post('/test', validate(schema), (req, res) => {
    res.json({ success: true, data: req.validatedBody });
  });
  return app;
}

describe('validate middleware', { timeout: 10000 }, () => {
  const schema = z.object({ name: z.string().min(1), age: z.number().min(0) });

  it('passes valid data to req.validatedBody', async () => {
    const app = createTestApp(schema);
    const server = app.listen(0);
    await new Promise((resolve) => server.on('listening', resolve));
    const { port } = server.address();

    try {
      const res = await fetch(`http://localhost:${port}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Alice', age: 25 }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.deepStrictEqual(body.data, { name: 'Alice', age: 25 });
    } finally {
      server.close();
    }
  });

  it('rejects invalid data with 400', async () => {
    const app = createTestApp(schema);
    const server = app.listen(0);
    await new Promise((resolve) => server.on('listening', resolve));
    const { port } = server.address();

    try {
      const res = await fetch(`http://localhost:${port}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '', age: -1 }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, 'Validation failed');
      assert.ok(body.errors);
    } finally {
      server.close();
    }
  });
});
