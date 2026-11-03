const rupeeFormat = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatRupees(paise: number) {
  return rupeeFormat.format(Math.round(paise / 100));
}
