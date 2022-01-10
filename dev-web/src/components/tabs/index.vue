<template>
  <div>
    <div class="tab-headers" :style="headStyle">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        :class="['item', activeId === tab.id && 'active']"
        @click="tabActive(tab.id)"
      >
        {{ tab.title }}
      </div>
    </div>

    <slot />
  </div>
</template>

<script>
export default {
  props: {
    active: String,
    headStyle: Object,
  },
  data() {
    const tabs = this.$slots
      .default()[0]
      .children.map(c => c.props)
      .filter(c => c.avariable)

    const activeId = tabs[0] ? tabs[0].id : this.active

    return {
      activeId,
    }
  },
  computed: {
    tabs() {
      return this.$slots
        .default()[0]
        .children.map(c => c.props)
        .filter(c => c.avariable)
    },
  },
  methods: {
    tabActive(id) {
      this.activeId = id
      this.tabs.forEach(t => {
        t.activeId = id
      })
    },
    refreshActive(id) {
      if (id === this.activeId) {
        this.activeId = this.tabs[0].id
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.tab-headers {
  display: flex;
}

.item {
  position: relative;
  padding: 1rem;
  cursor: pointer;
}

.active {
  color: $brand-primary-color;
  cursor: default;

  &:after {
    content: ' ';
    position: absolute;
    left: 0;
    bottom: 0;
    right: 0;
    height: 0;
    border-bottom: solid 2px $brand-primary-color;
  }
}
</style>
