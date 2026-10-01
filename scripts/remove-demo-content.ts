/**
 * Limpieza de UNA SOLA VEZ del catálogo sintético de versiones anteriores
 * del portal (productos/categorías de demostración, más tres campañas de
 * ejemplo). Corre esto a mano, nunca como parte del build/deploy: antes
 * vivía dentro de `db:seed`, que Render ejecutaba en cada despliegue —
 * eso significaba que cualquier campaña real que un admin creara más
 * adelante usando por coincidencia uno de estos mismos slugs (p. ej.
 * "carnaval-de-barranquilla" para la promoción real de este año) se
 * borraba sin aviso en el siguiente deploy, sin nada que la recreara.
 *
 * Uso (una vez, si hace falta limpiar un entorno que todavía tiene este
 * contenido de demostración):
 *   npx tsx scripts/remove-demo-content.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL no está definida. Configura .env antes de ejecutar este script.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

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

async function main() {
  const products = await prisma.product.deleteMany({
    where: { category: { slug: { in: [...DEMO_CATEGORY_SLUGS] } } },
  });
  const campaigns = await prisma.campaign.deleteMany({ where: { slug: { in: [...DEMO_CAMPAIGN_SLUGS] } } });
  const categories = await prisma.category.deleteMany({ where: { slug: { in: [...DEMO_CATEGORY_SLUGS] } } });
  console.log(`Contenido de demostración retirado: ${products.count} productos, ${categories.count} categorías y ${campaigns.count} campañas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
