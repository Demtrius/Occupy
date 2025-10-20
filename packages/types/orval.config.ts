export default {
  clique: {
    input: process.env.OPENAPI_URL ?? "http://localhost:8000/openapi.json",
    output: {
      target: "./src/client.ts",
      client: "fetch",
      baseUrl: process.env.API_BASE_URL ?? "http://localhost:8000",
      override: { mutator: { path: "./src/fetcher.ts", name: "customFetch" } }
    }
  }
}
