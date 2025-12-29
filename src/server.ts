// server.ts
import express from 'express';
import * as dotenv from 'dotenv';
import webhookHandler from '../api/webhook';
import { VercelRequest, VercelResponse } from '@vercel/node';

dotenv.config();

const app = express();
app.use(express.json());

app.post('/api/webhook', (req, res) => {
  const fakeVercelReq = req as any as VercelRequest;
  const fakeVercelRes = res as any as VercelResponse;

  return webhookHandler(fakeVercelReq, fakeVercelRes);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Local server running on http://localhost:${PORT}`);
});