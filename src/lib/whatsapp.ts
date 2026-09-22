import { onlyDigits } from "@/lib/format";

export function buildWhatsAppLink(phone: string, message: string) {
  const digits = onlyDigits(phone);
  const params = new URLSearchParams({ text: message });
  return `https://wa.me/${digits}?${params.toString()}`;
}

export type CartRequestMessageItem = {
  name: string;
  sku: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
};

export type CartRequestMessageInput = {
  contactName: string;
  city: string;
  companyName?: string | null;
  comment?: string | null;
  items: CartRequestMessageItem[];
};

/**
 * Construye el mensaje estructurado que ve el asesor de ventas en WhatsApp al
 * abrir una solicitud comercial. Se mantiene en texto plano legible: WhatsApp
 * no soporta Markdown salvo *negrita*, _cursiva_ y saltos de línea.
 */
export function buildCartRequestMessage(input: CartRequestMessageInput) {
  const lines: string[] = [];
  lines.push(`*Nueva solicitud MPM*`);
  lines.push(`Cliente: ${input.contactName}`);
  lines.push(`Ciudad: ${input.city}`);
  if (input.companyName) lines.push(`Empresa: ${input.companyName}`);
  lines.push("");
  lines.push("*Prendas solicitadas:*");
  for (const item of input.items) {
    const details = [
      item.size ? `talla ${item.size}` : null,
      item.color ? `color ${item.color}` : null,
    ]
      .filter(Boolean)
      .join(", ");
    const detailsSuffix = details ? ` (${details})` : "";
    lines.push(`• ${item.quantity} x ${item.name} [ref. ${item.sku}]${detailsSuffix}`);
  }
  if (input.comment) {
    lines.push("");
    lines.push(`Comentario del cliente: ${input.comment}`);
  }
  lines.push("");
  lines.push("Mensaje generado automáticamente desde el portal MPM.");
  return lines.join("\n");
}

export function buildGeneralInquiryMessage(defaultMessage: string) {
  return defaultMessage;
}

/**
 * Enlace que usa el equipo de ventas (panel /admin) para abrir WhatsApp
 * directamente con el cliente que dejó la solicitud, con un mensaje inicial
 * ya redactado.
 */
export function buildAdvisorWhatsAppLink(customerPhone: string, contactName: string, siteName: string) {
  const firstName = contactName.trim().split(/\s+/)[0] || contactName;
  const message = `Hola ${firstName}, te escribimos de ${siteName} por tu solicitud de pedido. ¿Tienes un momento para confirmar los detalles?`;
  return buildWhatsAppLink(customerPhone, message);
}
