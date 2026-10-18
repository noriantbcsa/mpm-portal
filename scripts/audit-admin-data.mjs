/** Auditoría de solo lectura. No consulta contraseñas ni datos de clientes. */
import "dotenv/config";
import { Pool } from "pg";
import { existsSync } from "node:fs";
import { join } from "node:path";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
try {
  await pool.query("BEGIN READ ONLY");
  const categories = (await pool.query('SELECT id, name, "parentId", "isVisible" FROM "Category"')).rows;
  const products = (await pool.query('SELECT id, sku, name, "categoryId", "campaignId", colors, "priceRef", "priceWholesale", status FROM "Product"')).rows;
  const images = (await pool.query('SELECT "productId", url, alt, color FROM "ProductImage"')).rows;
  const campaigns = (await pool.query('SELECT id, name, "isActive", "startDate", "endDate" FROM "Campaign"')).rows;
  const problems = [];
  const byCategory = new Map(categories.map((c) => [c.id, c]));
  for (const category of categories) {
    const visited = new Set([category.id]);
    let parentId = category.parentId, depth = 1;
    while (parentId) {
      if (visited.has(parentId)) { problems.push({ type: "category_cycle", name: category.name }); break; }
      visited.add(parentId);
      const parent = byCategory.get(parentId);
      if (!parent) { problems.push({ type: "missing_parent", name: category.name }); break; }
      depth++; parentId = parent.parentId;
    }
    if (depth > 2) problems.push({ type: "category_depth", name: category.name, depth });
  }
  for (const product of products) {
    const photos = images.filter((i) => i.productId === product.id);
    if (!byCategory.has(product.categoryId)) problems.push({ type: "missing_category", sku: product.sku });
    if (product.campaignId && !campaigns.some((c) => c.id === product.campaignId)) problems.push({ type: "missing_campaign", sku: product.sku });
    if (product.status !== "OCULTO" && !product.priceRef) problems.push({ type: "missing_price", sku: product.sku });
    if (product.priceWholesale && (!product.priceRef || Number(product.priceWholesale) > Number(product.priceRef))) problems.push({ type: "invalid_wholesale", sku: product.sku });
    if (!photos.length && product.status !== "OCULTO") problems.push({ type: "missing_photos", sku: product.sku });
    for (const image of photos) {
      if (!image.alt.trim()) problems.push({ type: "missing_alt", sku: product.sku });
      if (image.color && !product.colors.includes(image.color)) problems.push({ type: "image_color_not_selectable", sku: product.sku, color: image.color });
      if (image.url.startsWith("/") && !existsSync(join(process.cwd(), "public", decodeURIComponent(image.url)))) problems.push({ type: "missing_file", sku: product.sku, url: image.url });
      if (!image.url.startsWith("/") && !image.url.startsWith("https://res.cloudinary.com/")) problems.push({ type: "unsupported_image_host", sku: product.sku });
    }
  }
  for (const campaign of campaigns) {
    if (campaign.startDate && campaign.endDate && campaign.startDate > campaign.endDate) problems.push({ type: "campaign_dates", name: campaign.name });
  }
  if (campaigns.filter((c) => c.isActive).length > 1) problems.push({ type: "multiple_active_campaigns" });
  const integrity = (await pool.query(`SELECT conname, convalidated FROM pg_constraint WHERE conrelid IN ('"Product"'::regclass, '"Category"'::regclass, '"Campaign"'::regclass, '"ProductImage"'::regclass)`)).rows;
  await pool.query("ROLLBACK");
  console.log(JSON.stringify({ counts: { categories: categories.length, products: products.length, images: images.length, campaigns: campaigns.length }, validatedConstraints: integrity.filter((c) => c.convalidated).length, problems }, null, 2));
} finally { await pool.end(); }
