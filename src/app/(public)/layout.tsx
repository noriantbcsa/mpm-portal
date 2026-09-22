import type { ReactNode } from "react";

import { SkipLink } from "@/components/ui/skip-link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloatButton } from "@/components/layout/whatsapp-float-button";
import { CartSessionSync } from "@/components/cart/cart-session-sync";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsAppFloatButton />
      <CartSessionSync />
    </>
  );
}
