<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useConexionStore } from '@/stores/conexion'
import BotonCircular from '@/components/BotonCircular.vue'
import BotonCircularIcono from '@/components/BotonCircularIcono.vue'
import AnimacionPuntos from '@/components/AnimacionPuntos.vue'
import IconEquis from '@/components/icons/IconEquis.vue'
import IconRecargar from '@/components/icons/IconRecargar.vue'
import IconPersona from '@/components/icons/IconPersona.vue'

const store = useConexionStore()

const containerRef = ref<HTMLDivElement | null>(null)
const ancho = ref(0)
const alto = ref(0)

const tamanoCirculo = computed(() => Math.min(ancho.value, alto.value) * 0.7)
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

const posCodigo = computed(() => posicionEnBorde(30))
const posCancelar = computed(() => posicionEnBorde(-60))
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

const tiempoFormateado = computed(() => {
  const m = String(store.minutosRestantes).padStart(2, '0')
  const s = String(store.segundosRestantes).padStart(2, '0')
  return `${m}:${s}`
})

let ro: ResizeObserver | null = null

onMounted(() => {
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
    <!-- Círculo gris principal -->
    <div
      class="circulo-principal"
      :style="{
        width: `${tamanoCirculo}px`,
        height: `${tamanoCirculo}px`,
        left: `${centroX - tamanoCirculo / 2}px`,
        top: `${centroY - tamanoCirculo / 2}px`,
      }"
    >
      <!-- Icono fondo -->
      <div class="icono-fondo" :style="{ width: `${tamanoCirculo * 0.6}px`, height: `${tamanoCirculo * 0.6}px` }">
        <IconPersona />
      </div>

      <!-- Contenido central -->
      <div class="contenido-centro">
        <!-- Cargando -->
        <AnimacionPuntos v-if="store.cargando" color="var(--azul)" :tamanyo="14" />

        <!-- Error -->
        <template v-else-if="store.mostrarError">
          <span class="texto-estado">
            {{ store.errorRed ? 'Error de conexión' : 'Aula no encontrada' }}
          </span>
        </template>

        <!-- Estado normal -->
        <template v-else>
          <template v-if="store.estadoTurno.tipo === 'enCola'">
            <span class="numero-posicion">{{ store.estadoTurno.posicion }}</span>
          </template>
          <template v-else-if="store.estadoTurno.tipo === 'esTuTurno'">
            <span class="texto-turno">¡Es tu turno!</span>
          </template>
          <template v-else-if="store.estadoTurno.tipo === 'volverAEmpezar'">
            <span class="texto-turno text-center" style="white-space: pre-line;">Puedes pedir{'\n'}turno de nuevo</span>
          </template>
          <template v-else-if="store.estadoTurno.tipo === 'esperando'">
            <span class="texto-turno">Espera</span>
          </template>
        </template>
      </div>
    </div>

    <!-- Botón código aula (amarillo, 30°) -->
    <div :style="estiloBoton(posCodigo)">
      <BotonCircular
        :titulo="store.codigoAulaActual"
        color-fondo="var(--amarillo)"
        color-texto="#333"
        :tamanyo="BOTON"
      />
    </div>

    <!-- Botón cancelar (rojo, -60°) -->
    <div :style="estiloBoton(posCancelar)">
      <BotonCircularIcono
        color-fondo="var(--rojo)"
        color-icono="white"
        :tamanyo="BOTON"
        @click="store.cancelar()"
      >
        <IconEquis />
      </BotonCircularIcono>
    </div>

    <!-- Botón acción (azul, 150°) -->
    <div :style="estiloBoton(posAccion)">
      <!-- Cronómetro -->
      <BotonCircular
        v-if="store.mostrarCronometro"
        :titulo="tiempoFormateado"
        color-fondo="var(--azul)"
        color-texto="white"
        :tamanyo="BOTON"
        style="font-family: monospace;"
      />
      <!-- Error de red: botón reintentar -->
      <BotonCircularIcono
        v-else-if="store.errorRed"
        color-fondo="var(--azul)"
        color-icono="white"
        :tamanyo="BOTON"
        @click="store.reintentar()"
      >
        <IconRecargar />
      </BotonCircularIcono>
      <!-- Actualizar -->
      <BotonCircularIcono
        v-else
        color-fondo="var(--azul)"
        color-icono="white"
        :tamanyo="BOTON"
        :disabled="!store.mostrarBotonActualizar"
        :style="{ opacity: store.mostrarBotonActualizar ? 1 : 0 }"
        @click="store.actualizar()"
      >
        <IconRecargar />
      </BotonCircularIcono>
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

.circulo-principal {
  position: absolute;
  border-radius: 50%;
  background: var(--gris);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
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
}

.numero-posicion {
  font-size: 72px;
  font-weight: 700;
  color: #333;
  line-height: 1;
}

.texto-turno {
  font-size: 30px;
  font-weight: 600;
  color: #333;
  text-align: center;
}

.texto-estado {
  font-size: 20px;
  font-weight: 500;
  color: #666;
  text-align: center;
  padding: 0 16px;
}
</style>
