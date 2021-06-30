<template>
  <v-loading v-if="!isReady" />
  <template v-else>
    <List :list="routes" :active-id="rid" />
    <Content
      :key="rid"
      v-model:editable="editable"
      :routes="routes"
      :route="route"
      :schemas="schemas"
      :rid="rid"
    />
    <v-fab-add
      v-if="!editable"
      :to="`/route/0`"
      style="position: fixed; left: 23rem; bottom: 1rem; top: auto;"
    />
  </template>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import Content from './content.vue'
import List from './list.vue'

export default {
  components: {
    Content,
    List,
  },
  data() {
    return {
      devServer: null,
      editable: this.$route.params.rid === '0',
    }
  },
  computed: {
    ...mapGetters('route', { routes: 'sortedRoutes' }),
    ...mapState('schema', { schemas: 'data' }),
    route() {
      if (this.rid === '0') return {}
      return this.routes.find(r => r.id === this.rid)
    },
    rid() {
      return this.$route.params.rid
    },
    isReady() {
      return this.routes && this.schemas
    },
  },
  watch: {
    '$route.params.rid': function(rid) {
      this.editable = rid === '0'
    },
  },
  created() {
    this.fetchRoutes()
    this.fetchSchemas()
  },
  methods: {
    ...mapActions('route', { fetchRoutes: 'fetchList' }),
    ...mapActions('schema', { fetchSchemas: 'fetchAll' }),
  },
}
</script>
