import type { Metadata } from "next";
import { PhaseClosed } from "@/components/PhaseClosed";
import { getFlags } from "@/lib/flags";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CartView } from "@/components/shop/CartView";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review your cart before checkout.",
};

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const flags = await getFlags();
  if (!flags.kits_launched) {
    return <PhaseClosed section="kits" />;
  }
  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Ritual Pujans", href: "/ritual-pujans" },
          { label: "Your cart" },
        ]}
      />
      <div className="mx-auto max-w-[1080px] px-4 py-8 md:px-10">
        <h1 className="mb-1 text-2xl font-bold tracking-[-0.4px] text-ink">
          Your cart
        </h1>
        <p className="mb-5 text-[13px] text-sub">
          Review your cart before checkout.
        </p>
        <CartView />
      </div>
    </div>
  );
}
