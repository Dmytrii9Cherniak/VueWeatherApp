<template>
  <div class="weather-app">
    <CvTile class="weather-container">
      <h1>{{ $t('weather.forecast') }}</h1>

      <div class="controls">
        <div class="search-box">
          <CvTextInput
            v-model="city"
            :label="$t('weather.city')"
            :placeholder="$t('weather.placeholder')"
            @input="city = city.replace(/\d/g, '')"
          />
        </div>

        <div class="options">
          <CvSelect v-model="units" :label="$t('weather.units')">
            <CvSelectOption value="metric" :label="$t('weather.celsius')" />
            <CvSelectOption value="imperial" :label="$t('weather.fahrenheit')" />
          </CvSelect>
        </div>

        <div class="options">
          <CvSelect v-model="countryCode" :label="$t('weather.country')">
            <CvSelectOption
              v-for="country in translatedCountries"
              :key="country.code"
              :value="country.code"
              :label="country.label"
            />
          </CvSelect>
        </div>

        <div class="options">
          <CvSelect v-model="locale" :label="$t('weather.language')">
            <CvSelectOption value="en" label="English" />
            <CvSelectOption value="uk" label="Українська" />
          </CvSelect>
        </div>
      </div>

      <CvButton @click="fetchWeather" :disabled="loading">
        {{ $t('weather.search') }}
      </CvButton>

      <div class="loading-block">
        <CvLoading v-if="loading" :description="$t('weather.loading')" />
      </div>

      <CvInlineNotification
        v-if="isOpen"
        kind="error"
        :title="t(errorKey)"
        @close="isOpen = false"
      />

      <div v-if="weather" class="weather-info">
        <h2>{{ weather.name }}, {{ weather.sys.country }}</h2>
        <p>
          🌡 {{ $t('weather.temperature') }}: {{ weather.main.temp }}°{{
            units === 'metric' ? 'C' : 'F'
          }}
        </p>
        <p>💧 {{ $t('weather.humidity') }}: {{ weather.main.humidity }}%</p>
        <p>
          💨 {{ $t('weather.wind') }}: {{ weather.wind.speed }}
          {{ units === 'metric' ? $t('weather.meters_per_second') : $t('weather.miles_per_hour') }}
        </p>
        <p>☁ {{ translateWeather(weather.weather[0].description) }}</p>
      </div>

      <div v-if="forecast.length" class="forecast">
        <h3>{{ $t('weather.forecast_5_days') }}</h3>
        <div class="forecast-list">
          <div
            v-for="day in groupedForecast"
            :key="day.dt"
            class="forecast-item"
            :title="t('weather.click_details')"
            :class="{ 'active-day': selectedDate === day.dt_txt.split(' ')[0] }"
            @click="toggleSelectedDate(day.dt_txt.split(' ')[0])"
          >
            <p class="date">📅 {{ formatDate(day.dt_txt) }}</p>
            <p>
              🌡 {{ t('weather.temperature') }}: {{ day.main.temp }}°{{ units === 'metric' ? 'C' : 'F' }}
            </p>
            <p>
              💨 {{ t('weather.wind') }}: {{ day.wind.speed }}
              {{ units === 'metric' ? t('weather.meters_per_second') : t('weather.miles_per_hour') }}
            </p>
            <p>☁ {{ translateWeather(day.weather[0].description) }}</p>
          </div>
        </div>
      </div>

      <div v-if="selectedDate" class="hourly-forecast">
        <h3>{{ t('weather.details_for') }} {{ formatDate(selectedDate) }}</h3>
        <div class="forecast-list">
          <div v-for="hour in hourlyForecast" :key="hour.dt" class="forecast-item">
            <p class="time">🕒 {{ hour.dt_txt.split(' ')[1] }}</p>
            <p>
              🌡 {{ t('weather.temperature') }}: {{ hour.main.temp }}°{{ units === 'metric' ? 'C' : 'F' }}
            </p>
            <p>
              💨 {{ t('weather.wind') }}: {{ hour.wind.speed }}
              {{ units === 'metric' ? t('weather.meters_per_second') : t('weather.miles_per_hour') }}
            </p>
            <p>☁ {{ translateWeather(hour.weather[0].description) }}</p>
          </div>
        </div>
      </div>

    </CvTile>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { WeatherService } from '@/services/weather.service.ts'
