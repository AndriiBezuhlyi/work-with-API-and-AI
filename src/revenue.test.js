import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeTransactions } from './transactions.js'
import { calculateDailyRevenue } from './revenue.js'

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

test('обирає EUR за кількістю, конвертує також третю валюту', () => {
  const transactions = normalizeTransactions({ transactions: [] }, [
    '10 EUR', '20 eur', '1000 USD', '40 GBP',
  ])
  assert.deepEqual(calculateDailyRevenue(transactions, { EUR: '0.8', GBP: '0.5' }), {
    total: 894, currency: 'EUR',
  })
})

test('за рівної кількості обирає USD та округлює лише кінцеву суму', () => {
  const transactions = normalizeTransactions({ transactions: [] }, [
    '0 USD', '0 USD', '1 EUR', '1 EUR',
  ])
  assert.deepEqual(calculateDailyRevenue(transactions, { EUR: 3 }), {
    total: 0.67, currency: 'USD',
  })
})

test('обробляє порожні дані та одну валюту без курсів', () => {
  assert.deepEqual(calculateDailyRevenue([], {}), { total: 0, currency: 'USD' })
  assert.deepEqual(calculateDailyRevenue([{ amount: 10, currency: 'EUR' }], {}), {
    total: 10, currency: 'EUR',
  })
})

test('відхиляє некоректні суми та відсутні або нульові курси', () => {
  assert.throws(() => normalizeTransactions({ transactions: [] }, ['oops USD']))
  assert.throws(() => normalizeTransactions({}, []))
  for (const rates of [{}, { GBP: 0 }]) {
    assert.throws(() => calculateDailyRevenue([{ amount: 10, currency: 'GBP' }], rates))
  }
})
