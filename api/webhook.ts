// api/webhook.ts – Vercel will expose this as /api/webhook
import { VercelRequest, VercelResponse } from '@vercel/node';
import TelegramBot from 'node-telegram-bot-api';

// Проверяем токен
const token = process.env.BOT_TOKEN;
if (!token) {
  console.error('FATAL: BOT_TOKEN is not set in environment variables');
  throw new Error('BOT_TOKEN is missing');
}

// Создаём экземпляр бота (без polling)
const bot = new TelegramBot(token, { polling: false });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Должен быть именно POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Проверяем, есть ли тело
  if (!req.body) {
    console.warn('Empty request body received');
    return res.status(400).json({ error: 'Bad Request: empty body' });
  }

  const update = req.body;

  console.log('Update received:', JSON.stringify(update, null, 2)); // Логируем структуру

  try {
    // Обработка входящего сообщения
    if (update.message?.text && update.message.chat?.id) {
      const chatId = update.message.chat.id;
      const text = update.message.text;

      if (text === '/start') {
        await bot.sendMessage(chatId, '👋 Привет! Я бот для SpbClimbKids!');
      } else {
        await bot.sendMessage(chatId, 'Пока я только умею отвечать на /start :)');
      }
    }

    // Всегда быстро отвечаем 200, чтобы Vercel не думал, что функция упала
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('Error handling Telegram update:', err);

    // Не все ошибки Telegram нужно превращать в 500 — некоторые можно игнорировать
    if (err.response) {
      console.error('Telegram API error response:', err.response.body);
    }

    // Отвечаем 200, чтобы Telegram не повторял вебхук при временной ошибке
    return res.status(200).json({ ok: true, warning: 'Update processed with error' });
  }
}
