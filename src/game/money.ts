/** Rupiah ringkas untuk UI: Rp1,4 jt / Rp380 rb. */
export const rpShort = (n: number) => {
  const neg = n < 0 ? "-" : "";
  const a = Math.abs(n);
  return a >= 1_000_000 ? `${neg}Rp${(a / 1_000_000).toFixed(1).replace(".", ",")} jt` : `${neg}Rp${Math.round(a / 1000)} rb`;
};
