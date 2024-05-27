function hideCpf(cpf) {
  const partes = cpf.split('-')
  const numeros = partes[0].split('.')

  numeros[0] = '***'
  partes[1] = '**'

  return `${numeros.join('.')}-${partes[1]}`
}

module.exports = hideCpf