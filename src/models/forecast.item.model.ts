export interface ForecastItem {
  dt: number;
  dt_txt: string;
  main: { temp: number };
  wind: { speed: number };
  weather: { description: string }[];
}
