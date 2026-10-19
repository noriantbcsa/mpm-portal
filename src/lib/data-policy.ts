/**
 * Política de tratamiento de datos personales por defecto (Ley 1581 de 2012,
 * Decreto 1377 de 2013 compilado en el Decreto 1074 de 2015, Colombia).
 *
 * Describe únicamente lo que el portal hace hoy: qué se guarda, dónde y para
 * qué. Si el portal empieza a recolectar algo nuevo (analítica, pagos,
 * boletines…), este texto debe actualizarse antes de publicarlo.
 *
 * Es un texto base redactado por el equipo técnico: la razón social, el NIT y
 * la revisión final corresponden al responsable del tratamiento y a su asesor
 * legal. Se puede reemplazar por completo desde /admin/ajustes.
 */

export const DATA_POLICY_UPDATED_AT = "18 de octubre de 2026";

/** Texto sembrado por versiones anteriores; se trata como "sin política propia". */
export const LEGACY_PLACEHOLDER_PREFIX = "Texto provisional";

export type PolicySection = { title: string; paragraphs?: string[]; items?: string[] };

export type PolicyContact = {
  siteName: string;
  address?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
};

/** `true` si el texto guardado en ajustes es una política propia y no el marcador antiguo. */
export function isCustomPolicyText(text: string | null | undefined): text is string {
  const value = text?.trim();
  return Boolean(value) && !value!.startsWith(LEGACY_PLACEHOLDER_PREFIX);
}

export function buildDefaultPolicy(contact: PolicyContact): PolicySection[] {
  const name = contact.siteName.trim() || "MPM";
  const channels = [
    contact.contactEmail?.trim() && `correo electrónico ${contact.contactEmail.trim()}`,
    contact.contactPhone?.trim() && `teléfono o WhatsApp ${contact.contactPhone.trim()}`,
  ].filter(Boolean) as string[];
  const channelsText = channels.length > 0 ? channels.join(" o al ") : "WhatsApp, a través del enlace que aparece en el sitio";

  return [
    {
      title: "1. Responsable del tratamiento",
      paragraphs: [
        `${name} (en adelante, «${name}»), fabricante de ropa con atención al detal y al por mayor, es el responsable del tratamiento de los datos personales recolectados a través de este sitio web, en cumplimiento de la Ley 1581 de 2012, el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) y demás normas que los modifiquen.`,
      ],
      items: [
        ...(contact.address?.trim() ? [`Domicilio: ${contact.address.trim()}.`] : []),
        ...(contact.contactEmail?.trim() ? [`Correo electrónico: ${contact.contactEmail.trim()}.`] : []),
        ...(contact.contactPhone?.trim() ? [`Teléfono / WhatsApp: ${contact.contactPhone.trim()}.`] : []),
      ],
    },
    {
      title: "2. Datos que recolectamos",
      paragraphs: ["Recolectamos únicamente los datos que nos entregas de forma voluntaria al enviar una solicitud de pedido desde el carrito:"],
      items: [
        "Nombre completo, número de teléfono o WhatsApp y ciudad.",
        "Modalidad de compra (al detal o al por mayor), si la indicas.",
        "Comentario opcional que escribas en la solicitud.",
        "Las prendas, tallas, colores y cantidades de tu carrito, y los precios vigentes al momento de enviarlo.",
        "Fecha y hora en que aceptaste esta política.",
      ],
    },
    {
      title: "3. Datos que no recolectamos",
      paragraphs: [
        "No recolectamos datos sensibles, datos de niños, niñas o adolescentes, ni datos de pago: este sitio no cobra ni recibe tarjetas o transferencias. No usamos herramientas de analítica o publicidad de terceros ni vendemos tus datos.",
      ],
    },
    {
      title: "4. Finalidades",
      paragraphs: ["Usamos tus datos exclusivamente para:"],
      items: [
        `Que un asesor comercial de ${name} te contacte por WhatsApp o llamada para confirmar disponibilidad, precios y cerrar tu pedido.`,
        "Hacer seguimiento de tu solicitud y atender consultas posteriores sobre ella.",
        "Cumplir obligaciones legales, contables o de atención de reclamos cuando apliquen.",
      ],
    },
    {
      title: "5. Autorización",
      paragraphs: [
        "Al marcar la casilla de aceptación en el carrito y enviar la solicitud, otorgas tu autorización previa, expresa e informada para el tratamiento descrito. Es voluntaria: puedes explorar el catálogo sin entregar ningún dato, pero sin ellos no podemos gestionar tu pedido. Puedes revocarla en cualquier momento (ver sección 8).",
      ],
    },
    {
      title: "6. Cookies y almacenamiento en tu navegador",
      items: [
        "Una cookie técnica y anónima de carrito (hasta 120 días) que permite guardar los productos que eliges. No contiene tu nombre ni tu teléfono y se elimina cuando envías tu solicitud.",
        "El contenido de tu carrito se guarda también en el almacenamiento local de tu navegador para que no lo pierdas al recargar; puedes borrarlo desde la configuración del navegador.",
        "Nuestro equipo usa una cookie de sesión para acceder al panel administrativo.",
      ],
    },
    {
      title: "7. Quién accede y con quién compartimos",
      paragraphs: [
        `Tus datos solo son visibles para el personal autorizado de ${name} mediante un panel con acceso restringido. No los vendemos ni los cedemos a terceros con fines comerciales.`,
        "Los datos se almacenan con proveedores de infraestructura en la nube que actúan como encargados del tratamiento y cuyos servidores pueden estar ubicados fuera de Colombia. Al enviar tu solicitud también se abre una conversación en WhatsApp con el mensaje de tu pedido, que se rige por las condiciones de ese servicio.",
      ],
    },
    {
      title: "8. Tus derechos",
      paragraphs: ["Como titular puedes, en cualquier momento:"],
      items: [
        "Conocer, actualizar y rectificar tus datos.",
        "Solicitar prueba de la autorización otorgada.",
        "Ser informado del uso que se ha dado a tus datos.",
        "Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la ley.",
        "Revocar la autorización y solicitar la supresión de tus datos, salvo que exista un deber legal o contractual de conservarlos.",
        "Acceder gratuitamente a tus datos personales.",
      ],
    },
    {
      title: "9. Cómo ejercer tus derechos",
      paragraphs: [
        `Escríbenos al ${channelsText}, indicando tu nombre y el teléfono con el que hiciste la solicitud, y qué quieres conocer, corregir o eliminar. Atenderemos las consultas en un máximo de diez (10) días hábiles y los reclamos en un máximo de quince (15) días hábiles, prorrogables en los términos de la ley.`,
      ],
    },
    {
      title: "10. Conservación y seguridad",
      paragraphs: [
        "Conservamos tus datos mientras sean necesarios para las finalidades descritas y durante los plazos que exijan las normas aplicables; después los suprimimos o anonimizamos. Aplicamos medidas técnicas y administrativas razonables (acceso con contraseña y roles, conexión cifrada, límites de intentos), sin que ningún sistema pueda garantizarse infalible.",
      ],
    },
    {
      title: "11. Cambios a esta política",
      paragraphs: [
        `Si modificamos esta política publicaremos la nueva versión en esta página. Vigente desde el ${DATA_POLICY_UPDATED_AT}.`,
      ],
    },
  ];
}
