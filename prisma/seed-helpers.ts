/**
 * Datos de demostración sintéticos que completan el catálogo hasta superar
 * las 300 referencias pedidas, mientras llega el catálogo definitivo de MPM.
 * Las 18 referencias reales (con fotografía) se siembran aparte en
 * `prisma/seed.ts` a partir de `public/catalogo/`; todo lo de aquí usa
 * fotografías de stock (picsum.photos) y debe reemplazarse por carga masiva
 * (CSV) o el panel de productos cuando exista contenido real.
 */
import type { Audience, ProductTagType } from "@prisma/client";

// PRNG determinista (mulberry32): mismos resultados en cada `db:seed`, para
// que el catálogo de demostración no cambie de una corrida a otra.
function createRng(seed: number) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length) % items.length];
}

function pickMany<T>(rng: () => number, items: readonly T[], count: number): T[] {
  const pool = [...items];
  const result: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const index = Math.floor(rng() * pool.length);
    result.push(pool.splice(index, 1)[0]);
  }
  return result;
}

const MATERIALS = [
  "Algodón 100%",
  "Algodón peinado",
  "Poliéster premium",
  "Denim",
  "Licra deportiva",
  "Lino",
  "Mezcla algodón-poliéster",
] as const;

const DESCRIPTORS = ["clásico", "edición especial", "línea premium", "corte moderno", "esencial"] as const;

const SIZE_SETS = [
  ["XS", "S", "M", "L"],
  ["S", "M", "L", "XL"],
  ["M", "L", "XL", "XXL"],
  ["2", "4", "6", "8"],
  ["Única"],
] as const;

const COLOR_SETS = [
  ["Negro", "Blanco"],
  ["Azul", "Gris"],
  ["Rojo", "Negro", "Blanco"],
  ["Beige", "Café"],
  ["Verde", "Azul oscuro"],
  ["Rosado", "Blanco"],
  ["Estampado"],
] as const;

const STATUS_WEIGHTS: Array<"DISPONIBLE" | "BAJO_PEDIDO" | "AGOTADO" | "OCULTO"> = [
  "DISPONIBLE",
  "DISPONIBLE",
  "DISPONIBLE",
  "DISPONIBLE",
  "DISPONIBLE",
  "BAJO_PEDIDO",
  "BAJO_PEDIDO",
  "AGOTADO",
  "OCULTO",
];

const TAG_POOL: ProductTagType[] = ["OFERTA", "TENDENCIA", "NUEVO", "RECOMENDADO"];

export type SyntheticCategorySeed = {
  slug: string;
  name: string;
  description: string;
  parentSlug: string | null;
  audience: Audience;
  baseNames: string[];
  priceRange: [number, number];
  /** Solo se usa en las categorías raíz sintéticas (portada en "Compra por categoría"). */
  imageUrl?: string;
};

