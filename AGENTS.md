# AGENTS.md — TurnoClase Vue

## Descripción del repositorio

Aplicaciones web de TurnoClase, equivalentes web a las apps móviles de iOS y Android. El repositorio contiene dos
aplicaciones Vue 3 independientes:

- **`turnoclase/`** — App del alumno. Permite unirse a un aula e introducir un código para ver el turno asignado.
- **`turnoclaseprofesor/`** — App del profesor. Gestiona el aula y los turnos de los alumnos.

## Stack tecnológico

- **Lenguaje:** TypeScript
- **Framework:** Vue 3 (`<script setup>` + Composition API)
- **Estado:** Pinia
- **Enrutamiento:** Vue Router 5 (modo history)
- **Build:** Vite 8
- **Comprobación de tipos:** vue-tsc
- **Runtime:** Node.js ^20.19.0 || >=22.12.0

## Estructura del repositorio

```
vue/
├── turnoclase/                  # App del alumno
│   ├── src/
│   │   ├── main.ts              # Punto de entrada
│   │   ├── App.vue              # Componente raíz
│   │   ├── router/index.ts      # Configuración de Vue Router
│   │   └── stores/              # Stores de Pinia
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
└── turnoclaseprofesor/          # App del profesor
    ├── src/
    │   ├── main.ts
    │   ├── App.vue
    │   ├── router/index.ts
    │   └── stores/
    ├── public/
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

## Comandos habituales

Todos los comandos se ejecutan desde el directorio de la app correspondiente (`turnoclase/` o `turnoclaseprofesor/`):

```bash
npm install          # Instalar dependencias
npm run dev          # Servidor de desarrollo (http://localhost:5173)
npm run build        # Compilar para producción (type-check + build)
npm run build-only   # Compilar sin type-check
npm run type-check   # Verificar tipos con vue-tsc
npm run preview      # Previsualizar el build de producción
```

## Convenciones

- Usar siempre `<script setup lang="ts">` en los componentes (Composition API con setup syntax).
- El alias `@` apunta a `src/` en ambas aplicaciones; usarlo para imports absolutos.
- El estado global va en stores de Pinia dentro de `src/stores/`.
- Las rutas van en `src/router/index.ts`.
- Los componentes se nombran en PascalCase; los ficheros de vista se sufijan con `View.vue`
  (p.ej. `TurnoView.vue`, `AulaView.vue`).
- Las stores de Pinia se nombran con el patrón `use<Nombre>Store` (p.ej. `useAulaStore`).
- No usar la Options API; toda la lógica nueva debe usar la Composition API.

## Commits

Al completar cualquier característica o cambio, crear un commit con:

- **Mensaje en español**, en imperativo y conciso (p.ej. `Añadir vista de turno del alumno`).
- Un commit por característica o cambio cohesionado; no agrupar cambios no relacionados.
- No incluir `node_modules/`, `dist/` ni ficheros generados.
- **Antes de hacer el commit**, verificar que el proyecto compila sin errores:

  ```bash
  npm run build
  ```

## Consideraciones para agentes

- Las dos apps son independientes; un cambio en una no implica cambiar la otra salvo que sea lógica compartida.
- Si surge lógica o componentes reutilizables entre ambas apps, valorar extraerlos a un paquete compartido antes de
  duplicarlos.
- El backend es el mismo que usan las apps móviles: Firebase (Auth, Firestore, App Check, Cloud Functions). Ver
  `backend/AGENTS.md` para más detalle.
- No añadir Firebase al proyecto sin instrucción explícita; la integración está pendiente de diseño.
- No modificar `tsconfig*.json` ni `vite.config.ts` salvo que sea estrictamente necesario para la tarea.
