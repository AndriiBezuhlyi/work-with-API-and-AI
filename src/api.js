const FINANCE_URL = 'https://cpa-server-vtel.onrender.com/api'
const RATES_URL = 'https://api.currencyfreaks.com/v2.0/rates/latest'

async function fetchJson(url, options = {}, label = 'API') {
  console.info(`[Запит] ${label}`)
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(60000),
    })

    // fetch не вважає відповіді 4xx/5xx мережевими помилками.
    if (!response.ok) {
      const error = new Error('Помилка відповіді сервера')
      error.status = response.status
      throw error
    }

    const data = await response.json()
    console.info(`[Успіх] Відповідь ${label} отримано`)
    return data
  } catch (error) {
    // Не виводимо URL та заголовки: вони можуть містити API-ключі.
    const reason = error.status ? `HTTP ${error.status}` : error.name
    console.error(`[Невдача] Запит ${label}: ${reason}`)
    throw new Error(`Запит ${label} не виконано (${reason}).`)
  }
}

export async function getFinanceSources() {
  const apiKey = import.meta.env.VITE_FINANCE_API_KEY
  if (!apiKey) throw new Error('Не задано VITE_FINANCE_API_KEY у .env.local.')

  const options = { headers: { 'x-api-key': apiKey } }

  return Promise.all([
    fetchJson(`${FINANCE_URL}/finance1`, options, 'finance1'),
    fetchJson(`${FINANCE_URL}/finance2`, options, 'finance2'),
  ])
}

export async function getExchangeRates() {
  const apiKey = import.meta.env.VITE_CURRENCYFREAKS_API_KEY
  if (!apiKey) throw new Error('Не задано VITE_CURRENCYFREAKS_API_KEY у .env.local.')

  const url = new URL(RATES_URL)
  url.searchParams.set('apikey', apiKey)
  const data = await fetchJson(url, {}, 'CurrencyFreaks')

  if (data.base !== 'USD' || !data.rates || typeof data.rates !== 'object') {
    throw new Error('Сервіс курсів повернув некоректні дані.')
  }

  // Базовий курс USD дорівнює 1; решта курсів — кількість валюти за 1 USD.
  return { rates: { ...data.rates, USD: 1 }, date: data.date }
}
