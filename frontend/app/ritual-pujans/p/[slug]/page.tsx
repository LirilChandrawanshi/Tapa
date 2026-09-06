import type { Metadata } from "next";
import { PhaseClosed } from "@/components/PhaseClosed";
import { getFlags } from "@/lib/flags";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { WhatsAppNudge } from "@/components/WhatsAppNudge";
import { BuyBox } from "@/components/shop/BuyBox";
import { KitManifest } from "@/components/shop/KitManifest";
import { PincodeCheck } from "@/components/shop/PincodeCheck";
import { ProductCard } from "@/components/shop/ProductCard";
import { fetchArticle } from "@/lib/api";
import { articleHref } from "@/lib/articleExtras";
import {
  fetchProduct,
  fetchProducts,
  formatDateLong,
  formatPaise,
  type Product,
} from "@/lib/shop";
import { getSection } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  return product
    ? { title: `${product.title} · Ritual Pujans`, description: product.description }
    : { title: "Ritual Pujans" };
}

function categoryLabel(category: string): string {
  return (
    getSection("ritual-pujans").children.find(
      (c) => (c.href.split("/").pop() ?? "") === category,
    )?.label ?? "Pujans"
  );
}

/** Resolve the free-guide link — knowledge before commerce, never a 404. */
async function guideHref(p: Product): Promise<string> {
  const slug = p.linkedGuideSlugs?.[0];
  if (!slug) return "/ritual-guides";
  try {
    const article = await fetchArticle(slug);
    return articleHref(article);
  } catch {
    return "/ritual-guides";
  }
}

function SectionEyebrow({ children }: { children: string }) {
  return (
    <p className="mb-[6px] text-[10px] font-bold tracking-[0.8px] text-cta uppercase">
      {children}
    </p>
  );
}

function InfoTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid grid-cols-[130px_1fr] gap-3 border-b border-border-light px-[17px] py-[11px] text-[13px] last:border-b-0 sm:grid-cols-[170px_1fr]"
        >
          <span className="font-bold text-sub">{label}</span>
          <span className="leading-relaxed text-body">{value}</span>
        </div>
      ))}
    </div>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const __flags = await getFlags();
  if (!__flags.kits_launched) {
    return <PhaseClosed section="kits" />;
  }
  const { slug } = await params;
  const [product, all] = await Promise.all([fetchProduct(slug), fetchProducts()]);

  if (!product) {
    // Backend down or unknown slug — degrade calmly, never a hard error.
    return (
      <div className="mx-auto max-w-[480px] px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-bold text-ink">
          We couldn&apos;t load this pujan just now
        </h1>
        <p className="mb-5 text-[13.5px] leading-relaxed text-sub">
          It may have moved, or the shelf is briefly unreachable. Every guide
          stays free either way.
        </p>
        <Link
          href="/ritual-pujans"
          className="inline-block rounded-[10px] bg-cta px-6 py-[11px] text-[13.5px] font-bold text-white"
        >
          All Ritual Pujans ›
        </Link>
      </div>
    );
  }

  const p = product;
  const catLabel = categoryLabel(p.category);
  const related = all.filter((x) => x.slug !== p.slug).slice(0, 3);
  const freeGuideHref = await guideHref(p);
  const cardSlug = p.linkedGuideSlugs?.[0];

  const deliveryRows: [string, string][] = [
    [
      "Dispatch",
      p.dispatchFrom
        ? `From ${formatDateLong(p.dispatchFrom)}`
        : "Within 1 day of order confirmation",
    ],
    ["Expected delivery", "2–3 days from dispatch"],
    ["Pre-booked orders", "Pre-booked orders are delivered 3 days before the occasion"],
    ["Serviceable areas", "Delhi-NCR, selected pincodes — check yours above"],
    ["Courier", "Assigned at dispatch. Tracking is shared by SMS."],
  ];

  const cancellationRows: [string, string][] = [
    ["Cancellation", `Within ${p.cancellationHours} hours of placing the order.`],
    ["Refund", "Full amount, to the account the payment came from."],
    ["Damage in transit", "Report damage within 48 hours with photos"],
  ];

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Ritual Pujans", href: "/ritual-pujans" },
          { label: catLabel, href: `/ritual-pujans/${p.category}` },
          { label: p.title },
        ]}
      />

      <div className="mx-auto max-w-[1080px] px-4 py-8 md:px-10">
        {/* ── Top fold: visual + buy column ── */}
        <div className="mb-11 grid items-start gap-7 md:grid-cols-[0.95fr_1.05fr] md:gap-10">
          <div
            className={`${p.hueClass} flex min-h-[260px] flex-col justify-between rounded-[18px] p-6 md:min-h-[340px]`}
          >
            <span className="self-end rounded-[5px] border border-white/30 bg-white/20 px-[9px] py-[3px] text-[9.5px] font-bold tracking-[0.4px] text-white">
              {p.eyebrow}
            </span>
            <div>
              <p className="font-devanagari text-[64px] leading-none text-white/95 md:text-[84px]">
                {p.titleDevanagari}
              </p>
              <p className="mt-3 text-[11px] font-bold tracking-[1px] text-white/70 uppercase">
                {p.items.length} items · weighed and sealed separately
              </p>
            </div>
          </div>

          <div>
            <p className="mb-[8px] text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
              {p.eyebrow}
            </p>
            <h1 className="mb-1 text-[28px] leading-tight font-bold tracking-[-0.6px] text-ink md:text-[32px]">
              <span className="font-devanagari mr-2 text-gold">
                {p.titleDevanagari}
              </span>
              {p.title}
            </h1>
            <p className="mb-4 text-[14px] leading-relaxed text-sub">
              {p.description}
            </p>

            <div className="mb-1 flex items-baseline gap-[10px]">
              <span className="text-[26px] font-bold text-ink">
                {formatPaise(p.pricePaise)}
              </span>
              {p.mrpPaise != null && p.mrpPaise > p.pricePaise && (
                <span className="text-[15px] text-sub line-through">
                  {formatPaise(p.mrpPaise)}
                </span>
              )}
            </div>
            <p className="mb-4 text-[11.5px] text-sub">Inclusive of all taxes</p>

            <BuyBox product={p} />
            <PincodeCheck />
          </div>
        </div>

        {/* ── What's in this kit — locked heading ── */}
        <div className="mb-11">
          <KitManifest items={p.items} />
        </div>

        {/* ── Significance ── */}
        {p.significanceHtml && (
          <section className="mb-11">
            <SectionEyebrow>Significance</SectionEyebrow>
            <div
              className="max-w-[680px] text-[14.5px] leading-[1.85] text-body [&_p]:mb-3"
              dangerouslySetInnerHTML={{ __html: p.significanceHtml }}
            />
          </section>
        )}

        {/* ── How to use ── */}
        {(p.howToUseNote || cardSlug) && (
          <section className="mb-11">
            <SectionEyebrow>How to use</SectionEyebrow>
            {p.howToUseNote && (
              <p className="mb-3 max-w-[680px] text-[14.5px] leading-[1.85] text-body">
                {p.howToUseNote}
              </p>
            )}
            {cardSlug && (
              <a
                href={`/api/v1/cards/${cardSlug}.pdf`}
                className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-card px-4 py-[10px] text-[13px] font-bold text-cta"
              >
                Download the ritual card (PDF) ›
              </a>
            )}
          </section>
        )}

        {/* ── Knowledge before commerce — required cross-link ── */}
        <Link
          href={freeGuideHref}
          className="mb-11 flex items-center gap-4 rounded-[14px] border border-border border-l-[3px] border-l-cta bg-card px-[18px] py-4 transition-colors hover:border-cta"
        >
          <span aria-hidden className="text-[22px]">
            📖
          </span>
          <span className="flex-1">
            <span className="block text-[14px] font-bold text-ink">
              Read the free guide first
            </span>
            <span className="block text-[12.5px] leading-relaxed text-sub">
              The full vidhi, the sankalp, and which parts are scripture rather
              than custom — free on the knowledge layer, kit or no kit.
            </span>
          </span>
          <span aria-hidden className="font-bold text-cta">
            ›
          </span>
        </Link>

        {/* ── Delivery ── */}
        <section className="mb-11">
          <SectionEyebrow>Delivery</SectionEyebrow>
          <InfoTable rows={deliveryRows} />
        </section>

        {/* ── Cancellation ── */}
        <section className="mb-11">
          <SectionEyebrow>Cancellation, returns and damage</SectionEyebrow>
          <InfoTable rows={cancellationRows} />
        </section>

        {/* ── Related pujans ── */}
        {related.length > 0 && (
          <section className="mb-8">
            <SectionEyebrow>Other pujans this season</SectionEyebrow>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <ProductCard key={r.slug} product={r} />
              ))}
            </div>
          </section>
        )}

        <WhatsAppNudge
          copy={
            p.festivalDate
              ? `Get a reminder before ${formatDateLong(p.festivalDate)}, with the guide attached.`
              : "Get vrat and festival reminders with the guide attached."
          }
        />
      </div>
    </div>
  );
}
