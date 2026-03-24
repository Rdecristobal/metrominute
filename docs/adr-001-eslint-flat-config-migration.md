# ADR-001: Migración a ESLint Flat Config Nativo

**Estado:** Propuesto  
**Fecha:** 2026-03-23  
**Contexto:** metrominute  
**Decisor:** Arquitecto → FullStack (implementación)

---

## Contexto

El proyecto metrominute experimenta el siguiente error al ejecutar `npm run lint`:

```
TypeError: Converting circular structure to JSON
    --> starting at object with constructor 'Object'
    |     property 'configs' -> object with constructor 'Object'
    |     property 'flat' -> object with constructor 'Object'
    |     ...
    |     property 'plugins' -> object with constructor 'Object'
    --- property 'react' closes the circle
```

**Stack actual:**
- ESLint: 9.39.4 (flat config por defecto)
- Next.js: 16.2.1
- React: 19.0.0
- @eslint/eslintrc: 3.3.5

**Configuración actual (`eslint.config.mjs`):**
```javascript
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: __dirname });
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
```

---

## Problema

`FlatCompat` está intentando convertir configuraciones legacy de Next.js que contienen referencias circulares en el plugin de React. Cuando `ConfigValidator` intenta validar el schema usando `JSON.stringify()`, falla porque no puede serializar estructuras circulares.

**Causa raíz:**  
Incompatibilidad entre:
1. ESLint 9 (que espera flat config nativo)
2. `FlatCompat` (que intenta convertir configs legacy)
3. Plugins de React que tienen estructuras circulares en sus definiciones

---

## Opciones Consideradas

### Opción 1: Downgrade a ESLint 8.x

**Pros:**
- Configuración legacy funcionaría
- Estabilidad probada

**Contras:**
- ESLint 8 está deprecated (ESLint 10 elimina soporte legacy en 2026)
- Aplaca el problema en lugar de resolverlo
- Mayor deuda técnica

**Decisión:** ❌ RECHAZADA - No es sostenible a largo plazo

---

### Opción 2: Migración a Flat Config Nativo

**Pros:**
- Alineado con el estándar de ESLint 9+
- Next.js 16 ya soporta flat config nativo
- Elimina `@eslint/eslintrc` y `FlatCompat`
- Más explícito y mantenible
- Futuro-proof

**Contras:**
- Requiere cambios en configuración
- Posible ajuste de reglas específicas

**Decisión:** ✅ APROBADA - Solución recomendada

---

### Opción 3: Configuración Híbrida con Workarounds

**Pros:**
- Menos cambios inmediatos

**Contras:**
- Más compleja
- No resuelve el problema de fondo
- Workarounds son frágiles

**Decisión:** ❌ RECHAZADA - Complejidad innecesaria

---

## Decisión

**Migrar a ESLint Flat Config nativo**, eliminando `FlatCompat` e importando directamente las configuraciones de Next.js.

### Justificación

1. **Estándar de facto:** ESLint 9+ solo soporta flat config. ESLint 10 elimina legacy.
2. **Soporte nativo:** Next.js 16+ exporta configs en formato flat listas para usar.
3. **Simplicidad:** Elimina la capa de compatibilidad (`FlatCompat`) que está causando el problema.
4. **Mantenibilidad:** Configuración explícita es más fácil de debuggear y extender.

---

## Diseño Técnico

### Archivo: `eslint.config.mjs` (nuevo)

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
      // Ejemplo: ajustar reglas específicas del proyecto
      // '@next/next/no-html-link-for-pages': 'warn',
    },
  },
]);

export default eslintConfig;
```

---

### Dependencias a Actualizar/Eliminar

**Eliminar:**
- `@eslint/eslintrc` ❌ (ya no se necesita FlatCompat)

**Mantener:**
- `eslint` 9.39.4 ✅
- `eslint-config-next` 16.2.1 ✅

**Agregar (si es necesario):**
- `globals` (para definir globals explícitamente si se necesita)
- `@eslint/js` (para reglas base de ESLint, si se necesitan adicionales)

---

### Script en `package.json`

**Antes:**
```json
"lint": "eslint . --ext .ts,.tsx,.js,.jsx"
```

**Después:**
```json
"lint": "eslint ."
```

**Nota:** El flag `--ext` ya no es necesario en flat config. Los file extensions se detectan automáticamente.

---

## Plan de Implementación (para FullStack)

### Paso 1: Eliminar dependencia obsoleta
```bash
npm uninstall @eslint/eslintrc
```

### Paso 2: Reemplazar `eslint.config.mjs`
Usar el código del diseño técnico arriba.

### Paso 3: Actualizar script de lint
Modificar `package.json` → `scripts.lint` a `"eslint ."`

### Paso 4: Probar
```bash
npm run lint
```

**Resultado esperado:** Linting ejecuta sin errores de configuración.

### Paso 5: Ajustar reglas específicas (si es necesario)
Si hay reglas que fallan después de la migración:
1. Revisar los warnings/errors
2. Agregar overrides en la sección `rules` del config
3. Documentar razones en comentarios

---

## Consecuencias

### Positivas
- ✅ Elimina error de configuración circular
- ✅ Alineado con estándares actuales (ESLint 9+)
- ✅ Más fácil de mantener y extender
- ✅ Mejor DX (mensajes de error más claros)

### Negativas
- ⚠️ Cambio de configuración (requiere testing)
- ⚠️ Posibles diferencias menores en reglas (revisar output de lint)

### Riesgos
- **Bajo:** Next.js 16 ya soporta este formato nativamente
- **Mitigación:** Probar en local antes de hacer commit

---

## Referencias

- [ESLint 9 Flat Config Migration Guide](https://eslint.org/docs/latest/use/configure/migration-guide)
- [Next.js ESLint Documentation](https://nextjs.org/docs/app/api-reference/config/eslint)
- [ESLint Flat Config Deep Dive](https://eslint.org/blog/2025/03/flat-config-extends-define-config-global-ignores/)

---

## Notas para FullStack

1. **NO usar FlatCompat** - Importa directamente desde `eslint-config-next`
2. **NO necesitas `--ext` flag** - Flat config detecta extensiones automáticamente
3. **SI hay errores de reglas nuevas** - Ajusta en la sección `rules`, no elimines configs base
4. **Documenta overrides** - Si cambias reglas, agrega comentario explicando por qué

---

**Proxima revisión:** Después de implementación, verificar que:
- [ ] `npm run lint` ejecuta sin errores
- [ ] No hay warnings inesperados
- [ ] CI/CD pasa correctamente
