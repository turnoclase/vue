import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import es from './locales/es.json'
import eu from './locales/eu.json'

function detectarIdioma(): string {
  const soportados = ['en', 'es', 'eu']
  const lang = navigator.language.split('-')[0] ?? 'es'
  return soportados.includes(lang) ? lang : 'es'
}

export const i18n = createI18n({
  legacy: false,
  locale: detectarIdioma(),
  fallbackLocale: 'es',
  messages: { en, es, eu },
})
