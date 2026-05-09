<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const emit = defineEmits<{
  conectar: [codigo: string, pin: string]
  cancelar: []
}>()

const codigo = ref('')
const pin = ref('')

const puedeConectar = computed(() => codigo.value.length >= 5 && pin.value.length >= 4)

function onCodigoInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  codigo.value = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)
}

function onPinInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  pin.value = val.replace(/\D/g, '').slice(0, 4)
}

function conectar() {
  if (puedeConectar.value) {
    emit('conectar', codigo.value, pin.value)
  }
}
</script>

<template>
  <div>
    <h5 class="fw-bold mb-3">{{ t('conectar_a_otra_aula') }}</h5>
    <p class="text-muted small mb-3">{{ t('introduce_datos_aula') }}</p>
    <div class="mb-3">
      <label class="form-label fw-semibold">{{ t('codigo_de_aula') }}</label>
      <input
        type="text"
        class="form-control text-uppercase"
        :value="codigo"
        maxlength="5"
        placeholder="Ej: AB12C"
        @input="onCodigoInput"
      />
    </div>
    <div class="mb-4">
      <label class="form-label fw-semibold">{{ t('pin') }}</label>
      <input
        type="text"
        inputmode="numeric"
        class="form-control"
        :value="pin"
        maxlength="4"
        placeholder="1234"
        @input="onPinInput"
      />
    </div>
    <div class="d-flex gap-2 justify-content-end">
      <button type="button" class="btn btn-outline-secondary" @click="emit('cancelar')">
        {{ t('cancelar') }}
      </button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="!puedeConectar"
        @click="conectar"
      >
        {{ t('conectar') }}
      </button>
    </div>
  </div>
</template>
