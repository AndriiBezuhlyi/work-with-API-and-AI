const currencies = {
  EUR: 'Євро', GBP: 'Британський фунт', JPY: 'Японська єна',
  CHF: 'Швейцарський франк', CAD: 'Канадський долар',
  AUD: 'Австралійський долар', CNY: 'Китайський юань',
}

export function renderExchangeRates(list, { rates }) {
  const fragment = document.createDocumentFragment()
  const formatter = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 4 })
  for (const [currency, name] of Object.entries(currencies)) {
    const item = document.createElement('li')
    const rate = Number(rates[currency])
    item.textContent = Number.isFinite(rate) && rate > 0
      ? `${name}: 1 USD = ${formatter.format(rate)} ${currency}`
      : `${name} (${currency}): курс недоступний`
    fragment.append(item)
  }
  list.replaceChildren(fragment)
}
