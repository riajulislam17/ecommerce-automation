export const moneyValue = (text: string) => {
  const normalised = text.replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)));
  const numeric = normalised.replace(/[^\d.\-]/g, "");
  const number = Number(numeric);
  if (!/\d/.test(numeric) || !Number.isFinite(number))
    throw new Error(`Could not read displayed money: ${text}`);
  return number;
};

// A displayed zero discount can parse as -0; normalize it for strict assertions.
export const toCents = (amount: number) => Math.round(amount * 100) + 0;
