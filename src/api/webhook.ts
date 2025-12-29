// api/webhook.ts – Vercel will expose this as /api/webhook
import { VercelRequest, VercelResponse } from '@vercel/node';
import TelegramBot from 'node-telegram-bot-api';

// Stub the bot – we won't poll, just use it to send
const token = process.env.BOT_TOKEN;
if (!token) throw new Error('BOT_TOKEN is missing');

const bot = new TelegramBot(token, { polling: false });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).send('Method Not Allowed');
  }

  console.log('Update received');
  const update = req.body;

  // Handle incoming update (like a message or command)
  try {
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;

      if (text === '/start') {
        await bot.sendMessage(chatId, '👋 Привет! Я бот для SpbClimbKids!');
      } else {
        await bot.sendMessage(chatId, 'Пока я только умею отвечать на /start :)');
      }
    }

    // Always respond 200 quickly!
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error handling update:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}