import { MessageCircle } from "lucide-react";

import { getSiteSettings } from "@/lib/site-config";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export async function WhatsAppFloatButton() {
  const settings = await getSiteSettings();
  const href = buildWhatsAppLink(settings.whatsappNumber, settings.whatsappDefaultMessage);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="focus-ring fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-[#0b3d24] shadow-lg hover:brightness-95 sm:hidden"
      aria-label="Escríbenos por WhatsApp"
    >
      <MessageCircle className="h-5 w-5" aria-hidden="true" />
      WhatsApp
    </a>
  );
}
