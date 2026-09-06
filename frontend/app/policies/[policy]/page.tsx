import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";

/**
 * Policy pages. Drafts written for launch — every page carries a review-pending
 * marker until legal sign-off. The Grievance Officer block is required by the
 * Consumer Protection (E-Commerce) Rules 2020 before any commerce page is public.
 */

const POLICIES: Record<string, { title: string; sections: [string, string][] }> = {
  terms: {
    title: "Terms of Use",
    sections: [
      [
        "Who we are",
        "thetapaco.com is operated by Tale Scale Networks Private Limited. By using the site you agree to these terms.",
      ],
      [
        "The knowledge layer is free",
        "Every ritual guide, panchang date and glossary entry is free to read. No account is needed to read anything.",
      ],
      [
        "Accounts",
        "Accounts are created with a mobile number and a one-time password. You are responsible for the number you register. We never set a password.",
      ],
      [
        "Orders",
        "Kit orders are prepaid. An order is confirmed only when payment is captured, and is governed by the Cancellation and Refund policies below.",
      ],
      [
        "Content",
        "Our editorial content cites its sources. It is devotional and educational — it is not medical, legal or astrological advice.",
      ],
    ],
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      [
        "What we collect",
        "Your mobile number (the account key), a name and city if you share them, delivery addresses for orders, and the rituals you save.",
      ],
      [
        "What we never do",
        "We do not sell your number or your data. The Tapa Circle stores only your WhatsApp number and per-send status — no name, no location, no message content.",
      ],
      [
        "Deletion",
        "Ask for deletion from your account page or by replying DELETE on WhatsApp. Records go within 7 working days; invoices are retained for the statutory period.",
      ],
      [
        "Analytics",
        "We measure product usage in aggregate to improve the guides. Marketing communication is off by default.",
      ],
    ],
  },
  cancellation: {
    title: "Cancellation Policy",
    sections: [
      [
        "Pre-booked kits",
        "Cancellable free of charge within 48 hours of ordering, and any time before dispatch by writing to help@thetapaco.com.",
      ],
      [
        "In-stock kits",
        "Cancellable free of charge within 24 hours of ordering, until dispatch.",
      ],
      [
        "After dispatch",
        "A dispatched order cannot be cancelled, but the damage policy below still protects you.",
      ],
      [
        "How refunds land",
        "Cancelled orders are refunded in full to the original payment method within 3–5 working days.",
      ],
    ],
  },
  refund: {
    title: "Refund & Damage Policy",
    sections: [
      [
        "Delivered before the date, or your money back",
        "A dated kit that misses its occasion is refunded in full. That is the promise the pre-booking price carries.",
      ],
      [
        "Damaged or incomplete kits",
        "Report within 48 hours of delivery with photos of the carton and contents to help@thetapaco.com. We replace or refund — your choice.",
      ],
      [
        "Timelines",
        "Approved refunds reach the original payment method within 3–5 working days.",
      ],
    ],
  },
  shipping: {
    title: "Shipping & Delivery",
    sections: [
      [
        "Where we deliver",
        "Delhi-NCR and selected pincodes. The pincode check on every kit page is the source of truth.",
      ],
      [
        "Dated kits",
        "Pre-booked kits are dispatched from the dispatch date shown and delivered at least 3 days before the occasion.",
      ],
      [
        "In-stock kits",
        "Dispatched within 1 working day; delivered in 2–3 days.",
      ],
      [
        "Charges",
        "Delivery is free on orders of ₹999 or more, and ₹49 below that.",
      ],
    ],
  },
  "grievance-redressal": {
    title: "Grievance Redressal",
    sections: [
      [
        "Grievance Officer",
        "[Name pending appointment] · grievance@thetapaco.com · Tale Scale Networks Private Limited. Required under the Consumer Protection (E-Commerce) Rules, 2020.",
      ],
      [
        "Our commitment",
        "Complaints are acknowledged within 48 hours and resolved within one month of receipt.",
      ],
      [
        "How to raise one",
        "Write to grievance@thetapaco.com with your order number. Editorial corrections have their own path: the Report a Correction page.",
      ],
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(POLICIES).map((policy) => ({ policy }));
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ policy: string }>;
}) {
  const { policy } = await params;
  const doc = POLICIES[policy];
  if (!doc) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-[760px] px-4 py-10 md:px-10">
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: doc.title }]}
      />
      <h1 className="mt-4 text-[26px] font-bold text-ink">{doc.title}</h1>
      <p className="mt-1 text-[11px] tracking-wide text-sub uppercase">
        Draft · pending legal review · Tale Scale Networks Private Limited
      </p>
      <div className="mt-8 space-y-7">
        {doc.sections.map(([heading, body]) => (
          <section key={heading}>
            <h2 className="text-[15px] font-bold text-ink">{heading}</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-mid">{body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
