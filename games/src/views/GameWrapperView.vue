<template>
  <div v-if="GameComponent">
    <component :is="GameComponent" />
  </div>
  <div v-else>
    <p>ゲーム「{{ gameName }}」が見つかりませんでした。</p>
  </div>
</template>

<script setup>
import { ref, defineAsyncComponent, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const gameName = route.params.name
const GameComponent = ref(null)

onMounted(async () => {
  try {
    GameComponent.value = defineAsyncComponent(() =>
        import(`../games/${gameName}/Game.vue`)
    )
  } catch (error) {
    console.error(`ゲーム「${gameName}」の読み込みに失敗しました`, error)
  }
})
</script>

<style scoped>
p {
  text-align: center;
  font-size: 1.2rem;
  margin-top: 2rem;
}
</style>
