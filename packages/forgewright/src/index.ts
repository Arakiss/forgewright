/**
 * Forgewright - AI-first release system for LLM-assisted development
 *
 * @example
 * ```ts
 * import { defineConfig } from 'forgewright';
 *
 * export default defineConfig({
 *   ai: { provider: 'anthropic' },
 *   mode: 'confirm',
 * });
 * ```
 */

// Re-export everything from sub-packages
export * from "@forgewright/core";
export * from "@forgewright/ai";
