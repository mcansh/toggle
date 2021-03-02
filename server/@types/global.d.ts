/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly DATABASE_URL: string;
    readonly FRONTEND_URL: string;
    readonly POSTMARK_API_KEY: string;
    readonly REMIX_REGISTRY_TOKEN: string;
    readonly REDIS_URL: string;
    readonly SENTRY_DSN: string;
    readonly SESSION_PASSWORD: string;
  }
}
