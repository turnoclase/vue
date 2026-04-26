<script setup lang="ts">
import { ref } from 'vue'
import { useConexionStore } from '@/stores/conexion'

const emit = defineEmits<{
  cerrar: []
  seleccionar: [codigo: string]
}>()

const store = useConexionStore()
const editandoId = ref<string | null>(null)
const textoEdicion = ref('')

function seleccionar(codigo: string) {
  emit('seleccionar', codigo)
}

function iniciarEdicion(id: string, etiquetaActual: string) {
  editandoId.value = id
  textoEdicion.value = etiquetaActual
}

function guardarEdicion(id: string) {
  store.actualizarEtiqueta(id, textoEdicion.value.trim())
  editandoId.value = null
}

function cancelarEdicion() {
  editandoId.value = null
}
</script>

<template>
  <!-- Overlay -->
  <div class="historico-overlay" @click.self="emit('cerrar')">
    <div class="historico-panel">
      <div class="historico-header d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0 fw-semibold">Aulas recientes</h5>
        <button class="btn-close" @click="emit('cerrar')" />
      </div>

      <!-- Lista vacía -->
      <div v-if="store.historicoAulas.length === 0" class="historico-vacio text-center text-muted py-4">
        <i class="bi bi-clock-history fs-1 d-block mb-2" />
        <span>No hay aulas recientes</span>
      </div>

      <!-- Lista -->
      <ul v-else class="list-unstyled mb-0">
        <li
          v-for="aula in store.historicoAulas"
          :key="aula.id"
          class="historico-item d-flex align-items-center gap-2 py-2"
        >
          <!-- Código (badge, seleccionable) -->
          <span
            class="badge rounded-pill historico-codigo"
            @click="seleccionar(aula.codigo)"
          >
            {{ aula.codigo }}
          </span>

          <!-- Etiqueta o editor inline -->
          <div class="flex-grow-1" @click="iniciarEdicion(aula.id, aula.etiqueta)">
            <template v-if="editandoId === aula.id">
              <input
                v-focus
                class="form-control form-control-sm"
                type="text"
                v-model="textoEdicion"
                maxlength="30"
                @blur="guardarEdicion(aula.id)"
                @keydown.enter="guardarEdicion(aula.id)"
                @keydown.escape="cancelarEdicion"
                @click.stop
              />
            </template>
            <template v-else>
              <span v-if="aula.etiqueta" class="historico-etiqueta">{{ aula.etiqueta }}</span>
              <span v-else class="historico-sin-etiqueta fst-italic text-muted">Sin etiqueta</span>
            </template>
          </div>

          <!-- Borrar -->
          <button
            class="btn btn-sm text-danger p-0"
            style="line-height: 1;"
            @click="store.eliminarDelHistorico(aula.id)"
          >
            <i class="bi bi-trash" />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
// Directiva v-focus para el input de edición
export default {
  directives: {
    focus: {
      mounted(el: HTMLElement) {
        el.focus()
      },
    },
  },
}
</script>

<style scoped>
.historico-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.historico-panel {
  background: white;
  width: 100%;
  border-radius: 16px 16px 0 0;
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.historico-header {
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
}

.historico-item {
  border-bottom: 1px solid #f0f0f0;
}

.historico-item:last-child {
  border-bottom: none;
}

.historico-codigo {
  background: var(--gris);
  color: #333;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  padding: 6px 12px;
  white-space: nowrap;
}

.historico-codigo:hover {
  background: #ccc;
}

.historico-etiqueta {
  font-size: 15px;
  color: #333;
  cursor: pointer;
}

.historico-sin-etiqueta {
  font-size: 15px;
  cursor: pointer;
}

.historico-vacio {
  color: #888;
}
</style>
