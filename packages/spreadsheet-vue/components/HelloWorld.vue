<script  lang="ts">
import { ref, defineComponent, PropType } from 'vue'

export default defineComponent({
  props: {
    msg: {
      type: String,
      default: ''
    },
    color: {
      type: String as PropType<'blue' | 'red'>,
      default: ''
    }
  },
  setup() {
    const count = ref(0)
    return { count }
  }
})
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
