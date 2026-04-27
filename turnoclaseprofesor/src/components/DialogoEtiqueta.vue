<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{ valorInicial?: string }>()
const emit = defineEmits<{
  guardar: [etiqueta: string]
  cancelar: []
}>()

const etiqueta = ref(props.valorInicial ?? '')

const puedeGuardar = computed(
  () => etiqueta.value.trim().length >= 3 || etiqueta.value.trim().length === 0,
)
</script>

<template>
  <div>
    <h5 class="fw-bold mb-3">Etiquetar aula</h5>
    <div class="mb-4">
      <label class="form-label fw-semibold">Etiqueta <span class="text-muted fw-normal">(opcional)</span></label>
      <input
        v-model="etiqueta"
        type="text"
        class="form-control"
        maxlength="50"
        placeholder="Ej: 1ºA Matemáticas"
      />
      <div class="form-text">Deja en blanco para quitar la etiqueta. Mínimo 3 caracteres si escribes algo.</div>
    </div>
    <div class="d-flex gap-2 justify-content-end">
      <button type="button" class="btn btn-outline-secondary" @click="emit('cancelar')">
        Cancelar
      </button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="!puedeGuardar"
        @click="emit('guardar', etiqueta)"
      >
        Guardar
      </button>
    </div>
  </div>
</template>
