export const currencies = {
  USD: { symbol: '$', name: 'US Dollar' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
  NGN: { symbol: '₦', name: 'Nigerian Naira' },
  ZAR: { symbol: 'R', name: 'South African Rand' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
}

export type CurrencyCode = keyof typeof currencies

export function formatPrice(amount: number, currency: CurrencyCode = 'USD'): string {
  const { symbol } = currencies[currency]
  return `${symbol}${amount.toFixed(2)}`
}

export function convertPrice(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  const rates: Record<CurrencyCode, number> = {
    USD: 1,
    KES: 0.009,
    NGN: 0.0013,
    ZAR: 0.053,
    EUR: 0.92,
    GBP: 0.79,
  }

  const inUSD = amount / rates[from]
  return inUSD * rates[to]
}