export const SYNTHETIC_CATEGORIES: SyntheticCategorySeed[] = [
  {
    slug: "damas-camisetas-blusas",
    name: "Camisetas y blusas",
    description: "Camisetas y blusas para uso diario, oficina o salidas.",
    parentSlug: "damas",
    audience: "MUJER",
    baseNames: ["Blusa manga larga", "Blusa cuello V", "Camiseta básica dama", "Blusa estampada", "Top básico"],
    priceRange: [35000, 69000],
  },
  {
    slug: "damas-vestidos",
    name: "Vestidos",
    description: "Vestidos casuales, midi y de fiesta.",
    parentSlug: "damas",
    audience: "MUJER",
    baseNames: ["Vestido casual", "Vestido midi", "Vestido de fiesta", "Vestido cruzado", "Vestido playero"],
    priceRange: [59000, 149000],
  },
  {
    slug: "damas-pantalones",
    name: "Pantalones y leggings",
    description: "Pantalones, jeans y leggings para dama.",
    parentSlug: "damas",
    audience: "MUJER",
    baseNames: ["Legging deportivo", "Jean recto dama", "Jean skinny", "Pantalón jogger dama", "Palazzo"],
    priceRange: [45000, 99000],
  },
  {
    slug: "damas-deportiva",
    name: "Ropa deportiva",
    description: "Conjuntos y prendas deportivas para dama.",
    parentSlug: "damas",
    audience: "MUJER",
    baseNames: ["Conjunto deportivo dama", "Licra deportiva", "Top deportivo", "Chaqueta deportiva dama"],
    priceRange: [49000, 119000],
  },
  {
    slug: "caballero-camisetas",
    name: "Camisetas",
    description: "Camisetas casuales y polo para caballero.",
    parentSlug: "caballero",
    audience: "HOMBRE",
    baseNames: ["Camiseta básica", "Camiseta estampada", "Camiseta polo", "Camiseta cuello redondo"],
    priceRange: [35000, 65000],
  },
  {
    slug: "caballero-camisas",
    name: "Camisas",
    description: "Camisas formales y casuales para caballero.",
    parentSlug: "caballero",
    audience: "HOMBRE",
    baseNames: ["Camisa de lino", "Camisa formal", "Camisa a cuadros", "Camisa manga larga"],
    priceRange: [59000, 119000],
  },
  {
    slug: "caballero-pantalones",
    name: "Pantalones",
    description: "Jeans, joggers y pantalones formales para caballero.",
    parentSlug: "caballero",
    audience: "HOMBRE",
    baseNames: ["Jean recto caballero", "Pantalón de dril", "Jogger caballero", "Pantalón formal"],
    priceRange: [55000, 129000],
  },
  {
    slug: "caballero-deportiva",
    name: "Ropa deportiva",
    description: "Conjuntos y prendas deportivas para caballero.",
    parentSlug: "caballero",
    audience: "HOMBRE",
    baseNames: ["Conjunto deportivo caballero", "Short deportivo", "Chaqueta deportiva caballero", "Camiseta técnica"],
    priceRange: [49000, 119000],
  },
  {
    slug: "ninos",
    name: "Niños",
    description: "Ropa para niño, niña y bebé.",
    parentSlug: null,
    imageUrl: "https://picsum.photos/seed/mpm-categoria-ninos/600/600",
    audience: "UNISEX",
    baseNames: [],
    priceRange: [29000, 69000],
  },
  {
    slug: "ninos-nino",
    name: "Niño",
    description: "Ropa para niño.",
    parentSlug: "ninos",
    audience: "NINO",
    baseNames: ["Camiseta niño", "Pantalón niño", "Conjunto niño", "Short niño"],
    priceRange: [29000, 59000],
  },
  {
    slug: "ninos-nina",
    name: "Niña",
    description: "Ropa para niña.",
    parentSlug: "ninos",
    audience: "NINA",
    baseNames: ["Vestido niña", "Camiseta niña", "Conjunto niña", "Falda niña"],
    priceRange: [29000, 59000],
  },
  {
    slug: "ninos-bebe",
    name: "Bebé",
    description: "Ropa para bebé.",
    parentSlug: "ninos",
    audience: "UNISEX",
    baseNames: ["Body bebé", "Conjunto bebé", "Pijama bebé", "Enterizo bebé"],
    priceRange: [25000, 49000],
  },
  {
    slug: "dotacion",
    name: "Dotación empresarial",
    description: "Prendas corporativas y uniformes por volumen.",
    parentSlug: null,
    imageUrl: "https://picsum.photos/seed/mpm-categoria-dotacion/600/600",
    audience: "UNISEX",
    baseNames: [],
    priceRange: [35000, 89000],
  },
  {
    slug: "dotacion-camisetas",
    name: "Camisetas corporativas",
    description: "Camisetas y polos con espacio para marcar logo.",
    parentSlug: "dotacion",
    audience: "UNISEX",
    baseNames: ["Camiseta corporativa", "Polo corporativo", "Chaleco corporativo"],
    priceRange: [35000, 69000],
  },
  {
    slug: "dotacion-uniformes",
    name: "Uniformes",
    description: "Uniformes industriales y escolares.",
    parentSlug: "dotacion",
    audience: "UNISEX",
    baseNames: ["Uniforme industrial", "Overol de trabajo", "Uniforme escolar"],
    priceRange: [49000, 99000],
  },
  {
    slug: "accesorios",
    name: "Accesorios",
    description: "Gorras, bolsos y medias.",
    parentSlug: null,
    imageUrl: "https://picsum.photos/seed/mpm-categoria-accesorios/600/600",
    audience: "UNISEX",
    baseNames: [],
    priceRange: [15000, 59000],
  },
  {
    slug: "accesorios-gorras",
    name: "Gorras y sombreros",
    description: "Gorras deportivas, planas y sombreros de ala.",
    parentSlug: "accesorios",
    audience: "UNISEX",
    baseNames: ["Gorra deportiva", "Gorra plana", "Sombrero de ala"],
    priceRange: [15000, 39000],
  },
  {
    slug: "accesorios-bolsos",
    name: "Bolsos y morrales",
    description: "Morrales, bolsos tote y riñoneras.",
    parentSlug: "accesorios",
    audience: "UNISEX",
    baseNames: ["Morral casual", "Bolso tote", "Riñonera"],
    priceRange: [29000, 79000],
  },
  {
    slug: "accesorios-medias",
    name: "Medias",
    description: "Medias deportivas, largas y tobilleras.",
    parentSlug: "accesorios",
    audience: "UNISEX",
    baseNames: ["Medias deportivas", "Medias largas", "Medias tobilleras"],
    priceRange: [12000, 25000],
  },
];

