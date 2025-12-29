// api/webhook.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import TelegramBot from 'node-telegram-bot-api';

// Import your services
import { ConfigService } from '../src/config/config.service';
import { ApiService } from '../src/api/api.service';
import { BotService } from '../src/bot/bot.service';

// Initialize config and bot
const config = new ConfigService();
const token = config.get('TELEGRAM_BOT_TOKEN');
const frontUrl = config.get('FRONT_URL');

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is missing');
}

// Create bot instance without polling
const bot = new TelegramBot(token, {
  polling: process.env.NODE_ENV !== 'production'
});


const apiService = new ApiService(config);
const botService = new BotService(bot, apiService, frontUrl);

if (process.env.NODE_ENV === 'development') {
  bot.on('message', (msg) => {
    botService.handleUpdate({
      update_id: msg.message_id,
      message: msg,
    });
  });

  bot.on('callback_query', (query: TelegramBot.CallbackQuery) => {
    const chatId = query.message?.chat.id;
    const data = query.data;

    if (!chatId) return;

    const command = data?.replace('_', '/') || '';
    botService.handleCommand(
      chatId,
      command
    );
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).send('Method Not Allowed');
  }

  const update = req.body;

  // Pass update to BotService for handling
  try {
    await botService.handleUpdate(update);
  } catch (err) {
    console.error('Error in BotService:', err);
  }

  // Always respond quickly
  res.status(200).json({ ok: true });
}
