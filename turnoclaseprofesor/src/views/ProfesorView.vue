<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAulaStore } from '@/stores/aula'
import BotonCircular from '@/components/BotonCircular.vue'
import BotonCircularIcono from '@/components/BotonCircularIcono.vue'
import AnimacionPuntos from '@/components/AnimacionPuntos.vue'
import MenuAccionesAula from '@/components/MenuAccionesAula.vue'
import DialogoConexion from '@/components/DialogoConexion.vue'
import DialogoEtiqueta from '@/components/DialogoEtiqueta.vue'
import DialogoTiempoEspera from '@/components/DialogoTiempoEspera.vue'
import ListaColaAlumnos from '@/components/ListaColaAlumnos.vue'
import IconFlecha from '@/components/icons/IconFlecha.vue'
import IconRecargar from '@/components/icons/IconRecargar.vue'
import IconPersona from '@/components/icons/IconPersona.vue'

const store = useAulaStore()

// ── Tamaño viewport ─────────────────────────────────────────────────────────
const containerRef = ref<HTMLDivElement | null>(null)
const ancho = ref(0)
const alto = ref(0)

const tamanoCirculo = computed(() => Math.min(ancho.value, alto.value) * 0.70)
const centroX = computed(() => ancho.value / 2 + 8)
const centroY = computed(() => alto.value / 2 - 12)
const radio = computed(() => tamanoCirculo.value / 2)

function posicionEnBorde(angulo: number) {
  const rad = ((angulo - 90) * Math.PI) / 180
  return {
    x: centroX.value + radio.value * Math.cos(rad),
    y: centroY.value + radio.value * Math.sin(rad),
  }
}

const posCodigo = computed(() => posicionEnBorde(-60))
const posCola = computed(() => posicionEnBorde(30))
const posAccion = computed(() => posicionEnBorde(150))

const BOTON = 72

function estiloBoton(pos: { x: number; y: number }) {
  return {
    position: 'absolute' as const,
    left: `${pos.x - BOTON / 2}px`,
    top: `${pos.y - BOTON / 2}px`,
    width: `${BOTON}px`,
    height: `${BOTON}px`,
  }
}

// ── Swipe detection ──────────────────────────────────────────────────────────
let touchStartX = 0

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0]?.clientX ?? 0
}

function onTouchEnd(e: TouchEvent) {
  const endX = e.changedTouches[0]?.clientX ?? 0
  const diff = endX - touchStartX
  if (Math.abs(diff) > 30) {
    if (diff < 0) {
      store.aulaSiguiente()
    } else {
      store.aulaAnterior()
    }
  }
}

// ── Dialog state ────────────────────────────────────────────────────────────
const mostrarMenuAcciones = ref(false)
const mostrarDialogoConexion = ref(false)
const mostrarDialogoBorrar = ref(false)
const mostrarDialogoEtiqueta = ref(false)
const mostrarDialogoTiempo = ref(false)
const mostrarListaCola = ref(false)

const textoEtiqueta = ref('')
const tiempoSeleccionado = ref(5)

// ── MenuAccionesAula handlers ────────────────────────────────────────────────
function onEtiquetar() {
  textoEtiqueta.value = store.etiquetaAula
  mostrarMenuAcciones.value = false
  mostrarDialogoEtiqueta.value = true
}

function onTiempo() {
  tiempoSeleccionado.value = store.tiempoEspera
  mostrarMenuAcciones.value = false
  mostrarDialogoTiempo.value = true
}

function onBorrar() {
  mostrarMenuAcciones.value = false
  mostrarDialogoBorrar.value = true
}

function onConectar() {
  mostrarMenuAcciones.value = false
  mostrarDialogoConexion.value = true
}

function confirmarBorrar() {
  mostrarDialogoBorrar.value = false
  store.borrarAulaReconectar(store.codigoAula)
}

function onGuardarEtiqueta(etiqueta: string) {
  store.actualizarEtiqueta(etiqueta)
  mostrarDialogoEtiqueta.value = false
}

function onGuardarTiempo(tiempo: number) {
  store.actualizarTiempoEspera(tiempo)
  mostrarDialogoTiempo.value = false
}

function onConectarAula(codigo: string, pin: string) {
  if (store.codigoAula !== codigo) {
    store.buscarAula(codigo, pin)
  } else {
    alert('Ya estás conectado a esa aula.')
  }
  mostrarDialogoConexion.value = false
}

