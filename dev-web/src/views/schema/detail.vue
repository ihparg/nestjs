<template>
  <List v-if="data" :list="list" :active-id="name" />
  <Content
    v-if="!!name && data"
    :key="name"
    v-model:editable="editable"
    :schemas="data"
    :name="name"
  />

  <v-fab-add
    v-if="!editable"
    to="/schema/0"
    style="position: fixed; left: 23rem; bottom: 1rem; top: auto;"
  />
</template>

<script>
import { mapState, mapActions } from 'vuex'
import List from './list.vue'
import Content from './content.vue'

export default {
  components: {
    Content,
    List,
  },
  data() {
    return {
      editable: this.$route.params.name === '0',
    }
  },
  computed: {
    ...mapState('schema', ['data']),
    name() {
      return this.$route.params.name
    },
    list() {
      return Object.values(this.data).sort((a, b) => a.name.localeCompare(b.name))
    },
  },
  watch: {
    '$route.params.name': function(name) {
      this.editable = name === '0'
    },
  },
  created() {
    this.fetchAll({})
  },
  methods: {
    ...mapActions('schema', ['fetchAll']),
  },
}
</script>

<style lang="scss" scoped>
.add-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
}
</style>
