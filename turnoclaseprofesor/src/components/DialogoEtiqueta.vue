<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
    <h5 class="fw-bold mb-3">{{ t('etiquetar_aula') }}</h5>
    <div class="mb-4">
      <label class="form-label fw-semibold">{{ t('etiqueta') }}</label>
      <input
        v-model="etiqueta"
        type="text"
        class="form-control"
        maxlength="50"
        placeholder="Ej: 1ºA Matemáticas"
      />
      <div class="form-text">{{ t('introduce_nueva_etiqueta') }}</div>
    </div>
    <div class="d-flex gap-2 justify-content-end">
      <button type="button" class="btn btn-outline-secondary" @click="emit('cancelar')">
        {{ t('cancelar') }}
      </button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="!puedeGuardar"
        @click="emit('guardar', etiqueta)"
      >
        {{ t('guardar') }}
      </button>
    </div>
  </div>
</template>
