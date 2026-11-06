const LOCAL_ORIGIN = "http://localhost:3000";

// Where the site is served from. The sitemap, structured data and opt-out links all use it.
export const siteUrl = () => (process.env.NEXTAUTH_URL || LOCAL_ORIGIN).replace(/\/$/, "");
