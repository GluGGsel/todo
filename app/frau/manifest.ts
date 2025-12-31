import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "To-dos (Frau)",
    short_name: "To-dos Frau",
    start_url: "/frau",
    display: "standalone",
    background_color: "#1a0b12",
    theme_color: "#1a0b12",
    icons: [
      { src: "/icons/frau/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/frau/icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  };
}
