export const genValidCpf = () => {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 9));

  const calcCheckDigit = (nums) => {
    let sum = 0;
    let factor = nums.length + 1;
    for (const digit of nums) {
      sum += digit * factor;
      factor -= 1;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const d1 = calcCheckDigit(digits);
  const d2 = calcCheckDigit([...digits, d1]);
  return [...digits, d1, d2].join("");
};

export const genUniqueEmail = (label) => `${label}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;

export const validClientPayload = (overrides = {}) => ({
  personType: "cpf",
  role: "client",
  name: "Usuario de Teste",
  cpf: genValidCpf(),
  email: genUniqueEmail("teste-auth"),
  password: "SenhaForte1",
  phone: "11999999999",
  birthDate: "1990-01-01",
  rg: "123456",
  ...overrides,
});
