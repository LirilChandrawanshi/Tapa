import type { Metadata } from "next";
import { PhaseClosed } from "@/components/PhaseClosed";
import { getFlags } from "@/lib/flags";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CheckoutView } from "@/components/shop/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Delivery address and payment — prepaid only, no COD.",
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const flags = await getFlags();
  if (!flags.kits_launched) {
    return <PhaseClosed section="kits" />;
  }
  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Your bag", href: "/cart" },
          { label: "Checkout" },
        ]}
      />
      <div className="mx-auto max-w-[1080px] px-4 py-8 md:px-10">
        <h1 className="mb-5 text-2xl font-bold tracking-[-0.4px] text-ink">
          Checkout
        </h1>
        <CheckoutView />
      </div>
    </div>
  );
}