import type { WeatherData } from '@/models/weather.data.model.ts'
import type { ForecastItem } from '@/models/forecast.item.model.ts'
import { localStorageUtils } from '@/utils/city.store.util.ts'
import { countries } from '@/utils/coutries.list.ts'

const { t, locale } = useI18n()

const city = ref<string>(localStorageUtils.getSelectedCity())
const weather = ref<WeatherData | null>(null)
const forecast = ref<ForecastItem[]>([])
const loading = ref<boolean>(false)
const errorKey = ref<string>('weather.error')
const isOpen = ref<boolean>(false)
const countryCode = ref<string | null>(null)
const units = ref<'metric' | 'imperial'>(
  (localStorage.getItem('units') as 'metric' | 'imperial') || 'metric',
)
const selectedDate = ref<string | null>(null);

const toggleSelectedDate = (date: string) => {
  selectedDate.value = selectedDate.value === date ? null : date;
};

const hourlyForecast = computed(() => {
  return selectedDate.value ? forecast.value.filter(item => item.dt_txt.startsWith(selectedDate.value!)) : [];
});

onMounted(() => {
  const savedLocale = localStorage.getItem('locale') as 'uk' | 'en'
  if (savedLocale) {
    locale.value = savedLocale
  }
  fetchWeather()
})

watch(locale, (newLocale) => {
  localStorage.setItem('locale', newLocale);
});

const groupedForecast = computed(() => {
  const dailyForecast: Record<string, ForecastItem> = {};

  forecast.value.forEach((item) => {
    const date = item.dt_txt.split(" ")[0];

    if (!dailyForecast[date] || item.dt_txt.includes("12:00:00")) {
      dailyForecast[date] = item;
    }
  });

  return Object.values(dailyForecast);
});

const fetchWeather = async () => {
  if (!city.value.trim()) {
    errorKey.value = 'weather.error_city'
    isOpen.value = true
    return
  }

  if (/\d/.test(city.value)) {
    errorKey.value = 'weather.invalid_city'
    isOpen.value = true
    return
  }

  loading.value = true
  errorKey.value = 'weather.error'
  isOpen.value = false

  try {
    const weatherData: WeatherData | null = await WeatherService.getWeather(
      city.value,
      countryCode.value,
      units.value,
      locale.value as 'uk' | 'en',
    )

    if (!weatherData || weatherData.cod === '404') {
      errorKey.value = 'weather.city_not_found'
      isOpen.value = true
      return
    }

    weather.value = weatherData
    localStorageUtils.setSelectedCity(city.value)

    const forecastData = await WeatherService.getForecast(
      city.value,
      countryCode.value,
      units.value,
      locale.value as 'uk' | 'en',
    )
    forecast.value = forecastData.length ? forecastData : []
  } catch (err) {
    errorKey.value = 'weather.fetch_error'
    isOpen.value = true
    console.error(err)
  } finally {
    loading.value = false
  }
}

const translatedCountries = computed(() =>
  countries.map((country) => ({
    code: country.code,
    label: t(`weather.${country.code || 'any_country'}`, country.label),
  })),
)

const translateWeather = (description: string): string => {
  const key = description.toLowerCase().replace(/\s+/g, '_')
  return t(`weather.${key}`, description)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString(locale.value, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

watch(locale, () => {
  localStorage.setItem('locale', locale.value)
})
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
}

.date {
  font-weight: bold;
}


.forecast-item {
  cursor: pointer;
  transition: transform 0.3s ease, background 0.3s ease;
}

.forecast-item:hover {
  transform: scale(1.05);
}

.active-day {
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid white;
}

</style>
