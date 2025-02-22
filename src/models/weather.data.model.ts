export interface WeatherData {
  cod?: string;
  message?: string;
  name: string;
  sys: { country: string };
  main: { temp: number; humidity: number };
  wind: { speed: number };
  weather: { description: string }[];
}
