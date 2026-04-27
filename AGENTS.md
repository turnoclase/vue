# AGENTS.md — TurnoClase Vue

## Descripción del repositorio

Aplicaciones web de TurnoClase, equivalentes a las apps móviles de iOS y Android. El repositorio contiene dos
aplicaciones Vue 3 independientes desplegadas en GitHub Pages:

- **`turnoclase/`** — App del alumno. Permite unirse a un aula introduciendo un código y gestiona el turno asignado.
  URL de producción: `https://turnoclase.github.io/vue/`
- **`turnoclaseprofesor/`** — App del profesor. Gestiona el aula, la cola de alumnos y la sesión de turnos.
  URL de producción: `https://turnoclase.github.io/vue/profesor/`

## Stack tecnológico

- **Lenguaje:** TypeScript
- **Framework:** Vue 3 (`<script setup>` + Composition API)
- **Estado:** Pinia
- **Enrutamiento:** Vue Router 5 — **modo hash** (`createWebHashHistory`), requerido para GitHub Pages
- **Build:** Vite 6
- **CSS:** Bootstrap 5 + Bootstrap Icons (instalados como paquetes npm, importados vía SCSS)
- **Comprobación de tipos:** vue-tsc
- **Backend:** Firebase (Auth anónima, Firestore, App Check con reCAPTCHA v3, Cloud Functions)
- **Runtime:** Node.js ^20.19.0 || >=22.12.0

## Estructura del repositorio

```
vue/
├── .github/workflows/
│   └── deploy-turnoclase.yml     # CI/CD: compila ambas apps y despliega en GitHub Pages
├── turnoclase/                   # App del alumno
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── firebase.ts           # Inicialización Firebase + App Check
│   │   ├── router/index.ts       # Hash history; rutas: /, /turno, /historico
│   │   ├── stores/
│   │   │   └── conexion.ts       # Store principal: auth, turno, historial de aulas
│   │   ├── views/
│   │   │   ├── ConexionView.vue  # Pantalla de conexión al aula (código de 5 chars)
│   │   │   ├── TurnoView.vue     # Círculo con número de turno
│   │   │   └── HistoricoView.vue # Lista de aulas visitadas (localStorage)
│   │   ├── composables/          # Lógica reutilizable (useCirculo, etc.)
│   │   ├── components/
│   │   │   ├── BotonCircular.vue
│   │   │   ├── BotonCircularIcono.vue
│   │   │   ├── AnimacionPuntos.vue
│   │   │   └── icons/            # IconFlecha, IconEquis, IconRecargar, IconPersona
│   │   └── styles/main.scss
│   ├── .env.example
│   ├── env.d.ts
│   └── vite.config.ts
└── turnoclaseprofesor/           # App del profesor
    ├── src/
    │   ├── main.ts
    │   ├── App.vue
    │   ├── firebase.ts           # Inicialización Firebase + App Check (idéntico al alumno)
    │   ├── router/index.ts       # Hash history; única ruta: /
    │   ├── stores/
    │   │   └── aula.ts           # Store principal: auth persistente, aulas, cola, invitado
    │   ├── views/
    │   │   └── ProfesorView.vue  # Vista única: círculo amarillo + botones + diálogos
    │   ├── components/
    │   │   ├── BotonCircular.vue
    │   │   ├── BotonCircularIcono.vue
    │   │   ├── AnimacionPuntos.vue
    │   │   ├── MenuAccionesAula.vue
    │   │   ├── DialogoConexion.vue
    │   │   ├── DialogoEtiqueta.vue
    │   │   ├── DialogoTiempoEspera.vue
    │   │   ├── ListaColaAlumnos.vue
    │   │   └── icons/            # Mismos 4 iconos SVG que la app del alumno
    │   └── styles/main.scss
    ├── .env.example
    ├── env.d.ts
    └── vite.config.ts
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

## Variables de entorno

Cada app tiene un `.env.example` con las variables requeridas. Copiar a `.env` y rellenar los valores:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=          # https://turnoclase-eu.firebaseio.com
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_RECAPTCHA_SITE_KEY=             # Clave pública reCAPTCHA v3 (no es un secreto)
```

En desarrollo, Firebase App Check imprime un token de depuración UUID en la consola del navegador que debe
registrarse en Firebase Console → App Check → app web → Manage debug tokens.

