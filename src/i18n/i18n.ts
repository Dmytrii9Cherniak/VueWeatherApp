import { createI18n } from 'vue-i18n';

import uk from './uk.json';
import en from './en.json';

export const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') ||'uk',
  fallbackLocale: 'uk',
  messages: { uk, en },
  missingWarn: false,
  fallbackWarn: false
});
