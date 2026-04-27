<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ valorInicial?: number }>()
const emit = defineEmits<{
  guardar: [tiempo: number]
  cancelar: []
}>()

const tiempos = [0, 1, 2, 3, 5, 10, 15, 20, 30, 45, 60]
const seleccionado = ref(props.valorInicial ?? 5)
</script>

<template>
  <div>
    <h5 class="fw-bold mb-3">Tiempo de espera</h5>
    <p class="text-muted small">Tiempo mínimo que un alumno debe esperar antes de volver a pedir turno.</p>
    <div class="mb-4">
      <label class="form-label fw-semibold">Minutos</label>
      <select v-model="seleccionado" class="form-select">
        <option v-for="t in tiempos" :key="t" :value="t">
          {{ t === 0 ? 'Sin espera' : `${t} minuto${t === 1 ? '' : 's'}` }}
        </option>
      </select>
    </div>
    <div class="d-flex gap-2 justify-content-end">
      <button type="button" class="btn btn-outline-secondary" @click="emit('cancelar')">
        Cancelar
      </button>
      <button type="button" class="btn btn-primary" @click="emit('guardar', seleccionado)">
        Guardar
      </button>
    </div>
  </div>
</template>
