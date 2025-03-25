<template>
  <div class="card" @mousedown.prevent="onDragStart">
    <div class="cost">{{ card.cost }}</div>
    <div class="stats">
      <span class="atk">{{ card.atk }}</span>
      <span class="hp">{{ card.hp }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  card: Object,
  onDragStart: Function
})
</script>

<style scoped>
.card {
  width: 80px;
  height: 100px;
  border: 1px solid #333;
  position: relative;
  background: #fff;
  cursor: grab;
}
.cost {
  position: absolute;
  top: 4px;
  right: 4px;
  font-weight: bold;
}
.stats {
  position: absolute;
  bottom: 4px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 6px;
}
.atk, .hp {
  font-weight: bold;
}
</style>
