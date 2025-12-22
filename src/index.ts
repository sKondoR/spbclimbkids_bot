import TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from './config/config.service';
import { BotService } from './bot/bot.service';
import { ApiService } from './api/api.service';

class TelegramBotApp {
  private bot: TelegramBot;
  private config: ConfigService;
  private apiService: ApiService;
  private botService: BotService;
  private frontUrl: string;

  constructor() {
    this.config = new ConfigService();
    this.bot = new TelegramBot(this.config.get('TELEGRAM_BOT_TOKEN'), {
      polling: true,
    });
    this.frontUrl = this.config.get('FRONT_URL');
    
    this.apiService = new ApiService(this.config);
    this.botService = new BotService(this.bot, this.apiService, this.frontUrl);
    
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    process.on('unhandledRejection', (error) => {
      console.error('Unhandled Rejection:', error);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
    });
  }

  public start(): void {
    console.log('🤖 Telegram бот запущен!');
    this.botService.registerCommands();
  }
}

// Запуск приложения
const app = new TelegramBotApp();
app.start();