export type SyntheticProductInput = {
  sku: string;
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  audience: Audience;
  sizes: string[];
  colors: string[];
  material: string;
  status: "DISPONIBLE" | "BAJO_PEDIDO" | "AGOTADO" | "OCULTO";
  tags: ProductTagType[];
  priceRef: number;
  campaignSlug: string | null;
  images: { url: string; alt: string; order: number }[];
};

function toSlugPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Genera ~`countPerCategory` referencias sintéticas por cada subcategoría con `baseNames`. */
export function generateSyntheticProducts(options: {
  countPerCategory: number;
  activeCampaignSlug: string | null;
  campaignCategorySlugs: string[];
}): SyntheticProductInput[] {
  const rng = createRng(20260101);
  const products: SyntheticProductInput[] = [];
  let counter = 0;

  for (const category of SYNTHETIC_CATEGORIES) {
    if (category.baseNames.length === 0) continue;

    for (let i = 0; i < options.countPerCategory; i++) {
      counter += 1;
      const base = category.baseNames[i % category.baseNames.length];
      const material = pick(rng, MATERIALS);
      const descriptor = pick(rng, DESCRIPTORS);
      const name = `${base} ${descriptor}`;
      const sku = `MPM-${toSlugPart(category.slug).toUpperCase()}-${String(counter).padStart(4, "0")}`;
      const slug = `${toSlugPart(base)}-${toSlugPart(category.slug)}-${counter}`;
      const sizes = [...pick(rng, SIZE_SETS)];
      const colors = pickMany(rng, COLOR_SETS.flat(), Math.min(3, COLOR_SETS.flat().length));
      const status = pick(rng, STATUS_WEIGHTS);
      const tagCount = Math.floor(rng() * 2);
      const tags = pickMany(rng, TAG_POOL, tagCount);
      const [min, max] = category.priceRange;
      const priceRef = Math.round((min + rng() * (max - min)) / 1000) * 1000;
      const inCampaign =
        options.activeCampaignSlug &&
        options.campaignCategorySlugs.includes(category.slug) &&
        rng() < 0.3;

      products.push({
        sku,
        name,
        slug,
        description: `${name}. Fabricado en ${material.toLowerCase()}. Disponible en las tallas y colores publicados; consulta con un asesor por variaciones adicionales.`,
        categorySlug: category.slug,
        audience: category.audience,
        sizes,
        colors,
        material,
        status,
        tags,
        priceRef,
        campaignSlug: inCampaign ? options.activeCampaignSlug : null,
        images: [0, 1].map((order) => ({
          url: `https://picsum.photos/seed/${slug}-${order}/900/1125`,
          alt: `${name} · foto ${order + 1}`,
          order,
        })),
      });
    }
  }

  return products;
}
