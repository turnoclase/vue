<script setup lang="ts">
import { useAulaStore, type AlumnoCola } from '@/stores/aula'

const store = useAulaStore()
const emit = defineEmits<{ cerrar: [] }>()

async function vaciar() {
  if (window.confirm('¿Seguro que quieres vaciar la cola?')) {
    await store.vaciarCola()
  }
}
</script>

<template>
  <div class="lista-cola d-flex flex-column h-100">
    <!-- Header -->
    <div class="mb-3">
      <h5 class="fw-bold mb-1">{{ store.codigoAula }}</h5>
      <span v-if="store.etiquetaAula" class="text-muted fst-italic small">» {{ store.etiquetaAula }} «</span>
      <div class="text-muted small mt-1">
        {{ store.enCola }} alumno{{ store.enCola === 1 ? '' : 's' }} en cola
      </div>
    </div>

    <!-- Cola vacía -->
    <div v-if="store.alumnosEnCola.length === 0" class="d-flex flex-column align-items-center justify-content-center flex-grow-1 gap-3 text-muted">
      <i class="bi bi-person-slash" style="font-size: 3rem;"></i>
      <span>La cola está vacía</span>
    </div>

    <!-- Lista de alumnos -->
    <div v-else class="flex-grow-1 overflow-auto">
      <ul class="list-group list-group-flush">
        <li
          v-for="(alumno, index) in store.alumnosEnCola"
          :key="alumno.id"
          class="list-group-item d-flex align-items-center gap-3 px-0"
        >
          <!-- Número -->
          <span
            class="badge rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style="width: 32px; height: 32px; font-size: 14px;"
            :style="{
              backgroundColor: index === 0 ? 'var(--azul)' : 'var(--gris)',
              color: index === 0 ? 'white' : '#333',
            }"
          >
            {{ index + 1 }}
          </span>

          <!-- Nombre -->
          <span class="flex-grow-1">{{ alumno.nombre }}</span>

          <!-- Botón eliminar -->
          <button
            type="button"
            class="btn btn-sm btn-link p-0"
            style="color: var(--rojo);"
            @click="store.eliminarAlumnoDeCola(alumno)"
          >
            <i class="bi bi-trash"></i>
          </button>
        </li>
      </ul>
    </div>

    <!-- Vaciar cola -->
    <div v-if="store.alumnosEnCola.length > 0" class="mt-3">
      <button type="button" class="btn btn-danger w-100" @click="vaciar">
        Vaciar cola
      </button>
    </div>
  </div>
</template>

<style scoped>
.lista-cola {
  min-height: 200px;
}
</style>
