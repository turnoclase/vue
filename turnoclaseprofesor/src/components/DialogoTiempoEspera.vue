<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
    <h5 class="fw-bold mb-3">{{ t('establecer_tiempo_de_espera') }}</h5>
    <p class="text-muted small">Tiempo mínimo que un alumno debe esperar antes de volver a pedir turno.</p>
    <div class="mb-4">
      <label class="form-label fw-semibold">{{ t('tiempo_de_espera_minutos') }}</label>
      <select v-model="seleccionado" class="form-select">
        <option v-for="mins in tiempos" :key="mins" :value="mins">
          {{ mins === 0 ? t('sin_espera') : t('minutos', { n: mins }) }}
        </option>
      </select>
    </div>
    <div class="d-flex gap-2 justify-content-end">
      <button type="button" class="btn btn-outline-secondary" @click="emit('cancelar')">
        {{ t('cancelar') }}
      </button>
      <button type="button" class="btn btn-primary" @click="emit('guardar', seleccionado)">
        {{ t('guardar') }}
      </button>
    </div>
  </div>
</template>
