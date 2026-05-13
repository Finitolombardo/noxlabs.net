// APP-X-BRIDGE-02 — Minimal ambient declarations for the api/ runtime.
// Avoids pulling @types/node as a hard dependency. Declares only the
// Node globals we actually touch server-side.

declare const process: {
  readonly env: { readonly [key: string]: string | undefined };
};
