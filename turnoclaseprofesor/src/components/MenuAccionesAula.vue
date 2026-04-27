<script setup lang="ts">
import { useAulaStore } from '@/stores/aula'

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
        <span v-if="store.invitado">Conectado como invitado</span>
        <span v-else>PIN para compartir este aula: <strong>{{ store.PIN }}</strong></span>
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
          Etiquetar aula
        </button>

        <button
          type="button"
          class="list-group-item list-group-item-action d-flex align-items-center gap-2"
          @click="emit('tiempo')"
        >
          <i class="bi bi-stopwatch" style="color: var(--azul);"></i>
          Tiempo de espera: {{ store.tiempoEspera }} minuto{{ store.tiempoEspera === 1 ? '' : 's' }}
        </button>

        <button
          v-if="store.numAulas < 16"
          type="button"
          class="list-group-item list-group-item-action d-flex align-items-center gap-2"
          @click="anyadirAula"
        >
          <i class="bi bi-plus-circle" style="color: var(--azul);"></i>
          Añadir aula
        </button>

        <button
          v-if="store.numAulas > 1"
          type="button"
          class="list-group-item list-group-item-action d-flex align-items-center gap-2"
          @click="emit('borrar')"
        >
          <i class="bi bi-trash" style="color: var(--rojo);"></i>
          <span style="color: var(--rojo);">Borrar aula</span>
        </button>

        <button
          type="button"
          class="list-group-item list-group-item-action d-flex align-items-center gap-2"
          @click="emit('conectar')"
        >
          <i class="bi bi-link-45deg" style="color: var(--azul);"></i>
          Conectar a otra aula
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
          <span style="color: var(--rojo);">Desconectar del aula</span>
        </button>
      </div>
    </template>
  </div>
</template>
