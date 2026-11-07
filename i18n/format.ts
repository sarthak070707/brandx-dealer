// The locale tag Intl uses for each of our languages. Both keep Indian digit grouping
// (12,45,000) and Latin digits, which is how prices are written in Hindi too.
export const intlTag = (locale: string) => (locale === "hi" ? "hi-IN" : "en-IN");
