export function renderTransactionList(list, transactions) {
  const fragment = document.createDocumentFragment()

  for (const transaction of transactions) {
    const item = document.createElement('li')
    item.className = 'transaction'
    const amount = document.createElement('strong')
    const details = document.createElement('small')

    // Дані API вставляємо як текст, щоб браузер не виконував сторонній HTML.
    amount.textContent = `${transaction.amount} ${transaction.currency}`
    details.textContent = `${transaction.source} · ${transaction.status} · ${transaction.included ? 'враховано' : 'не враховано'}`
    item.append(amount, details)
    fragment.append(item)
  }

  list.replaceChildren(fragment)
}
