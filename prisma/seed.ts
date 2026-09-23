/**
 * Siembra de datos de desarrollo/demostración.
 *
 * `importRealCatalog()` conserva las 18 referencias reales (con fotos de
 * `public/catalogo/`, ver docs/CATALOG_ASSETS.md) tal como las dejó el
 * importador original. El resto de este archivo agrega lo que la app
 * necesita para funcionar de punta a punta: usuarios (para entrar a
 * /admin), categorías y subcategorías adicionales, campañas de ejemplo, y
 * ~288 referencias sintéticas (fotos de stock) para poder probar filtros,
 * paginación, carga masiva y el panel administrativo a la escala de "+300
 * referencias" que pide el proyecto. Todo lo sintético queda documentado
 * como tal y se reemplaza con el catálogo real vía carga CSV o el panel.
 */
import "dotenv/config";
import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/passwords";
import { generateSyntheticProducts, SYNTHETIC_CATEGORIES } from "./seed-helpers";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL no está definida. Configura .env antes de ejecutar db:seed.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const catalogRoot = join(process.cwd(), "public", "catalogo");
const fallbackHeroImage = "/catalogo/DAMAS%20-%20PAGINA/CMLD/CHOCOLATE.jpg";
const collections = [
  {
    folder: "DAMAS - PAGINA",
    category: "Damas",
    slug: "damas",
    referenceSlug: "damas-referencias",
    referenceName: "Referencias Damas",
    imageUrl: fallbackHeroImage,
    audience: "MUJER" as const,
    prefix: "DAM",
  },
  {
    folder: "CABALLERO - PAGINA",
    category: "Caballero",
    slug: "caballero",
    referenceSlug: "caballero-referencias",
    referenceName: "Referencias Caballero",
    // La foto de CMCRH original tiene fondo casi blanco: con la superposición
    // semitransparente de CatalogExplorer se veía prácticamente en blanco.
    // Esta tiene una prenda de color sólido, con mejor contraste.
    imageUrl: "/catalogo/CABALLERO%20-%20PAGINA/CMCH/CHOCOLATE.jpg",
    audience: "HOMBRE" as const,
    prefix: "CAB",
  },
];

function asPublicUrl(filePath: string) {
  return `/${relative(join(process.cwd(), "public"), filePath).split(sep).map(encodeURIComponent).join("/")}`;
}

function filenameColor(filename: string) {
  const name = filename.replace(/\.[^.]+$/, "").replace(/\s*\(\d+\)$/, "").trim();
  return /^(whatsapp image|photo_|[0-9]+$|[0-9a-f]{8}-)/i.test(name)
    ? null
    : name.replace(/\./g, " ").replace(/\s+/g, " ");
}

function referenceName(folder: string) {
  const names: Record<string, string> = {
    "SHORT DOBLE CORREA": "Short doble correa",
    "CCP (camison cola de pato)": "Camisón cola de pato",
    "CMLR (NUEVO LANZAMIENTO) DAMAS": "CMLR · nuevo lanzamiento",
    "PLUS DAMA": "Plus dama",
  };
  return names[folder] ?? `Referencia ${folder}`;
}

function sizesFor(folder: string) {
  if (/^(R-UNICA|UNICA)$/i.test(folder)) return ["Talla única"];
  if (/XXL/i.test(folder)) return ["XXL"];
  return ["Consultar disponibilidad"];
}

