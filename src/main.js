import './style.css'
import { getFinanceSources, getExchangeRates } from './api.js'
import { normalizeTransactions } from './transactions.js'
import { calculateDailyRevenue, calculateCurrencyTotals } from './revenue.js'
import { renderTransactionList } from './transactionList.js'
import { renderExchangeRates } from './exchangeRates.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <aside class="rates-panel" aria-labelledby="rates-title">
    <h2 id="rates-title">Курси валют</h2>
    <p class="panel-description">Вартість 1 USD у світі</p>
    <p id="rates-status" role="status"></p>
    <ul id="rates-list" tabindex="0" aria-label="Список курсів валют"></ul>
  </aside>
  <main id="center">
    <h1>Сума транзакцій</h1>
    <p id="status" role="status" aria-live="polite"></p>
    <pre id="result" hidden></pre>
    <section id="currency-totals" class="summary-card" hidden>
      <h2>Суми за валютами</h2>
      <p>Враховані транзакції до конвертації</p>
      <p id="usd-total"></p>
      <p id="eur-total"></p>
    </section>
    <button id="reload" class="counter" type="button">Оновити</button>
  </main>
  <aside class="transactions-panel" aria-labelledby="transactions-title">
    <h2 id="transactions-title">Усі транзакції</h2>
    <p id="transactions-status" role="status"></p>
    <ul id="transactions-list" tabindex="0" aria-label="Список транзакцій"></ul>
  </aside>
`

const status = document.querySelector('#status')
const result = document.querySelector('#result')
const reloadButton = document.querySelector('#reload')
const transactionsList = document.querySelector('#transactions-list')
const transactionsStatus = document.querySelector('#transactions-status')
const currencyTotals = document.querySelector('#currency-totals')
const ratesStatus = document.querySelector('#rates-status')
const ratesList = document.querySelector('#rates-list')
const formatAmount = amount => amount.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

async function loadRates() {
  try {
    const data = await getExchangeRates()
    renderExchangeRates(ratesList, data)
    ratesStatus.textContent = data.date ? `Дата курсів сервісу: ${data.date}` : 'Останні доступні курси сервісу'
    return data.rates
  } catch (error) {
    console.error(`[Невдача] Завантаження курсів: ${error.message}`)
    ratesStatus.textContent = 'Не вдалося завантажити курси валют. Спробуйте оновити сторінку пізніше.'
    return null
  }
}

async function loadRevenue() {
  reloadButton.disabled = true
  result.hidden = true
  currencyTotals.hidden = true
  ratesList.replaceChildren()
  ratesStatus.textContent = 'Завантаження курсів…'
  status.textContent = 'Завантаження транзакцій…'
  transactionsList.replaceChildren()
  transactionsStatus.textContent = 'Завантаження…'
  let stage = 'Завантаження джерел'
  console.info(`[Початок] ${stage}`)
  // Один запит курсів обслуговує і список, і конвертацію. Блоки можуть працювати незалежно.
  const ratesPromise = loadRates()

  try {
    const [source1, source2] = await getFinanceSources()
    console.info('[Успіх] Обидва джерела завантажено')
    stage = 'Підготовка транзакцій'
    console.info(`[Початок] ${stage}`)
    const allTransactions = normalizeTransactions(source1, source2, { includeAll: true })
    const transactions = allTransactions.filter(item => item.included)
    renderTransactionList(transactionsList, allTransactions)
    transactionsStatus.textContent = allTransactions.length
      ? `Усього: ${allTransactions.length}. Враховано: ${transactions.length}.`
      : 'Транзакцій немає.'
    console.info('[Успіх] Транзакції підготовлено', {
      total: allTransactions.length,
      included: transactions.length,
      excluded: allTransactions.length - transactions.length,
    })
    const totals = calculateCurrencyTotals(transactions)
    document.querySelector('#usd-total').textContent = `USD: ${formatAmount(totals.USD)}`
    document.querySelector('#eur-total').textContent = `EUR: ${formatAmount(totals.EUR)}`
    currencyTotals.hidden = false
    console.info('[Успіх] Основна валюта: USD', totals)
    const needsConversion = transactions.some(item => item.currency !== 'USD')
    stage = 'Завантаження курсів'
    const rates = needsConversion ? await ratesPromise : {}
    if (!rates) throw new Error('Курси недоступні для конвертації')
    stage = 'Конвертація та підрахунок'
    console.info(`[Початок] ${stage}`)
    const revenue = calculateDailyRevenue(transactions, rates)

    result.textContent = `${formatAmount(revenue.total)} USD`
    result.hidden = false
    status.textContent = transactions.length
      ? `Враховано транзакцій: ${transactions.length}`
      : 'Немає транзакцій для підрахунку.'
    console.info('[Успіх] Підрахунок завершено', revenue)
  } catch (error) {
    console.error(`[Невдача] ${stage}: ${error.message}`)
    if (!transactionsList.children.length) transactionsStatus.textContent = 'Не вдалося отримати список транзакцій. Спробуйте ще раз пізніше.'
    status.textContent = stage === 'Завантаження джерел'
      ? 'Не вдалося завантажити транзакції із сервісу. Перевірте з’єднання та спробуйте ще раз.'
      : stage === 'Завантаження курсів' || stage === 'Конвертація та підрахунок'
        ? 'Не вдалося розрахувати суму в USD. Дані або потрібні курси зараз недоступні. Спробуйте пізніше.'
        : 'Не вдалося обробити дані транзакцій від сервісу. Спробуйте пізніше.'
  } finally {
    await ratesPromise
    reloadButton.disabled = false
  }
}

reloadButton.addEventListener('click', loadRevenue)
loadRevenue()
