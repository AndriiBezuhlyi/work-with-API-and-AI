import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeTransactions } from './transactions.js'
import { calculateDailyRevenue, calculateCurrencyTotals } from './revenue.js'

test('виключає неоплачені транзакції та нормалізує обидва джерела', () => {
  const transactions = normalizeTransactions({ transactions: [
    { type: 'paid', amount: 100, currency: 'USD' },
    { type: 'pending', amount: 999, currency: 'EUR' },
    { type: 'rejected', amount: 999, currency: 'EUR' },
    { amount: '50', currency: 'usd' },
  ] }, [' 80   eur '])

  assert.equal(transactions.length, 3)
  assert.deepEqual(calculateDailyRevenue(transactions, { EUR: '0.8' }), {
    total: 250, currency: 'USD',
  })
})

test('завжди обирає USD навіть за переваги EUR та конвертує третю валюту', () => {
  const transactions = normalizeTransactions({ transactions: [] }, [
    '10 EUR', '20 eur', '1000 USD', '40 GBP',
  ])
  assert.deepEqual(calculateDailyRevenue(transactions, { EUR: '0.8', GBP: '0.5' }), {
    total: 1117.5, currency: 'USD',
  })
})

test('округлює лише кінцеву суму в USD', () => {
  const transactions = normalizeTransactions({ transactions: [] }, [
    '0 USD', '0 USD', '1 EUR', '1 EUR',
  ])
  assert.deepEqual(calculateDailyRevenue(transactions, { EUR: 3 }), {
    total: 0.67, currency: 'USD',
  })
})

test('обробляє порожні дані та одну валюту без курсів', () => {
  assert.deepEqual(calculateDailyRevenue([], {}), { total: 0, currency: 'USD' })
  assert.deepEqual(calculateDailyRevenue([{ amount: 10, currency: 'USD' }], {}), {
    total: 10, currency: 'USD',
  })
})

test('відхиляє некоректні суми та відсутні або нульові курси', () => {
  assert.throws(() => normalizeTransactions({ transactions: [] }, ['oops USD']))
  assert.throws(() => normalizeTransactions({}, []))
  for (const rates of [{}, { GBP: 0 }]) {
    assert.throws(() => calculateDailyRevenue([{ amount: 10, currency: 'GBP' }], rates))
  }
})


test('окремі суми містять лише враховані USD і EUR без конвертації', () => {
  const transactions = normalizeTransactions({ transactions: [
    { type: 'rejected', amount: 900, currency: 'EUR' },
    { type: 'paid', amount: 25, currency: 'EUR' },
  ] }, ['10 USD', '15 EUR', '20 GBP'])
  assert.deepEqual(calculateCurrencyTotals(transactions), { USD: 10, EUR: 40 })
  assert.deepEqual(calculateCurrencyTotals([]), { USD: 0, EUR: 0 })
  assert.deepEqual(calculateDailyRevenue([{ amount: 10, currency: 'EUR' }], { EUR: 0.8 }), {
    total: 12.5, currency: 'USD',
  })
})
