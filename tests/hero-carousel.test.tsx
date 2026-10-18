import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HeroCarousel, type HeroSlide } from "@/components/home/hero-carousel";

const slide = (id: string): HeroSlide => ({
  id,
  kicker: "k",
  title: `Título ${id}`,
  text: "t",
  ctaLabel: "Ver",
  ctaHref: "/catalogo",
  photos: [{ url: "/catalogo/x.webp", alt: "x", href: "/producto/x" }],
});

describe("HeroCarousel", () => {
  it("la portada tiene exactamente un h1 (la primera diapositiva)", () => {
    const html = renderToStaticMarkup(<HeroCarousel slides={[slide("a"), slide("b"), slide("c")]} />);
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    expect(html.match(/<h2[ >]/g)).toHaveLength(2);
    expect(html.indexOf("<h1")).toBeLessThan(html.indexOf("<h2"));
  });
});
