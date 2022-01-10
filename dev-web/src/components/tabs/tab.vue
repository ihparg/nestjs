<template>
  <div :style="{ display: show ? 'block' : 'none' }">
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    avariable: {
      type: Boolean,
      default: true,
    },
    id: {
      type: String,
    },
    title: String,
  },
  data() {
    return {
      activeId: null,
    }
  },
  computed: {
    show() {
      return this.$parent.activeId === this.id
    },
  },
  unmounted() {
    this.$parent.refreshActive(this.id)
  },
}
</script>
