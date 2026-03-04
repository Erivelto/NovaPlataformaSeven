/**
 * Utilitários para formatação de valores monetários
 */

/**
 * Formata string de moeda para número
 * Aceita formatos: "1000", "1.000,00", "1000,00", "1000.00"
 * @param value Valor em string
 * @returns Número formatado
 */
export function parseCurrencyToNumber(value: string | number): number {
  if (!value) return 0;
  
  let cleaned = String(value).replace(/[^0-9,.\-]/g, '');
  
  // Detecta se usa vírgula ou ponto como decimal
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  
  if (lastComma > lastDot) {
    // Vírgula é decimal: "1.000,00" ou "1000,00"
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // Ponto é decimal: "1,000.00" ou "1000.00"
    cleaned = cleaned.replace(/,/g, '');
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Formata número para string de moeda brasileira
 * @param value Valor numérico
 * @returns String formatada "1.000,00"
 */
export function formatNumberToCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseCurrencyToNumber(value) : value;
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Formata e limpa string de entrada de moeda
 * Remove caracteres inválidos e formata com 2 casas decimais
 * @param input Entrada do usuário
 * @returns String formatada
 */
export function cleanAndFormatCurrency(input: string): string {
  if (!input) return '0,00';
  
  const num = parseCurrencyToNumber(input);
  return formatNumberToCurrency(num);
}

/**
 * Formata valor com símbolo R$
 * @param value Valor numérico
 * @returns String com símbolo "R$ 1.000,00"
 */
export function formatWithCurrencySymbol(value: number | string): string {
  const formatted = formatNumberToCurrency(value);
  return `R$ ${formatted}`;
}
