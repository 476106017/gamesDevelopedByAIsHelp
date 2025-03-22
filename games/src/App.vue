<template>
  <div id="app">
    <router-view />
    <router-link
        v-if="$route.path !== '/'"
        to="/"
        class="home-button"
    > 🏠 ホーム </router-link>
  </div>
</template>

<script setup>
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.home-button {
  position: fixed;
  top: 20px;
  left: 20px;
  background: #ffffffcc;
  color: #333;
  padding: 0.5rem 1rem;
  border: 1px solid #aaa;
  border-radius: 6px;
  font-weight: bold;
  text-decoration: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  z-index: 999;
  transition: 0.2s ease;
}
.home-button:hover {
  background: #fff;
  color: #000;
  transform: scale(1.05);
}

</style>
