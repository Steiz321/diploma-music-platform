/** Where the services are; the defaults match docker compose on this machine. */
export const config = {
  coreUrl: process.env.CORE_URL ?? 'http://localhost:3000',
  analyticsUrl: process.env.ANALYTICS_URL ?? 'http://localhost:3002',
  recommendationsUrl:
    process.env.RECOMMENDATIONS_URL ?? 'http://localhost:3003',
  /** fixed seed: the same catalogue, users and behaviour on every run */
  seed: Number(process.env.SEED ?? 2026),
};
