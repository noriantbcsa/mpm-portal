import type { ReactNode } from "react";

import { SkipLink } from "@/components/ui/skip-link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartSessionSync } from "@/components/cart/cart-session-sync";
import { SeasonalThemeNotice } from "@/components/layout/seasonal-theme-notice";
import { SeasonalBackdrop } from "@/components/layout/seasonal-backdrop";
import { getSiteSettings } from "@/lib/site-config";
import { resolveSeasonalTheme } from "@/lib/seasonal-themes";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();
  const seasonalTheme = resolveSeasonalTheme(settings);

  return (
    <div className="public-site-shell flex min-h-full flex-1 flex-col">
      <SkipLink />
      <SeasonalThemeNotice theme={seasonalTheme} />
      <Header />
      <main id="contenido" className="seasonal-main relative min-w-0 flex-1 overflow-hidden">
        <SeasonalBackdrop theme={seasonalTheme} />
        {children}
      </main>
      <Footer />
      <CartSessionSync />
    </div>
  );
}