// ── ResizeObserver ───────────────────────────────────────────────────────────
let ro: ResizeObserver | null = null

onMounted(() => {
  store.iniciar()

  ro = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    const rect = entry.contentRect
    ancho.value = rect.width
    alto.value = rect.height
  })
  if (containerRef.value) {
    ro.observe(containerRef.value)
    const rect = containerRef.value.getBoundingClientRect()
    ancho.value = rect.width
    alto.value = rect.height
  }
})

onUnmounted(() => {
  ro?.disconnect()
})
</script>

<template>
  <div ref="containerRef" class="pantalla-completa">

    <!-- ── Círculo principal (amarillo) ─────────────────────────────────── -->
    <div
      class="circulo-principal"
      :style="{
        width: `${tamanoCirculo}px`,
        height: `${tamanoCirculo}px`,
        left: `${centroX - tamanoCirculo / 2}px`,
        top: `${centroY - tamanoCirculo / 2}px`,
      }"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <!-- Icono persona de fondo -->
      <div
        class="icono-fondo"
        :style="{ width: `${tamanoCirculo * 0.6}px`, height: `${tamanoCirculo * 0.6}px` }"
      >
        <IconPersona />
      </div>

      <!-- Contenido central -->
      <div class="contenido-centro">
        <AnimacionPuntos v-if="store.cargando" color="#000" :tamanyo="10" />

        <span
          v-else-if="store.errorRed"
          class="text-center"
          style="font-size: 22px; color: #000; padding: 20px;"
        >
          No hay conexión de red
        </span>

        <span
          v-else
          class="nombre-alumno"
          :style="{ maxWidth: `${tamanoCirculo - 32}px` }"
        >
          {{ store.nombreAlumno }}
        </span>
      </div>
    </div>

    <!-- ── Page control (indicador de aulas) ────────────────────────────── -->
    <div
      class="page-control"
      :style="{
        left: `${centroX}px`,
        top: `${centroY + tamanoCirculo / 2 + 40}px`,
      }"
    >
      <div v-if="store.mostrarIndicador" class="spinner-border spinner-border-sm" role="status">
        <span class="visually-hidden">Creando aula…</span>
      </div>
      <div
        v-else-if="store.numAulas > 1 && !store.invitado"
        class="d-flex gap-2 align-items-center"
      >
        <span
          v-for="i in store.numAulas"
          :key="i"
          class="page-dot"
          :class="{ 'page-dot-active': i - 1 === store.aulaActual }"
        />
      </div>
    </div>

    <!-- ── Botón código aula (-60°) ──────────────────────────────────────── -->
    <div :style="estiloBoton(posCodigo)">
      <BotonCircular
        :titulo="store.codigoAula"
        color-fondo="var(--gris)"
        color-texto="#000"
        :tamanyo="BOTON"
        @click="mostrarMenuAcciones = true"
      />
    </div>

    <!-- ── Botón cola (30°) ──────────────────────────────────────────────── -->
    <div :style="estiloBoton(posCola)">
      <BotonCircular
        :titulo="String(store.enCola)"
        color-fondo="var(--rojo)"
        color-texto="white"
        :tamanyo="BOTON"
        @click="mostrarListaCola = true"
      />
    </div>

    <!-- ── Botón acción (150°) ───────────────────────────────────────────── -->
    <div :style="estiloBoton(posAccion)">
      <BotonCircularIcono
        v-if="store.errorRed"
        color-fondo="var(--azul)"
        color-icono="white"
        :tamanyo="BOTON"
        @click="store.reintentar()"
      >
        <IconRecargar />
      </BotonCircularIcono>
      <BotonCircularIcono
        v-else
        color-fondo="var(--azul)"
        color-icono="white"
        :tamanyo="BOTON"
        @click="store.mostrarSiguiente(true)"
      >
        <IconFlecha />
      </BotonCircularIcono>
    </div>

    <!-- ══════════════ OVERLAYS / DIALOGS ════════════════════════════════ -->

    <!-- ── Backdrop ──────────────────────────────────────────────────────── -->
    <div
      v-if="mostrarMenuAcciones || mostrarListaCola || mostrarDialogoConexion || mostrarDialogoEtiqueta || mostrarDialogoTiempo || mostrarDialogoBorrar"
      class="backdrop"
      @click="mostrarMenuAcciones = mostrarListaCola = mostrarDialogoConexion = mostrarDialogoEtiqueta = mostrarDialogoTiempo = mostrarDialogoBorrar = false"
    />

    <!-- ── Offcanvas menú acciones ────────────────────────────────────────── -->
    <div
      class="offcanvas-panel"
      :class="{ 'offcanvas-panel--visible': mostrarMenuAcciones }"
    >
      <div class="offcanvas-panel__header">
        <button
          type="button"
          class="btn-close"
          @click="mostrarMenuAcciones = false"
        />
      </div>
      <div class="offcanvas-panel__body">
        <MenuAccionesAula
          @cerrar="mostrarMenuAcciones = false"
          @etiquetar="onEtiquetar"
          @tiempo="onTiempo"
          @borrar="onBorrar"
          @conectar="onConectar"
        />
      </div>
    </div>

    <!-- ── Offcanvas lista cola ───────────────────────────────────────────── -->
    <div
      class="offcanvas-panel"
      :class="{ 'offcanvas-panel--visible': mostrarListaCola }"
    >
      <div class="offcanvas-panel__header">
        <button
          type="button"
          class="btn-close"
          @click="mostrarListaCola = false"
        />
      </div>
      <div class="offcanvas-panel__body">
        <ListaColaAlumnos @cerrar="mostrarListaCola = false" />
      </div>
    </div>

    <!-- ── Modal: conexión ────────────────────────────────────────────────── -->
    <div
      v-if="mostrarDialogoConexion"
      class="modal-panel"
    >
      <div class="modal-panel__content">
        <DialogoConexion
          @conectar="onConectarAula"
          @cancelar="mostrarDialogoConexion = false"
        />
      </div>
    </div>

    <!-- ── Modal: etiqueta ────────────────────────────────────────────────── -->
    <div
      v-if="mostrarDialogoEtiqueta"
      class="modal-panel"
    >
      <div class="modal-panel__content">
        <DialogoEtiqueta
          :valor-inicial="textoEtiqueta"
          @guardar="onGuardarEtiqueta"
          @cancelar="mostrarDialogoEtiqueta = false"
        />
      </div>
    </div>

    <!-- ── Modal: tiempo de espera ────────────────────────────────────────── -->
    <div
      v-if="mostrarDialogoTiempo"
      class="modal-panel"
    >
      <div class="modal-panel__content">
        <DialogoTiempoEspera
          :valor-inicial="tiempoSeleccionado"
          @guardar="onGuardarTiempo"
          @cancelar="mostrarDialogoTiempo = false"
        />
      </div>
    </div>

    <!-- ── Modal: confirmar borrar ────────────────────────────────────────── -->
    <div
      v-if="mostrarDialogoBorrar"
      class="modal-panel"
    >
      <div class="modal-panel__content">
        <h5 class="fw-bold mb-2">Borrar aula</h5>
        <p class="text-muted">¿Seguro que quieres borrar el aula <strong>{{ store.codigoAula }}</strong>? Esta acción no se puede deshacer.</p>
        <div class="d-flex gap-2 justify-content-end">
          <button type="button" class="btn btn-outline-secondary" @click="mostrarDialogoBorrar = false">Cancelar</button>
          <button type="button" class="btn btn-danger" @click="confirmarBorrar">Borrar</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.pantalla-completa {
  position: fixed;
  inset: 0;
  background: white;
  overflow: hidden;
}

/* ── Círculo ─────────────────────────────────────────────────── */
.circulo-principal {
  position: absolute;
  border-radius: 50%;
  background: var(--amarillo);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  touch-action: pan-y;
}

.icono-fondo {
  position: absolute;
  opacity: 0.025;
  pointer-events: none;
}

.contenido-centro {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
}

.nombre-alumno {
  font-size: 51px;
  font-weight: 700;
  color: #000;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

/* ── Page control ─────────────────────────────────────────────── */
.page-control {
  position: absolute;
  transform: translate(-50%, 0);
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
  border: 2px solid #999;
}

.page-dot-active {
  background: #333;
  border-color: #333;
}

/* ── Backdrop ─────────────────────────────────────────────────── */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

/* ── Offcanvas panel (slide from bottom) ──────────────────────── */
.offcanvas-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 16px 16px 0 0;
  z-index: 200;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.offcanvas-panel--visible {
  transform: translateY(0);
}

.offcanvas-panel__header {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px 0;
}

.offcanvas-panel__body {
  padding: 8px 20px 32px;
  overflow-y: auto;
  flex: 1;
}

/* ── Modal panel (centered) ────────────────────────────────────── */
.modal-panel {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
}

.modal-panel__content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}
</style>
