import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "To-dos (Mann)",
    short_name: "To-dos Mann",
    start_url: "/mann",
    display: "standalone",
    background_color: "#0b1220",
    theme_color: "#0b1220",
    icons: [
      { src: "/icons/mann/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/mann/icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  };
}
