function normalizeTransaction(amount, currency) {
  const validAmount = typeof amount === 'number'
    || (typeof amount === 'string' && amount.trim() !== '')
  const normalizedAmount = Number(amount)
  const normalizedCurrency = typeof currency === 'string'
    ? currency.trim().toUpperCase()
    : ''

  if (!validAmount || !Number.isFinite(normalizedAmount) || !/^[A-Z]{3}$/.test(normalizedCurrency)) {
    throw new Error('Транзакція містить некоректну суму або валюту.')
  }

  return { amount: normalizedAmount, currency: normalizedCurrency }
}

export function normalizeTransactions(source1, source2, { includeAll = false } = {}) {
  if (!Array.isArray(source1?.transactions) || !Array.isArray(source2)) {
    throw new Error('Невідомий формат джерел транзакцій.')
  }

  const firstTransactions = source1.transactions
    .filter(item => {
      if (!item || typeof item !== 'object') {
        throw new Error('Некоректна транзакція у першому джерелі.')
      }

      // У finance1 статус зберігається в type. Без статусу також враховуємо.
      const status = item.status ?? item.type
      return includeAll || status == null || status === 'paid'
    })
    .map(item => {
      const transaction = normalizeTransaction(item.amount, item.currency)
      if (!includeAll) return transaction

      const status = item.status ?? item.type
      return { ...transaction, source: 'finance1', status: status ?? 'без статусу', included: status == null || status === 'paid' }
    })

  const secondTransactions = source2.map(item => {
    if (typeof item !== 'string') {
      throw new Error('Некоректна транзакція у другому джерелі.')
    }

    const parts = item.trim().split(/\s+/)
    if (parts.length !== 2) {
      throw new Error('Очікується транзакція у форматі «300 USD».')
    }

    const transaction = normalizeTransaction(parts[0], parts[1])
    return includeAll
      ? { ...transaction, source: 'finance2', status: 'без статусу', included: true }
      : transaction
  })

  return [...firstTransactions, ...secondTransactions]
}