/** Categorías raíz "Damas" / "Caballero", sitio y las 18 referencias reales fotografiadas. */
async function importRealCatalog() {
  const categories = await Promise.all(collections.map((item, order) => prisma.category.upsert({
    where: { slug: item.slug },
    create: { name: item.category, slug: item.slug, description: `Colecciones de ${item.category}.`, imageUrl: item.imageUrl, order },
    update: { name: item.category, description: `Colecciones de ${item.category}.`, imageUrl: item.imageUrl, order, isVisible: true },
  })));
  const referenceCategories = await Promise.all(collections.map(async (item) => {
    const parent = categories.find((category) => category.slug === item.slug);
    if (!parent) throw new Error(`No se pudo crear la categoría ${item.category}.`);
    return prisma.category.upsert({
      where: { slug: item.referenceSlug },
      create: {
        name: item.referenceName,
        slug: item.referenceSlug,
        description: `Modelos reales de ${item.category} con galería de fotos y especificaciones.`,
        parentId: parent.id,
        order: 0,
      },
      update: {
        name: item.referenceName,
        description: `Modelos reales de ${item.category} con galería de fotos y especificaciones.`,
        parentId: parent.id,
        order: 0,
        isVisible: true,
      },
    });
  }));
  const siteSettings = await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      siteName: "MPM",
      primaryColor: "#101417",
      secondaryColor: "#c8ff00",
      accentColor: "#eef2e5",
      heroImageUrl: fallbackHeroImage,
      whatsappNumber: "573000000000",
      whatsappDefaultMessage: "Hola MPM, quiero más información sobre sus prendas.",
      contactEmail: "ventas@mpm-ejemplo.com",
      address: "Barranquilla, Colombia",
      footerText: "MPM Fábrica de ropa. Atención comercial personalizada.",
      dataPolicyText:
        "Texto provisional de política de tratamiento de datos personales. Debe ser revisado y aprobado por MPM antes de producción; ver docs/DEPLOYMENT.md.",
      showPrices: false,
    },
    update: {},
  });
  if (!siteSettings.heroImageUrl) {
    await prisma.siteSettings.update({ where: { id: "default" }, data: { heroImageUrl: fallbackHeroImage } });
  }

  let imported = 0;
  for (const collection of collections) {
    const category = referenceCategories.find((item) => item.slug === collection.referenceSlug);
    if (!category) continue;
    let categoryImageSet = Boolean(category.imageUrl);
    const collectionDir = join(catalogRoot, collection.folder);
    const folders = readdirSync(collectionDir, { withFileTypes: true }).filter((item) => item.isDirectory());
    for (const folder of folders) {
      const productDir = join(collectionDir, folder.name);
      const files = readdirSync(productDir, { withFileTypes: true }).filter((item) => item.isFile() && /\.(jpe?g|png|webp)$/i.test(item.name)).map((item) => item.name).sort((a, b) => a.localeCompare(b, "es"));
      if (!files.length) continue;
      const colors = [...new Set(files.map(filenameColor).filter((value): value is string => Boolean(value)))];
      const name = referenceName(folder.name);
      const sku = `${collection.prefix}-${folder.name.replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "").toUpperCase()}`;
      const slug = `${collection.slug}-${folder.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
      const tags = /NUEVO LANZAMIENTO/i.test(folder.name) ? ["NUEVO" as const] : [];
      const description = [`Referencia ${folder.name}.`, colors.length ? `Colores registrados: ${colors.join(", ")}.` : `Galería con ${files.length} vistas registradas.`, "Consulta disponibilidad de talla y color con un asesor MPM."].join(" ");
      const images = files.map((file, order) => {
        const color = filenameColor(file);
        return { url: asPublicUrl(join(productDir, file)), alt: `${name}${color ? ` · color ${color}` : ` · vista ${order + 1}`}`, color, order };
      });
      await prisma.product.upsert({
        where: { sku },
        create: { sku, name, slug, description, categoryId: category.id, audience: collection.audience, sizes: sizesFor(folder.name), colors: colors.length ? colors : ["Consultar disponibilidad"], tags, images: { create: images } },
        update: { name, slug, description, categoryId: category.id, audience: collection.audience, sizes: sizesFor(folder.name), colors: colors.length ? colors : ["Consultar disponibilidad"], tags, images: { deleteMany: {}, create: images } },
      });
      imported += 1;

      // La primera referencia con foto de la colección presta su primera
      // imagen como portada de la categoría (Damas/Caballero), para que
      // "Compra por categoría" en el inicio no se vea vacío. Si un admin ya
      // puso una portada distinta desde /admin/categorias, no se toca.
      if (!categoryImageSet && images[0]) {
        await prisma.category.update({ where: { id: category.id }, data: { imageUrl: images[0].url } });
        categoryImageSet = true;
      }
    }
  }
  console.log(`Catálogo real importado: ${imported} referencias con fotos de public/catalogo.`);
}

async function seedUsers() {
  const users = [
    { name: "Administrador MPM", email: "admin@mpm.local", role: "ADMIN" as const, password: "CambiaEsto123!" },
    { name: "Asesora de ventas", email: "ventas@mpm.local", role: "SALES" as const, password: "CambiaEsto123!" },
  ];
  for (const user of users) {
    const passwordHash = await hashPassword(user.password);
    await prisma.user.upsert({
      where: { email: user.email },
      create: { name: user.name, email: user.email, role: user.role, passwordHash },
      update: {},
    });
  }
  console.log("Usuarios de demostración listos (ver README.md para credenciales).");
}

async function seedCategoryTree() {
  const bySlug = new Map<string, string>();

  // Primero los nodos raíz nuevos (Niños, Dotación, Accesorios), luego el resto.
  const roots = SYNTHETIC_CATEGORIES.filter((c) => c.parentSlug === null);
  for (const [order, root] of roots.entries()) {
    const category = await prisma.category.upsert({
      where: { slug: root.slug },
      create: {
        name: root.name,
        slug: root.slug,
        description: root.description,
        imageUrl: root.imageUrl,
        order: 10 + order,
      },
      update: { name: root.name, description: root.description },
    });
    bySlug.set(root.slug, category.id);
  }

  // Aseguramos que "damas" y "caballero" (creadas por importRealCatalog) están mapeadas.
  for (const slug of ["damas", "caballero"]) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) bySlug.set(slug, existing.id);
  }

  const children = SYNTHETIC_CATEGORIES.filter((c) => c.parentSlug !== null);
  for (const [order, child] of children.entries()) {
    const parentId = child.parentSlug ? bySlug.get(child.parentSlug) : undefined;
    const category = await prisma.category.upsert({
      where: { slug: child.slug },
      create: {
        name: child.name,
        slug: child.slug,
        description: child.description,
        parentId,
        order,
      },
      update: { name: child.name, description: child.description, parentId },
    });
    bySlug.set(child.slug, category.id);
  }

  return bySlug;
}

const CAMPAIGN_SEEDS = [
  {
    slug: "carnaval-de-barranquilla",
    name: "Carnaval de Barranquilla",
    description: "Colores, estampados y prendas frescas para la temporada de Carnaval.",
    colorPrimary: "#E4572E",
    colorSecondary: "#F3A712",
    isActive: true,
    priorityCategorySlugs: ["damas-vestidos", "damas-camisetas-blusas", "accesorios-gorras"],
  },
  {
    slug: "regreso-a-clases",
    name: "Regreso a clases",
    description: "Uniformes y ropa resistente para niños y niñas.",
    colorPrimary: "#1F4D3D",
    colorSecondary: "#D9A441",
    isActive: false,
    priorityCategorySlugs: ["ninos-nino", "ninos-nina"],
  },
  {
    slug: "liquidacion-fin-de-temporada",
    name: "Liquidación fin de temporada",
    description: "Precios especiales en referencias seleccionadas.",
    colorPrimary: "#8A1C1C",
    colorSecondary: "#F4EFE7",
    isActive: false,
    priorityCategorySlugs: ["caballero-camisetas", "damas-pantalones"],
  },
] as const;

async function seedCampaigns() {
  const activeSlug = CAMPAIGN_SEEDS.find((c) => c.isActive)?.slug ?? null;
  for (const campaign of CAMPAIGN_SEEDS) {
    await prisma.campaign.upsert({
      where: { slug: campaign.slug },
      create: {
        name: campaign.name,
        slug: campaign.slug,
        description: campaign.description,
        colorPrimary: campaign.colorPrimary,
        colorSecondary: campaign.colorSecondary,
        isActive: campaign.isActive,
        startDate: campaign.isActive ? new Date() : null,
        priorityCategories: {
          connect: campaign.priorityCategorySlugs.map((slug) => ({ slug })),
        },
      },
      update: {
        priorityCategories: {
          connect: campaign.priorityCategorySlugs.map((slug) => ({ slug })),
        },
      },
    });
  }
  return activeSlug;
}

async function seedSyntheticProducts(activeCampaignSlug: string | null) {
  const campaignCategorySlugs =
    CAMPAIGN_SEEDS.find((c) => c.slug === activeCampaignSlug)?.priorityCategorySlugs ?? [];

  const products = generateSyntheticProducts({
    countPerCategory: 18,
    activeCampaignSlug,
    campaignCategorySlugs: [...campaignCategorySlugs],
  });

  const categorySlugs = [...new Set(products.map((p) => p.categorySlug))];
  const categories = await prisma.category.findMany({ where: { slug: { in: categorySlugs } } });
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const campaignSlugs = [...new Set(products.map((p) => p.campaignSlug).filter((s): s is string => !!s))];
  const campaigns = await prisma.campaign.findMany({ where: { slug: { in: campaignSlugs } } });
  const campaignIdBySlug = new Map(campaigns.map((c) => [c.slug, c.id]));

  let created = 0;
  for (const product of products) {
    const categoryId = categoryIdBySlug.get(product.categorySlug);
    if (!categoryId) continue;
    const campaignId = product.campaignSlug ? campaignIdBySlug.get(product.campaignSlug) : undefined;

    await prisma.product.upsert({
      where: { sku: product.sku },
      create: {
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryId,
        audience: product.audience,
        sizes: product.sizes,
        colors: product.colors,
        material: product.material,
        status: product.status,
        tags: product.tags,
        priceRef: product.priceRef,
        campaignId,
        images: { create: product.images },
      },
      update: {}, // no sobreescribimos si ya se editó desde el panel
    });
    created += 1;
  }
  console.log(`Catálogo sintético listo: ${created} referencias de demostración (fotos de stock).`);
}

async function main() {
  await importRealCatalog();
  await seedUsers();
  await seedCategoryTree();
  const activeCampaignSlug = await seedCampaigns();
  await seedSyntheticProducts(activeCampaignSlug);

  const total = await prisma.product.count();
  console.log(`Total de referencias en el catálogo: ${total}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
