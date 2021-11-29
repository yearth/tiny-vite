<template>
  <div class="app-container">
    <span>{{ count }}</span>
    <button @click="count++">click me</button>
  </div>
</template>

<script>
import { ref } from "vue";
// const __script = {}
export default {
  setup() {
    const count = ref(0);
    return { count };
  }
};
// __script.render = __render
// export default __script
</script>
