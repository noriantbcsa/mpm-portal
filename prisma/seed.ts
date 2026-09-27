/**
 * Siembra del catálogo entregado por MPM y de los usuarios de prueba.
 *
 * Solo publica las 18 referencias presentes en `public/catalogo/`. Antes de
 * importarlas elimina los artículos, categorías y campañas sintéticas que
 * existieron en versiones anteriores del portal.
 */
import "dotenv/config";
import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/passwords";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL no está definida. Configura .env antes de ejecutar db:seed.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const catalogRoot = join(process.cwd(), "public", "catalogo");
const fallbackHeroImage = "/catalogo/DAMAS%20-%20PAGINA/CMLD/CHOCOLATE.webp";
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
    imageUrl: "/catalogo/CABALLERO%20-%20PAGINA/CMCH/CHOCOLATE.webp",
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
  if (!siteSettings.heroImageUrl || (/^\/catalogo\//.test(siteSettings.heroImageUrl) && !/\.webp(?:$|\?)/i.test(siteSettings.heroImageUrl))) {
    await prisma.siteSettings.update({ where: { id: "default" }, data: { heroImageUrl: fallbackHeroImage } });
  }

  let imported = 0;
  for (const collection of collections) {
    const category = referenceCategories.find((item) => item.slug === collection.referenceSlug);
    if (!category) continue;
    let categoryImageSet = Boolean(category.imageUrl && /\.webp(?:$|\?)/i.test(category.imageUrl));
    const collectionDir = join(catalogRoot, collection.folder);
    const folders = readdirSync(collectionDir, { withFileTypes: true }).filter((item) => item.isDirectory());
    for (const folder of folders) {
      const productDir = join(collectionDir, folder.name);
      const files = readdirSync(productDir, { withFileTypes: true }).filter((item) => item.isFile() && /\.webp$/i.test(item.name)).map((item) => item.name).sort((a, b) => a.localeCompare(b, "es"));
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

const DEMO_CATEGORY_SLUGS = [
  "damas-camisetas-blusas", "damas-vestidos", "damas-pantalones", "damas-deportiva",
  "caballero-camisetas", "caballero-camisas", "caballero-pantalones", "caballero-deportiva",
  "ninos", "ninos-nino", "ninos-nina", "ninos-bebe",
  "dotacion", "dotacion-camisetas", "dotacion-uniformes",
  "accesorios", "accesorios-gorras", "accesorios-bolsos", "accesorios-medias",
] as const;

const DEMO_CAMPAIGN_SLUGS = [
  "carnaval-de-barranquilla",
  "regreso-a-clases",
  "liquidacion-fin-de-temporada",
] as const;

async function removeDemoCatalogContent() {
  const products = await prisma.product.deleteMany({
    where: { category: { slug: { in: [...DEMO_CATEGORY_SLUGS] } } },
  });
  const campaigns = await prisma.campaign.deleteMany({ where: { slug: { in: [...DEMO_CAMPAIGN_SLUGS] } } });
  const categories = await prisma.category.deleteMany({ where: { slug: { in: [...DEMO_CATEGORY_SLUGS] } } });
  console.log(`Contenido de demostración retirado: ${products.count} productos, ${categories.count} categorías y ${campaigns.count} campañas.`);
}

async function main() {
  await removeDemoCatalogContent();
  await importRealCatalog();
  await seedUsers();

  const total = await prisma.product.count();
  console.log(`Catálogo real listo: ${total} referencias.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
