import type { MetadataRoute } from "next";

// Manifiesto PWA: permite "agregar a la pantalla de inicio" en el celular.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RutaFHIR — aprende FHIR paso a paso",
    short_name: "RutaFHIR",
    description:
      "Plataforma de aprendizaje adaptativo de HL7 FHIR: lecturas, quizzes, tutor con IA y repaso espaciado.",
    start_url: "/panel",
    display: "standalone",
    background_color: "#f5f7fa",
    theme_color: "#0e2e6e",
    lang: "es",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
