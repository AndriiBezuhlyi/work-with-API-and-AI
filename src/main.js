import './style.css'
import { getFinanceSources, getExchangeRates } from './api.js'
import { normalizeTransactions } from './transactions.js'
import { calculateDailyRevenue, selectCurrency } from './revenue.js'
import { renderTransactionList } from './transactionList.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <main id="center">
    <h1>Сума транзакцій</h1>
    <p id="status" role="status" aria-live="polite"></p>
    <pre id="result" hidden></pre>
    <button id="reload" class="counter" type="button">Оновити</button>
  </main>
  <aside class="transactions-panel" aria-labelledby="transactions-title">
    <h2 id="transactions-title">Усі транзакції</h2>
    <p id="transactions-status" role="status"></p>
    <ul id="transactions-list"></ul>
  </aside>
`

const status = document.querySelector('#status')
const result = document.querySelector('#result')
const reloadButton = document.querySelector('#reload')
const transactionsList = document.querySelector('#transactions-list')
const transactionsStatus = document.querySelector('#transactions-status')

async function loadRevenue() {
  reloadButton.disabled = true
  result.hidden = true
  status.textContent = 'Завантаження транзакцій…'
  transactionsList.replaceChildren()
  transactionsStatus.textContent = 'Завантаження…'
  let stage = 'Завантаження джерел'
  console.info(`[Початок] ${stage}`)

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
    stage = 'Вибір основної валюти'
    const currency = selectCurrency(transactions)
    console.info(`[Успіх] Основна валюта: ${currency}`)

    // Якщо всі транзакції вже в основній валюті, запит курсів не потрібний.
    const needsConversion = transactions.some(item => item.currency !== currency)
    stage = 'Завантаження курсів'
    console.info(needsConversion ? '[Початок] Завантаження курсів' : '[Пропущено] Конвертація не потрібна')
    const rates = needsConversion ? await getExchangeRates() : {}
    if (needsConversion) console.info('[Успіх] Курси отримано')
    stage = 'Конвертація та підрахунок'
    console.info(`[Початок] ${stage}`)
    const revenue = calculateDailyRevenue(transactions, rates)

    result.textContent = JSON.stringify(revenue, null, 2)
    result.hidden = false
    status.textContent = transactions.length
      ? `Враховано транзакцій: ${transactions.length}`
      : 'Немає транзакцій для підрахунку.'
    console.info('[Успіх] Підрахунок завершено', revenue)
  } catch (error) {
    console.error(`[Невдача] ${stage}: ${error.message}`)
    if (!transactionsList.children.length) transactionsStatus.textContent = 'Список недоступний через помилку завантаження або обробки даних.'
    status.textContent = `Не вдалося порахувати суму: ${error.message}`
  } finally {
    reloadButton.disabled = false
  }
}

reloadButton.addEventListener('click', loadRevenue)
loadRevenue()
