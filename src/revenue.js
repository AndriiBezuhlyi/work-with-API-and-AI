export function calculateCurrencyTotals(transactions) {
  const totals = { USD: 0, EUR: 0 }
  for (const { amount, currency } of transactions) {
    if (currency === 'USD' || currency === 'EUR') totals[currency] += amount
  }
  return { USD: Number(totals.USD.toFixed(2)), EUR: Number(totals.EUR.toFixed(2)) }
}

function getRate(rates, currency) {
  const rate = currency === 'USD' ? 1 : Number(rates[currency])

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`Немає коректного курсу для ${currency}.`)
  }

  return rate
}

export function calculateDailyRevenue(transactions, rates) {
  const currency = 'USD'
  const total = transactions.reduce((sum, transaction) => {
    if (transaction.currency === currency) return sum + transaction.amount

    // Курс показує кількість вихідної валюти за 1 USD, тому ділимо.
    const convertedAmount = transaction.amount
      / getRate(rates, transaction.currency)

    return sum + convertedAmount
  }, 0)

  if (!Number.isFinite(total)) throw new Error('Загальна сума перевищує допустиме значення.')

  // Округлюємо тільки підсумок, щоб не накопичувати похибку на кожній операції.
  return { total: Number(total.toFixed(2)), currency }
}
