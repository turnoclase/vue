<script setup lang="ts">
defineProps<{
  color?: string
  tamanyo?: number
}>()
</script>

<template>
  <div class="animacion-puntos">
    <span
      v-for="i in 3"
      :key="i"
      class="punto"
      :style="{
        width: `${tamanyo ?? 14}px`,
        height: `${tamanyo ?? 14}px`,
        backgroundColor: color ?? '#000',
        animationDelay: `${(i - 1) * 0.18}s`,
      }"
    />
  </div>
</template>

<style scoped>
.animacion-puntos {
  display: flex;
  align-items: center;
  gap: 8px;
}

.punto {
  border-radius: 50%;
  animation: bote 0.72s ease-in-out infinite;
}

@keyframes bote {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
