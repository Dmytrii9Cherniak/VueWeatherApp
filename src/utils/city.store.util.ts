const SELECTED_CITY_KEY = 'selectedCity';
const CITY_HISTORY_KEY = 'cityHistory';

export const localStorageUtils = {
  getSelectedCity(): string {
    return localStorage.getItem(SELECTED_CITY_KEY) || 'Київ';
  },

  setSelectedCity(city: string) {
    localStorage.setItem(SELECTED_CITY_KEY, city);
  },

  getCityHistory(): string[] {
    return JSON.parse(localStorage.getItem(CITY_HISTORY_KEY) || '[]');
  },

  addCityToHistory(city: string) {
    const history = this.getCityHistory();
    if (!history.includes(city)) {
      history.push(city);
      localStorage.setItem(CITY_HISTORY_KEY, JSON.stringify(history));
    }
  },
};
