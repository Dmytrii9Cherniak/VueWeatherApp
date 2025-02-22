import type { ForecastItem } from '@/models/forecast.item.model.ts'

export interface ForecastResponse {
  list: ForecastItem[];
}
