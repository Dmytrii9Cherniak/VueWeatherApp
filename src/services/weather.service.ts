import axios from 'axios';
import type { WeatherData } from '@/models/weather.data.model.ts';
import type { ForecastResponse } from '@/models/forecast.response.model.ts';
import type { ForecastItem } from '@/models/forecast.item.model.ts';
import { environment } from '@/environments/environment.dev.ts';

export class WeatherService {
  static async getWeather(
    city: string,
    units: 'metric' | 'imperial',
    lang: 'uk' | 'en'
  ): Promise<WeatherData | null> {
    try {
      const response = await axios.get(`${environment.apiUrl}/weather`, {
        params: { q: city, appid: environment.apiKey, units, lang },
      });
      return response.data as WeatherData;
    } catch (error) {
      console.error('❌ Помилка отримання погоди:', WeatherService.handleError(error));
      return null;
    }
  }

  static async getForecast(
    city: string,
    units: 'metric' | 'imperial',
    lang: 'uk' | 'en',
    filterTime?: string
  ): Promise<ForecastItem[]> {
    try {
      const response = await axios.get(`${environment.apiUrl}/forecast`, {
        params: { q: city, appid: environment.apiKey, units, lang },
      });

      const forecastData = response.data as ForecastResponse;

      if (!forecastData.list || forecastData.list.length === 0) {
        console.warn('⚠ Прогноз відсутній.');
        return [];
      }

      return filterTime
        ? forecastData.list.filter((item) => item.dt_txt.includes(filterTime))
        : forecastData.list;
    } catch (error) {
      console.error('❌ Помилка отримання прогнозу:', WeatherService.handleError(error));
      return [];
    }
  }

  private static handleError(error: unknown): string {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return error.response.data.message;
    }
    return 'Невідома помилка отримання даних.';
  }
}
