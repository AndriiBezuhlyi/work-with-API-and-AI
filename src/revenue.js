export function selectCurrency(transactions) {
  const counts = { USD: 0, EUR: 0 }

  for (const { currency } of transactions) {
    if (currency === 'USD' || currency === 'EUR') counts[currency] += 1
  }

  // За рівної кількості (або відсутності обох валют) обираємо USD.
  return counts.EUR > counts.USD ? 'EUR' : 'USD'
}

function getRate(rates, currency) {
  const rate = currency === 'USD' ? 1 : Number(rates[currency])

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`Немає коректного курсу для ${currency}.`)
  }

  return rate
}

export function calculateDailyRevenue(transactions, rates) {
  const currency = selectCurrency(transactions)
  const total = transactions.reduce((sum, transaction) => {
    if (transaction.currency === currency) return sum + transaction.amount

    // Спочатку переводимо суму в USD, потім — в обрану валюту.
    const convertedAmount = transaction.amount
      / getRate(rates, transaction.currency)
      * getRate(rates, currency)

    return sum + convertedAmount
  }, 0)

  if (!Number.isFinite(total)) throw new Error('Загальна сума перевищує допустиме значення.')

  // Округлюємо тільки підсумок, щоб не накопичувати похибку на кожній операції.
  return { total: Number(total.toFixed(2)), currency }
}
