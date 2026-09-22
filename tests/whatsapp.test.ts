import { describe, expect, it } from "vitest";

import {
  buildAdvisorWhatsAppLink,
  buildCartRequestMessage,
  buildWhatsAppLink,
} from "@/lib/whatsapp";

describe("buildWhatsAppLink", () => {
  it("strips non-digit characters from the phone number", () => {
    const link = buildWhatsAppLink("+57 (300) 123-4567", "hola");
    expect(link).toBe("https://wa.me/573001234567?text=hola");
  });

  it("URL-encodes the message", () => {
    const link = buildWhatsAppLink("3000000000", "Hola, ¿cómo estás?");
    expect(link).toContain("text=Hola%2C+%C2%BFc%C3%B3mo+est%C3%A1s%3F");
  });
});

describe("buildCartRequestMessage", () => {
  it("includes contact info and every item with size/color", () => {
    const message = buildCartRequestMessage({
      contactName: "Ana Gómez",
      city: "Cali",
      companyName: "Boutique Ana",
      items: [
        { name: "Camiseta básica", sku: "MPM-0001", quantity: 2, size: "M", color: "Negro" },
        { name: "Vestido midi", sku: "MPM-0002", quantity: 1 },
      ],
    });

    expect(message).toContain("Cliente: Ana Gómez");
    expect(message).toContain("Ciudad: Cali");
    expect(message).toContain("Empresa: Boutique Ana");
    expect(message).toContain("2 x Camiseta básica [ref. MPM-0001] (talla M, color Negro)");
    expect(message).toContain("1 x Vestido midi [ref. MPM-0002]");
  });

  it("omits the comment line when there is no comment", () => {
    const message = buildCartRequestMessage({
      contactName: "Luis Ruiz",
      city: "Bogotá",
      items: [{ name: "Short deportivo", sku: "MPM-0003", quantity: 1 }],
    });
    expect(message).not.toContain("Comentario del cliente");
  });

  it("includes the comment when provided", () => {
    const message = buildCartRequestMessage({
      contactName: "Luis Ruiz",
      city: "Bogotá",
      comment: "Necesito la entrega antes del viernes.",
      items: [{ name: "Short deportivo", sku: "MPM-0003", quantity: 1 }],
    });
    expect(message).toContain("Comentario del cliente: Necesito la entrega antes del viernes.");
  });
});

describe("buildAdvisorWhatsAppLink", () => {
  it("greets the customer by first name and mentions the site", () => {
    const link = buildAdvisorWhatsAppLink("3001234567", "María Fernanda Pérez", "MPM");
    expect(link).toContain("https://wa.me/3001234567");
    // URLSearchParams codifica los espacios como "+" (no "%20"); se
    // normalizan antes de comparar el texto del mensaje.
    const decoded = decodeURIComponent(link).replace(/\+/g, " ");
    expect(decoded).toContain("Hola María, te escribimos de MPM");
  });
});
