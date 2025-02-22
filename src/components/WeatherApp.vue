<template>
  <div class="weather-app">
    <CvTile class="weather-container">
      <h1>{{ $t("weather.forecast") }}</h1>

      <div class="controls">
        <div class="search-box">
          <CvTextInput
            v-model="city"
            :label="$t('weather.city')"
            :placeholder="$t('weather.placeholder')"
            @input="city = city.replace(/\d/g, '')"
          />

          <CvButton @click="fetchWeather" :disabled="loading">
            {{ $t("weather.search") }}
          </CvButton>
        </div>

        <div class="options">
          <CvSelect v-model="units" :label="$t('weather.units')">
            <CvSelectOption value="metric" :label="$t('weather.celsius')" />
            <CvSelectOption value="imperial" :label="$t('weather.fahrenheit')" />
          </CvSelect>

          <CvSelect v-model="locale" :label="$t('weather.language')" @change="handleLanguageChange">
            <CvSelectOption value="uk" :label="$t('weather.ukrainian')" />
            <CvSelectOption value="en" :label="$t('weather.english')" />
          </CvSelect>
        </div>
      </div>

      <div class="loading-block">
        <CvLoading v-if="loading" :description="$t('weather.loading')" />
      </div>

      <CvInlineNotification
        v-if="isOpen"
        kind="error"
        :title="t(errorKey || 'weather.error')"
        @close="isOpen = false"
      />

      <div v-if="weather" class="weather-info">
        <h2>{{ weather.name }}, {{ weather.sys.country }}</h2>
        <p>🌡 {{ $t("weather.temperature") }}: {{ weather.main.temp }}°{{ units === "metric" ? "C" : "F" }}</p>
        <p>💧 {{ $t("weather.humidity") }}: {{ weather.main.humidity }}%</p>
        <p>💨 {{ $t("weather.wind") }}: {{ weather.wind.speed }} {{ units === "metric" ? $t("weather.meters_per_second") : $t("weather.miles_per_hour") }}</p>
        <p>☁ {{ translateWeather(weather.weather[0].description) }}</p>
      </div>

      <div v-if="forecast.length" class="forecast">
        <h3>{{ $t("weather.forecast_5_days") }}</h3>
        <div class="forecast-list">
          <div v-for="day in forecast" :key="day.dt" class="forecast-item">
            <p class="date">📅 {{ formatDate(day.dt_txt) }}</p>
            <p>🌡 {{ $t("weather.temperature") }}: {{ day.main.temp }}°{{ units === "metric" ? "C" : "F" }}</p>
            <p>💨 {{ $t("weather.wind") }}: {{ day.wind.speed }} {{ units === "metric" ? $t("weather.meters_per_second") : $t("weather.miles_per_hour") }}</p>
            <p>☁ {{ translateWeather(day.weather[0].description) }}</p>
          </div>
        </div>
      </div>

      <CvInlineNotification
        v-if="isOpen"
        kind="error"
        :title="error"
        @close="isOpen = false"
      />
    </CvTile>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { WeatherService } from "@/services/weather.service.ts";
import type { WeatherData } from "@/models/weather.data.model.ts";
import type { ForecastItem } from "@/models/forecast.item.model.ts";
import { localStorageUtils } from '@/utils/city.store.util.ts'

const { t, locale } = useI18n();

const city = ref<string>(localStorageUtils.getSelectedCity());
const weather = ref<WeatherData | null>(null);
const forecast = ref<ForecastItem[]>([]);
const loading = ref<boolean>(false);
const errorKey = ref<string | null>(null);
const units = ref<"metric" | "imperial">(localStorage.getItem("units") as "metric" | "imperial" || "metric");
const selectedHour = ref<string>("12:00:00");
const isOpen = ref<boolean>(false);


const error = computed(() => (errorKey.value ? t(errorKey.value) : ""));

onMounted(() => {
  const savedLocale = localStorage.getItem("locale") as "uk" | "en";
  if (savedLocale) {
    locale.value = savedLocale;
  }

  fetchWeather();
});

const fetchWeather = async () => {
  if (!city.value.trim()) {
    errorKey.value = "weather.error_city";
    isOpen.value = true;
    return;
  }

  if (/\d/.test(city.value)) {
    errorKey.value = "weather.invalid_city";
    isOpen.value = true;
    return;
  }

  loading.value = true;
  errorKey.value = null;
  isOpen.value = false;

  try {
    const weatherData: WeatherData | null = await WeatherService.getWeather(city.value, units.value, locale.value as "uk" | "en");

    if (!weatherData || weatherData.cod === "404") {
      errorKey.value = "weather.city_not_found";
      isOpen.value = true;
      return;
    }

    weather.value = weatherData;
    localStorageUtils.setSelectedCity(city.value);

    const forecastData = await WeatherService.getForecast(city.value, units.value, locale.value as "uk" | "en", selectedHour.value);
    forecast.value = forecastData.length ? forecastData : [];

  } catch (err) {
    errorKey.value = "weather.fetch_error";
    isOpen.value = true;
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleLanguageChange = () => {
  localStorage.setItem("locale", locale.value);
};

const translateWeather = (description: string): string => {
  const key = description.toLowerCase().replace(/\s+/g, "_");
  return t(`weather.${key}`, description);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString(locale.value, {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
};

watch(locale, () => {
  if (errorKey.value) {
    errorKey.value = errorKey.value;
  }
});
</script>

<style lang="scss" scoped>
.weather-app {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #1e1e1e, #121212);
  color: white;
  overflow: hidden;
}

.weather-container {
  display: flex;
  flex-direction: column;
  width: auto;
  max-width: 90vw;
  height: auto;
  max-height: 90vh;
  padding: 24px;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1);
  overflow-y: auto;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;

  .search-box {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .options {
    display: flex;
    gap: 10px;
    justify-content: center;
  }
}

.loading-block {
  display: flex;
  justify-content: center;
}

.weather-info {
  margin-top: 20px;
  background: rgba(255, 255, 255, 0.2);
  padding: 20px;
  border-radius: 8px;
}

.forecast {
  margin-top: 20px;
}

.forecast-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
}

.forecast-item {
  background: rgba(255, 255, 255, 0.3);
  padding: 15px;
  border-radius: 8px;
  min-width: 160px;
  max-width: 200px;
  text-align: center;
  transition: transform 0.3s ease;
  word-wrap: break-word;

  &:hover {
    transform: scale(1.05);
  }
}

.date {
  font-weight: bold;
}

</style>
