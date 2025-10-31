// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  ssr: true,
  srcDir: "app/",
  css: ["@/styles/main.css"],
  runtimeConfig: {
    public: {},
  },
  postcss: {
    plugins: {
      autoprefixer: {},
      "postcss-nested": {},
    },
  },
  vite: {
    optimizeDeps: {
      include: ["three"],
    },
  },
});
