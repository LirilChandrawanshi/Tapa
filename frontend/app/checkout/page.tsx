import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CheckoutView } from "@/components/shop/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Delivery address and payment — prepaid only, no COD.",
};

export default function CheckoutPage() {
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
