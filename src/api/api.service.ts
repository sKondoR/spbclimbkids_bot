// import * as fs from 'fs';
import * as https from 'https';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '../config/config.service';
import { IClimber } from '../bot/climber.interface';

// const ca = fs.readFileSync('');

export class ApiService {
  private readonly client: AxiosInstance;
  private readonly baseURL: string;

  constructor(private config: ConfigService) {
    this.baseURL = this.config.get('API_URL');
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      // httpsAgent: new (require('https').Agent)({
      //   ca: ca,
      // }),
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });

    // интерсептор для обработки ошибок
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Пример метода для получения скалолазов
  async getClimbers(): Promise<IClimber[]> {
    try {
      const response = await this.client.get('/climbers');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch climbers:', error);
      throw error;
    }
  }

  // Пример метода для получения скалолаза по allClimbId
  async getClimberByAllclimbId(allClimbId: number): Promise<IClimber> {
    try {
      const response = await this.client.get(`/climbers/allClimbId/${allClimbId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw error;
    }
  }

}