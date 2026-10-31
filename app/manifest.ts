import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "allinlove",
    short_name: "allinlove",
    description: "İkinizin ortak yeri",
    start_url: "/",
    display: "standalone",
    background_color: "#fff7f8",
    theme_color: "#c45c6a",
    lang: "tr",
    icons: [
      { src: "/icon", sizes: "192x192", type: "image/png" },
    ],
  };
}
