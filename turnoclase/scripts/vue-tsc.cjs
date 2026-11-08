#!/usr/bin/env node
/**
 * TypeScript 7 es el compilador nativo (Go): no incluye la implementación JS que
 * requiere vue-tsc (su motor, @volar/typescript, solo soporta `typescript < 7`),
 * lo que provocaba `ERR_PACKAGE_PATH_NOT_EXPORTED` al resolver `typescript/lib/tsc`.
 *
 * Por eso le pasamos explícitamente el `tsc` de `@typescript/typescript6` (la
 * última implementación JS de TypeScript). El binario `tsc` del proyecto sigue
 * siendo el de TypeScript 7; solo el type-check de `.vue` usa la implementación JS.
 */
require('vue-tsc').run(require.resolve('@typescript/typescript6/lib/tsc'));
