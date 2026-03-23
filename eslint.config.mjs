import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  // Next.js core web vitals (incluye React, React Hooks, Next.js rules)
  ...nextVitals,

  // TypeScript support
  ...nextTypescript,

  // Global ignores
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'node_modules/**',
    'next-env.d.ts',
  ]),

  // Custom overrides (si las hay)
  {
    rules: {
      // Agregar ajustes específicos del proyecto aquí si es necesario
    },
  },
]);

export default eslintConfig;
