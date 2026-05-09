<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConexionStore } from '@/stores/conexion'
import BotonCircularIcono from '@/components/BotonCircularIcono.vue'
import IconFlecha from '@/components/icons/IconFlecha.vue'
import IconPersona from '@/components/icons/IconPersona.vue'
import HistoricoView from '@/views/HistoricoView.vue'

const { t } = useI18n()
const store = useConexionStore()

const containerRef = ref<HTMLDivElement | null>(null)
const ancho = ref(0)
const alto = ref(0)
const mostrarHistorico = ref(false)
const codigoRef = ref<HTMLInputElement | null>(null)
const nombreRef = ref<HTMLInputElement | null>(null)

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

const posFlecha = computed(() => posicionEnBorde(150))

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

function onCodigoCambia(e: Event) {
  const val = (e.target as HTMLInputElement).value
  store.codigoAula = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)
  ;(e.target as HTMLInputElement).value = store.codigoAula
}

function onCodigoKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    nombreRef.value?.focus()
  }
}

function onNombreKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && store.puedeConectar) {
    store.conectar()
  }
}

function seleccionarCodigo(codigo: string) {
  store.codigoAula = codigo
  mostrarHistorico.value = false
}
</script>

<template>
  <div ref="containerRef" class="pantalla-completa" @click.self="(containerRef as HTMLElement | null)?.focus()">
    <!-- Círculo gris principal -->
    <div
      class="circulo-principal"
      :style="{
        width: `${tamanoCirculo}px`,
        height: `${tamanoCirculo}px`,
        left: `${centroX - tamanoCirculo / 2}px`,
        top: `${centroY - tamanoCirculo / 2}px`,
      }"
      @click.self="($event.currentTarget as HTMLElement)?.focus()"
    >
      <!-- Icono de fondo -->
      <div class="icono-fondo" :style="{ width: `${tamanoCirculo * 0.6}px`, height: `${tamanoCirculo * 0.6}px` }">
        <IconPersona />
      </div>

      <!-- Formulario centrado -->
      <div class="formulario-centro">
        <div class="campo-grupo mb-3">
          <label class="etiqueta-campo">{{ t('aula') }}</label>
          <div class="input-con-boton">
            <input
              ref="codigoRef"
              class="input-circular"
              :class="{ 'input-circular--con-boton': store.historicoAulas.length > 0 }"
              type="text"
              maxlength="5"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="characters"
              spellcheck="false"
              inputmode="text"
              placeholder="BE131"
              :value="store.codigoAula"
              @input="onCodigoCambia"
              @keydown="onCodigoKeydown"
            />
            <button
              v-if="store.historicoAulas.length > 0"
              class="boton-historico"
              @click.stop="mostrarHistorico = true"
            >
              <i class="bi bi-funnel" />
            </button>
          </div>
        </div>

        <div class="campo-grupo">
          <label class="etiqueta-campo">{{ t('nombre') }}</label>
          <input
            ref="nombreRef"
            class="input-circular"
            type="text"
            maxlength="15"
            autocapitalize="words"
            autocomplete="given-name"
            v-model="store.nombreUsuario"
            :placeholder="store.placeholder"
            @keydown="onNombreKeydown"
          />
        </div>
      </div>
    </div>

    <!-- Botón flecha (azul, 150°) -->
    <div :style="estiloBoton(posFlecha)" :class="{ 'opacity-40': !store.puedeConectar }">
      <BotonCircularIcono
        color-fondo="var(--azul)"
        color-icono="white"
        :tamanyo="BOTON"
        :disabled="!store.puedeConectar"
        @click="store.conectar()"
      >
        <IconFlecha />
      </BotonCircularIcono>
    </div>

    <!-- Histórico offcanvas -->
    <HistoricoView
      v-if="mostrarHistorico"
      @cerrar="mostrarHistorico = false"
      @seleccionar="seleccionarCodigo"
    />
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

.formulario-centro {
  position: relative;
  z-index: 1;
  width: 70%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.campo-grupo {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.etiqueta-campo {
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.08em;
  color: #333;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.input-circular {
  background: white;
  border: none;
  border-radius: 100px;
  text-align: center;
  font-size: 22px;
  padding: 8px 16px;
  width: 100%;
  outline: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.input-circular::placeholder {
  color: #bbb;
}

.input-circular--con-boton {
  padding-right: 38px;
  padding-left: 38px;
}

.input-con-boton {
  position: relative;
  width: 100%;
}

.boton-historico {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.4);
  font-size: 18px;
  cursor: pointer;
}

.opacity-40 {
  opacity: 0.4;
}
</style>
