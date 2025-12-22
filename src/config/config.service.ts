import * as dotenv from 'dotenv';

dotenv.config();

export class ConfigService {
  private readonly envConfig: { [key: string]: string };

  constructor() {
    this.envConfig = process.env as { [key: string]: string };
    
    // Проверка обязательных переменных
    this.validateConfig();
  }

  get(key: string): string {
    const value = this.envConfig[key];
    if (!value) {
      throw new Error(`Configuration key ${key} is not defined`);
    }
    return value;
  }

  private validateConfig(): void {
    const required = ['TELEGRAM_BOT_TOKEN', 'API_URL'];
    required.forEach(key => {
      if (!this.envConfig[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    });
  }
}