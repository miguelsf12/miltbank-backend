function convertCurrencyToFloat(value) {
  // Remove o ponto usado como separador de milhar
  let formattedValue = value.replace(/\./g, '')

  // Substitui a vírgula usada como separador decimal por um ponto
  formattedValue = formattedValue.replace(/,/, '.')

  return parseFloat(formattedValue)
}

module.exports = {
  convertCurrencyToFloat
}
