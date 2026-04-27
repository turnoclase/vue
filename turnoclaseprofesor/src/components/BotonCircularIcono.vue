<script setup lang="ts">
defineProps<{
  colorFondo: string
  colorIcono: string
  tamanyo?: number
  disabled?: boolean
}>()

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button
    class="boton-circular-icono"
    :style="{
      width: `${tamanyo ?? 72}px`,
      height: `${tamanyo ?? 72}px`,
      backgroundColor: colorFondo,
      color: colorIcono,
    }"
    :disabled="disabled ?? false"
    @click="emit('click')"
  >
    <span class="icono-inner">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.boton-circular-icono {
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  transition: opacity 0.15s;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.boton-circular-icono:active {
  opacity: 0.6;
}

.boton-circular-icono:disabled {
  cursor: default;
}

.icono-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
