import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy and consent | Brand X Lucknow",
  description: "What Brand X collects when you enquire or book a test drive, who sees it, and how to stop messages.",
};

const SECTIONS = [
  {
    title: "What we collect",
    body: "Your name, mobile number, the language you prefer, your message, and the car or test-drive slot you asked about. We also keep the time you agreed to be contacted.",
  },
  {
    title: "Why we collect it",
    body: "Only to answer your enquiry or arrange your test drive. We do not sell your details or pass them to advertisers.",
  },
  {
    title: "Who can see it",
    body: "The consultant your enquiry is assigned to, and the dealership's admins. It is never shown on the website. On used-car pages the registration number is partly hidden until you buy.",
  },
  {
    title: "AI and your enquiry",
    body: "A consultant may use an AI tool to summarise your message and draft a reply. It sees your message, the car, the city and our listed prices. It never sees your name, number or email, and a consultant reads and approves every reply before it goes out.",
  },
  {
    title: "Messages",
    body: "With your agreement, we may contact you by phone, WhatsApp or SMS about your enquiry. In this demo no real message is sent. Every message carries a link to stop them.",
  },
  {
    title: "Your choices",
    body: "You can stop all messages at any time on the Stop messages page. You can also ask to see, correct or delete your details by writing to privacy@brandx.example. This follows India's Digital Personal Data Protection Act, 2023.",
  },
  {
    title: "Consent",
    body: "We ask for your agreement before every enquiry and booking, in plain language, and the box is never ticked for you.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="px-4 py-12 sm:px-8 lg:px-12 lg:pb-section">
      <div className="mb-10 flex max-w-2xl flex-col gap-3">
        <h1 className="text-5xl font-light tracking-tight font-stretch-semi-condensed sm:text-6xl">Privacy and consent</h1>
        <p className="text-lg text-muted-foreground">What happens to your details, in plain words.</p>
      </div>
      <div className="flex max-w-2xl flex-col gap-8">
        {SECTIONS.map((section) => (
          <section key={section.title} aria-labelledby={section.title}>
            <h2 id={section.title} className="mb-2 text-2xl">
              {section.title}
            </h2>
            <p className="text-lg text-muted-foreground">{section.body}</p>
          </section>
        ))}
        <p className="text-sm text-muted-foreground">Brand X is a fictional brand, and every name, number and price on this site is sample data.</p>
      </div>
    </main>
  );
}
