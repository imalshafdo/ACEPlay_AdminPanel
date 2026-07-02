export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      apiUrl:
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:5000',
    },
  },

  css: ['~/assets/css/main.css'],
})