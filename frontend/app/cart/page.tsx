import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CartView } from "@/components/shop/CartView";

export const metadata: Metadata = {
  title: "Your bag",
  description: "Review your pujan bag before checkout.",
};

export default function CartPage() {
  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Ritual Pujans", href: "/ritual-pujans" },
          { label: "Your bag" },
        ]}
      />
      <div className="mx-auto max-w-[1080px] px-4 py-8 md:px-10">
        <h1 className="mb-5 text-2xl font-bold tracking-[-0.4px] text-ink">
          Your bag
        </h1>
        <CartView />
      </div>
    </div>
  );
}
