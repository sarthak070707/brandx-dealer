// The demo logins shown on the staff sign-in page. The seed creates these accounts with this password,
// so the page and the data can't disagree.
export const DEMO_PASSWORD = "BrandX-demo-2026";
export const DEMO_ADMIN_EMAIL = "admin@brandx.example";

// Shown unless SHOW_DEMO_LOGINS is set to "false" (in any capitals), so a reviewer needs no setup to see it.
export const showDemoLogins = (setting: string | undefined) => setting?.trim().toLowerCase() !== "false";
