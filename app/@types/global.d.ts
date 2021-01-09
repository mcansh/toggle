/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly DATABASE_URL: string;
    readonly REDIS_HOST: string;
    readonly REDIS_PORT: string;
    readonly REDIS_PASSWORD: string;
    readonly REMIX_REGISTRY_TOKEN: string;
    readonly SESSION_PASSWORD: string;
    readonly POSTMARK_API_KEY: string;
  }
}
