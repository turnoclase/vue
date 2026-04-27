<script setup lang="ts">
defineProps<{
  titulo: string
  colorFondo: string
  colorTexto: string
  tamanyo?: number
  disabled?: boolean
}>()

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button
    class="boton-circular"
    :style="{
      width: `${tamanyo ?? 72}px`,
      height: `${tamanyo ?? 72}px`,
      backgroundColor: colorFondo,
      color: colorTexto,
    }"
    :disabled="disabled ?? false"
    @click="emit('click')"
  >
    {{ titulo }}
  </button>
</template>

<style scoped>
.boton-circular {
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  padding: 4px;
  text-align: center;
  line-height: 1.1;
  transition: opacity 0.15s;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.boton-circular:active {
  opacity: 0.6;
}

.boton-circular:disabled {
  cursor: default;
}
</style>
