import type {
  Prisma,
  Audience,
  CartRequestEventType,
  CartRequestStatus,
  ProductStatus,
  ProductTagType,
  Role,
} from "@prisma/client";

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DISPONIBLE: "Disponible",
  BAJO_PEDIDO: "Bajo pedido",
  AGOTADO: "Agotado",
  OCULTO: "Oculto",
};

/**
 * Estados que un visitante puede ver en el catálogo público.
 */
export const PUBLIC_PRODUCT_STATUSES: ProductStatus[] = [
  "DISPONIBLE",
  "BAJO_PEDIDO",
  "AGOTADO",
];

/** Estados con los que se puede pedir una prenda (AGOTADO se ve, pero no se pide). */
export const ORDERABLE_PRODUCT_STATUSES: ProductStatus[] = ["DISPONIBLE", "BAJO_PEDIDO"];

/**
 * Una categoría marcada como oculta ("Visible en el sitio público" apagado)
 * esconde también sus productos, igual que una categoría padre oculta
 * esconde a sus subcategorías en el menú.
 */
export const PUBLIC_CATEGORY_WHERE = {
  isVisible: true,
  OR: [{ parentId: null }, { parent: { isVisible: true } }],
} satisfies Prisma.CategoryWhereInput;

/** Límites del carrito; el servidor los vuelve a validar al recibir la solicitud. */
export const MAX_CART_ITEM_QUANTITY = 500;
export const MAX_CART_LINES = 50;

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

/** Públicos que se ofrecen en el filtro del catálogo (el resto sigue existiendo en la base, sin productos). */
export const CATALOG_AUDIENCES: Audience[] = ["HOMBRE", "MUJER"];

export const CART_REQUEST_STATUS_LABELS: Record<CartRequestStatus, string> = {
  NUEVO: "Nuevo",
  CONTACTADO: "Contactado",
  EN_NEGOCIACION: "En negociación",
  VENDIDO: "Vendido",
  CERRADO: "Cerrado",
  CANCELADO: "Cancelado",
};

export const CART_REQUEST_STATUS_ORDER: CartRequestStatus[] = [
  "NUEVO",
  "CONTACTADO",
  "EN_NEGOCIACION",
  "VENDIDO",
  "CERRADO",
  "CANCELADO",
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


/** Días de inactividad de un carrito antes de marcarlo como abandonado. */
export const ABANDONED_CART_DAYS = 8;

export const CATALOG_PAGE_SIZE = 24;

export const SESSION_COOKIE_NAME = "mpm_session";
export const CART_SESSION_COOKIE_NAME = "mpm_cart_session";