## Firebase App Check

Ambas apps usan App Check con reCAPTCHA v3:
- En desarrollo (`import.meta.env.DEV`): se activa el token de depuración automáticamente (aparece en consola).
- En producción: se usa `VITE_RECAPTCHA_SITE_KEY`.
- `initializeAppCheck` se llama en `firebase.ts` antes de cualquier servicio de Firebase.

## Modelo de datos Firestore

```
alumnos/{uid}
  → { nombre: string }

profesores/{uid}/aulas/{aulaId}
  → { codigo: string, timestamp: Timestamp, pin: string, espera: number, etiqueta: string }

profesores/{uid}/aulas/{aulaId}/cola/{posId}
  → { alumno: string (uid), timestamp: Timestamp }

profesores/{uid}/aulas/{aulaId}/espera/{alumnoUid}
  → { timestamp: Timestamp }
```

Cloud Function callable `nuevoCodigo` (región `europe-west1`) genera el código de un aula nueva y devuelve
`{ codigo: string }`.

## Persistencia en localStorage

- **App del alumno:** historial de aulas visitadas (código + etiqueta).
- **App del profesor:**
  - `profesorUid` — UID anónimo de Firebase del profesor (para mantener sus aulas entre sesiones).
  - `codigoAulaConectada` + `pinConectada` — credenciales de modo invitado (conectado a aula ajena).

## Diseño de UI — patrón común

Ambas apps siguen el mismo patrón visual heredado de las apps iOS/Android:

- **Círculo central** posicionado con ResizeObserver en el viewport.
- **Botones circulares** (`BotonCircular`, `BotonCircularIcono`) colocados en el borde del círculo
  mediante trigonometría (`posicionEnBorde(angulo)`).
- **Iconos SVG** propios: `IconFlecha`, `IconEquis`, `IconRecargar`, `IconPersona`.
- Colores en variables CSS (`--azul`, `--rojo`, `--amarillo`, `--gris`).
- App del alumno: círculo **gris** (`--gris`). App del profesor: círculo **amarillo** (`--amarillo`).
- La app del profesor soporta navegación entre aulas con gesto de arrastre (touch y ratón) sobre el círculo.

## Despliegue en GitHub Pages

El workflow `.github/workflows/deploy-turnoclase.yml` se dispara en cada push a `master` que afecte a
`turnoclase/**`, `turnoclaseprofesor/**` o al propio workflow.

- Compila `turnoclase` con `BASE_PATH=/vue/` → artefacto en `dist-pages/`
- Compila `turnoclaseprofesor` con `BASE_PATH=/vue/profesor/` → artefacto en `dist-pages/profesor/`
- Las variables de entorno se pasan como GitHub Secrets (`VITE_*`) y `BASE_PATH` como variable de entorno
  de Node (sin prefijo `VITE_`, por lo que no se expone en el bundle).
- `vite.config.ts` de cada app lee `process.env.BASE_PATH ?? '/'` para el campo `base`.

## Convenciones

- Usar siempre `<script setup lang="ts">` en los componentes.
- El alias `@` apunta a `src/` en ambas aplicaciones.
- El estado global va en stores de Pinia en `src/stores/`.
- Las rutas van en `src/router/index.ts`.
- Componentes en PascalCase; vistas sufijadas con `View.vue`.
- Stores con el patrón `use<Nombre>Store` (p.ej. `useAulaStore`, `useConexionStore`).
- No usar la Options API.
- No modificar `tsconfig*.json` ni `vite.config.ts` salvo necesidad justificada.

## Consideraciones para agentes

- Las dos apps son independientes; los componentes e iconos compartidos están duplicados intencionalmente
  (no hay paquete compartido). Si se modifica un componente compartido en una app, valorar replicarlo en la otra.
- El modo hash en Vue Router es obligatorio: GitHub Pages no tiene reescritura de rutas SPA.
- El UID del profesor **debe persistir** en localStorage; sin él, el profesor perdería sus aulas al recargar.
- La app del profesor tiene una sola vista (`ProfesorView.vue`) con todos los diálogos gestionados ahí mismo
  mediante `v-if`; no añadir rutas adicionales salvo indicación explícita.
- Antes de hacer commit, verificar que el proyecto compila sin errores con `npm run build`.
