<template>
  <div id="app">
    <Pivot />
  </div>
</template>

<script>
  import Pivot from './components/Pivot.vue'

  export default {
    name: 'app',
    components: {
      Pivot
    }
  }
</script>

<style>
  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
  }
</style>
