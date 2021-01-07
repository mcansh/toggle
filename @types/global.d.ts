/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly REDIS_URL: string;
  }
}
