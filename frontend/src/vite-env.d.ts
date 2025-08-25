/// <reference types="vite/client" />

declare module '*.tsx' {
  import React from 'react';
  const component: React.ComponentType<any>;
  export default component;
}

declare module 'argon2-browser' {
  export interface Argon2Options {
    pass: string;
    salt: Uint8Array;
    time: number;
    mem: number;
    hashLen: number;
    parallelism: number;
    type: number;
  }

  export interface Argon2Result {
    hash: Uint8Array;
    encoded: string;
  }

  export function hash(options: Argon2Options): Promise<Argon2Result>;
}
