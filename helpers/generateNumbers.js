function generateEightDigitNumber() {
  let eightDigitNumber = '';
  for (let i = 0; i < 8; i++) {
    const randomDigit = Math.floor(Math.random() * 10);
    eightDigitNumber += randomDigit;
  }
  return eightDigitNumber;
}

// Exemplo de uso
const result = generateEightDigitNumber();

module.exports = generateEightDigitNumber