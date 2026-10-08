/**
 * Siembra del catálogo entregado por MPM y de los usuarios de prueba.
 *
 * Solo publica/actualiza las 18 referencias presentes en `public/catalogo/`
 * y crea las dos cuentas de prueba si todavía no existen — ambas
 * operaciones son upserts seguros de repetir. (La limpieza del catálogo
 * sintético de versiones anteriores del portal fue un paso de una sola vez;
 * vive en `scripts/remove-demo-content.ts`, no aquí, para que correr este
 * seed en cada despliegue no pueda borrar contenido real por coincidencia
 * de slug.)
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
  return ["XS", "S", "M", "L", "XL", "XXL"];
}

/** Categorías raíz "Damas" / "Caballero", sitio y las 18 referencias reales fotografiadas. */
async function importRealCatalog() {
  const categories = await Promise.all(collections.map((item, order) => prisma.category.upsert({
    where: { slug: item.slug },
    create: { name: item.category, slug: item.slug, description: `Colecciones de ${item.category}.`, imageUrl: item.imageUrl, order },
    // Repetir el seed no debe pisar lo que se editó en /admin/categorias
    // (visibilidad, nombre, orden, portada).
    update: {},
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
      update: {},
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
      address: "C.C. Visto, Local 3163, piso 3 · Bogotá Centro, Bogotá, Colombia",
      footerText: "MPM · Moda y estilo día a día. Atención al detal y al por mayor.",
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
      const description = [`Referencia ${folder.name}.`, colors.length ? `Colores registrados: ${colors.join(", ")}.` : `Galería con ${files.length} vistas registradas.`].join(" ");
      const images = files.map((file, order) => {
        const color = filenameColor(file);
        return { url: asPublicUrl(join(productDir, file)), alt: `${name}${color ? ` · color ${color}` : ` · vista ${order + 1}`}`, color, order };
      });
      await prisma.product.upsert({
        where: { sku },
        create: { sku, name, slug, description, categoryId: category.id, audience: collection.audience, sizes: sizesFor(folder.name), colors, tags, images: { create: images } },
        // Repetir el seed solo refresca las fotos entregadas: nombre,
        // descripción, categoría, tallas, etiquetas, etc. pueden haberse
        // editado desde /admin y no deben pisarse.
        update: { images: { deleteMany: {}, create: images } },
      });
      imported += 1;

      // La primera referencia con foto de la colección presta su primera
      // imagen como portada de la categoría (Damas/Caballero), para que
      // "Compra por categoría" en el inicio no se vea vacío. Si un admin ya
      // puso una portada distinta desde /admin/categorias, no se toca.
      if (!categoryImageSet && images[0] && (!category.imageUrl || category.imageUrl.startsWith("/catalogo/"))) {
        await prisma.category.update({ where: { id: category.id }, data: { imageUrl: images[0].url } });
        categoryImageSet = true;
      }
    }
  }
  console.log(`Catálogo real importado: ${imported} referencias con fotos de public/catalogo.`);
}

/**
 * Se considera "producción" cualquier base que no sea local, aunque el seed se
 * corra desde un portátil apuntando a la URL de Render.
 */
function isLocalDatabase() {
  const databaseHost = (() => {
    try {
      return new URL(process.env.DATABASE_URL ?? "").hostname;
    } catch {
      return "";
    }
  })();
  return ["localhost", "127.0.0.1", "::1", "[::1]", "db"].includes(databaseHost);
}

async function seedUsers() {
  // La contraseña de demostración es pública (README). Contra una base de
  // producción no se crean cuentas con ella: hay que pasar una propia en
  // SEED_ADMIN_PASSWORD (o crear las cuentas desde /admin/usuarios).
  const isProduction = process.env.NODE_ENV === "production" || !isLocalDatabase();
  const password = process.env.SEED_ADMIN_PASSWORD || (isProduction ? null : "CambiaEsto123!");
  if (!password) {
    console.warn(
      "Base de datos no local sin SEED_ADMIN_PASSWORD: no se crean cuentas de demostración. " +
        "Define SEED_ADMIN_PASSWORD (mínimo 10 caracteres) para crear el administrador inicial.",
    );
    return;
  }
  if (password.length < 10) throw new Error("SEED_ADMIN_PASSWORD debe tener al menos 10 caracteres.");

  const users = [
    { name: "Administrador MPM", email: "admin@mpm.local", role: "ADMIN" as const, password },
    // La cuenta de ventas de prueba solo tiene sentido fuera de producción.
    ...(isProduction
      ? []
      : [{ name: "Asesora de ventas", email: "ventas@mpm.local", role: "SALES" as const, password }]),
  ];
  for (const user of users) {
    const passwordHash = await hashPassword(user.password);
    await prisma.user.upsert({
      where: { email: user.email },
      create: { name: user.name, email: user.email, role: user.role, passwordHash },
      update: {},
    });
  }
  console.log(
    isProduction
      ? "Administrador inicial listo con la contraseña de SEED_ADMIN_PASSWORD."
      : "Usuarios de demostración listos (ver README.md para credenciales).",
  );
}

async function main() {
  // Contra una base NO local que ya tiene productos, importar el catálogo
  // reemplaza las fotos de las 18 referencias (incluidas las que se hayan
  // subido desde /admin): solo con confirmación explícita.
  const existingProducts = await prisma.product.count();
  if (isLocalDatabase() || existingProducts === 0 || process.env.SEED_REFRESH_CATALOG === "1") {
    await importRealCatalog();
  } else {
    console.warn(
      `Catálogo NO importado: la base no es local y ya tiene ${existingProducts} productos. ` +
        "Para reemplazar las fotos de las 18 referencias entregadas, vuelve a correr con SEED_REFRESH_CATALOG=1.",
    );
  }
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
