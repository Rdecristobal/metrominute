# Tarea para FullStack: Migrar ESLint a Flat Config Nativo

**Proyecto:** metrominute  
**Prioridad:** Alta (bloquea linting)  
**Tiempo estimado:** 15 minutos  
**Documentación completa:** `docs/adr-001-eslint-flat-config-migration.md`

---

## Resumen del Problema

ESLint falla con error de configuración circular. `FlatCompat` no puede convertir las configs legacy de Next.js porque tienen referencias circulares en el plugin de React.

**Solución:** Eliminar `FlatCompat` y usar flat config nativo de Next.js 16.

---

## Pasos de Implementación

### 1. Eliminar dependencia obsoleta
```bash
cd /home/claw1/.openclaw/workspace-dyzink/metrominute
npm uninstall @eslint/eslintrc
```

### 2. Reemplazar `eslint.config.mjs`

**Ubicación:** `/home/claw1/.openclaw/workspace-dyzink/metrominute/eslint.config.mjs`

**Código nuevo:**
```javascript
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
```

### 3. Actualizar script de lint en `package.json`

**Archivo:** `/home/claw1/.openclaw/workspace-dyzink/metrominute/package.json`

**Cambiar:**
```json
"lint": "eslint . --ext .ts,.tsx,.js,.jsx"
```

**A:**
```json
"lint": "eslint ."
```

### 4. Probar
```bash
npm run lint
```

**Resultado esperado:** Linting ejecuta sin errores de configuración.

---

## Si Algo Falla

### Error: "Cannot find module 'eslint/config'"
**Solución:** ESLint 9.39.4 ya incluye este módulo. Verifica que no haya cache de node_modules:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: "Cannot find module 'eslint-config-next/core-web-vitals'"
**Solución:** Verifica que `eslint-config-next` esté instalado:
```bash
npm list eslint-config-next
```
Si no está, instálalo: `npm install --save-dev eslint-config-next@16.2.1`

### Warnings nuevos de reglas
**Solución:** Agrega las reglas a la sección `rules` en el config:
```javascript
rules: {
  'rule-name': 'off', // o 'warn'
}
```

---

## Checklist de Validación

Después de implementar, verifica:

- [ ] `npm run lint` ejecuta sin errores
- [ ] No hay errores de sintaxis en `eslint.config.mjs`
- [ ] Los warnings de linting son esperados (no nuevos)
- [ ] `npm run build` sigue funcionando (no afectado por lint config)

---

## Notas Importantes

1. **NO uses FlatCompat** - Importa directamente desde `eslint-config-next`
2. **El flag `--ext` ya no es necesario** - Flat config detecta extensiones automáticamente
3. **Documenta cambios de reglas** - Si agregas overrides, comenta por qué

---

## Contacto

Si hay dudas sobre el diseño o la decisión, revisar `docs/adr-001-eslint-flat-config-migration.md` o consultar con Arquitecto.

**Éxito:** Linting funcional, configuración alineada con ESLint 9+ y Next.js 16.
