<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAulaStore } from '@/stores/aula'

const { t } = useI18n()
const store = useAulaStore()

const emit = defineEmits<{
  cerrar: []
  etiquetar: []
  tiempo: []
  borrar: []
  conectar: []
}>()

function anyadirAula() {
  store.anyadirAula()
  emit('cerrar')
}

function desconectar() {
  store.desconectarAula()
  emit('cerrar')
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-3">
      <h5 class="fw-bold mb-1">{{ store.codigoAula }}</h5>
      <span v-if="store.etiquetaAula" class="text-muted fst-italic">» {{ store.etiquetaAula }} «</span>
      <div class="small text-muted mt-1">
        <span v-if="store.invitado">{{ t('conectado_como_invitado') }}</span>
        <span v-else>{{ t('pin_compartir', { pin: store.PIN }) }}</span>
      </div>
    </div>

    <!-- Acciones modo normal -->
    <template v-if="!store.invitado && store.codigoAula !== '?'">
      <div class="list-group list-group-flush">
        <button
          type="button"
          class="list-group-item list-group-item-action d-flex align-items-center gap-2"
          @click="emit('etiquetar')"
        >
          <i class="bi bi-tag" style="color: var(--azul);"></i>
          {{ t('etiquetar_aula') }}
        </button>

        <button
          type="button"
          class="list-group-item list-group-item-action d-flex align-items-center gap-2"
          @click="emit('tiempo')"
        >
          <i class="bi bi-stopwatch" style="color: var(--azul);"></i>
          {{ t('tiempo_de_espera_valor', { n: store.tiempoEspera }) }}
        </button>

        <button
          v-if="store.numAulas < 16"
          type="button"
          class="list-group-item list-group-item-action d-flex align-items-center gap-2"
          @click="anyadirAula"
        >
          <i class="bi bi-plus-circle" style="color: var(--azul);"></i>
          {{ t('anyadir_aula') }}
        </button>

        <button
          v-if="store.numAulas > 1"
          type="button"
          class="list-group-item list-group-item-action d-flex align-items-center gap-2"
          @click="emit('borrar')"
        >
          <i class="bi bi-trash" style="color: var(--rojo);"></i>
          <span style="color: var(--rojo);">{{ t('borrar_aula') }}</span>
        </button>

        <button
          type="button"
          class="list-group-item list-group-item-action d-flex align-items-center gap-2"
          @click="emit('conectar')"
        >
          <i class="bi bi-link-45deg" style="color: var(--azul);"></i>
          {{ t('conectar_a_otra_aula') }}
        </button>
      </div>
    </template>

    <!-- Acciones modo invitado -->
    <template v-else-if="store.invitado">
      <div class="list-group list-group-flush">
        <button
          type="button"
          class="list-group-item list-group-item-action d-flex align-items-center gap-2"
          @click="desconectar"
        >
          <i class="bi bi-x-circle" style="color: var(--rojo);"></i>
          <span style="color: var(--rojo);">{{ t('desconectar_del_aula') }}</span>
        </button>
      </div>
    </template>
  </div>
</template>
