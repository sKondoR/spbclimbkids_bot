import type { VercelApiHandler } from '@vercel/node';
import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(token);

if (process.env.NODE_ENV === 'production') {
  bot.setWebHook(`${process.env.VERCEL_URL}/api/webhook`);
}

const handler: VercelApiHandler = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    return;
  }

  try {
    await bot.processUpdate(req.body);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process update' });
  }
};

export default handler;