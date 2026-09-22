import type {
  Audience,
  CartRequestEventType,
  CartRequestStatus,
  ProductStatus,
  ProductTagType,
  Role,
} from "@/generated/prisma/enums";

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DISPONIBLE: "Disponible",
  BAJO_PEDIDO: "Bajo pedido",
  AGOTADO: "Agotado",
  OCULTO: "Oculto",
};

/** Estados que un visitante puede ver en el catálogo público. */
export const PUBLIC_PRODUCT_STATUSES: ProductStatus[] = [
  "DISPONIBLE",
  "BAJO_PEDIDO",
  "AGOTADO",
];

export const PRODUCT_TAG_LABELS: Record<ProductTagType, string> = {
  OFERTA: "Oferta",
  TENDENCIA: "Tendencia",
  NUEVO: "Nuevo",
  RECOMENDADO: "Recomendado",
};

export const AUDIENCE_LABELS: Record<Audience, string> = {
  HOMBRE: "Hombre",
  MUJER: "Mujer",
  NINO: "Niño",
  NINA: "Niña",
  UNISEX: "Unisex",
};

export const CART_REQUEST_STATUS_LABELS: Record<CartRequestStatus, string> = {
  NUEVO: "Nuevo",
  CONTACTADO: "Contactado",
  EN_NEGOCIACION: "En negociación",
  CONFIRMADO: "Confirmado",
  CERRADO: "Cerrado",
  PERDIDO: "Perdido",
};

export const CART_REQUEST_STATUS_ORDER: CartRequestStatus[] = [
  "NUEVO",
  "CONTACTADO",
  "EN_NEGOCIACION",
  "CONFIRMADO",
  "CERRADO",
  "PERDIDO",
];

export const CART_REQUEST_OPEN_STATUSES: CartRequestStatus[] = [
  "NUEVO",
  "CONTACTADO",
  "EN_NEGOCIACION",
];

export const CART_REQUEST_EVENT_LABELS: Record<CartRequestEventType, string> = {
  NOTE: "Nota",
  STATUS_CHANGE: "Cambio de estado",
  ASSIGNMENT: "Asignación",
  CREATED: "Solicitud creada",
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador general",
  SALES: "Equipo de ventas",
};

/** Tallas sugeridas al crear un producto; el campo real acepta texto libre. */
export const SUGGESTED_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "2",
  "4",
  "6",
  "8",
  "10",
  "12",
  "14",
  "16",
  "Única",
] as const;

/** Colores sugeridos al crear un producto; el campo real acepta texto libre. */
export const SUGGESTED_COLORS = [
  "Negro",
  "Blanco",
  "Gris",
  "Azul",
  "Azul oscuro",
  "Rojo",
  "Verde",
  "Beige",
  "Café",
  "Rosado",
  "Amarillo",
  "Estampado",
] as const;

/** Días de inactividad de un carrito antes de marcarlo como abandonado. */
export const ABANDONED_CART_DAYS = 8;

export const CATALOG_PAGE_SIZE = 24;

export const SESSION_COOKIE_NAME = "mpm_session";
export const CART_SESSION_COOKIE_NAME = "mpm_cart_session";
