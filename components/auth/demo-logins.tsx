import { getTranslations } from "next-intl/server";
import { CopyText } from "@/components/auth/copy-text";
import { DEMO_ADMIN_EMAIL, DEMO_PASSWORD } from "@/lib/demo-logins";

// For a reviewer who opens the live site: how to get in as an admin, and how to get from there to a consultant.
export async function DemoLogins() {
  const t = await getTranslations("DemoLogins");
  const copy = { copyLabel: t("copy"), copiedLabel: t("copied") };

  return (
    <section aria-labelledby="demo-logins" className="flex flex-col gap-5 rounded-2xl border bg-card p-6">
      <div className="flex flex-col gap-1">
        <h2 id="demo-logins" className="text-xl">
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("lead")}</p>
      </div>

      <dl className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <dt className="text-sm text-muted-foreground">{t("admin")}</dt>
          <dd>
            <CopyText value={DEMO_ADMIN_EMAIL} {...copy} />
          </dd>
        </div>
        <div className="flex flex-col gap-2">
          <dt className="text-sm text-muted-foreground">{t("password")}</dt>
          <dd>
            <CopyText value={DEMO_PASSWORD} {...copy} />
          </dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2 border-t pt-4">
        <h3 className="text-base">{t("consultantTitle")}</h3>
        <ol className="list-decimal pl-5 text-sm text-muted-foreground">
          <li>{t("step1")}</li>
          <li>{t("step2")}</li>
          <li>{t("step3")}</li>
        </ol>
        <p className="text-sm text-muted-foreground">{t("note")}</p>
      </div>
    </section>
  );
}
