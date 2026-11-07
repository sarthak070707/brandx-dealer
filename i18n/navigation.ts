import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

// Links and redirects that keep the visitor's language, so no page builds "/hi" by hand.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
