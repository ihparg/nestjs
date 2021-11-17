<template>
  <v-loading v-if="!isReady" />
  <template v-else>
    <List :list="routes" :active-id="rid" :api-prefix="routeConfig.prefix" />
    <Content
      :key="rid"
      v-model:editable="editable"
      :routes="routes"
      :route="route"
      :schemas="schemas"
      :rid="rid"
      :api-prefix="routeConfig.prefix"
    />
    <v-fab-add
      v-if="!editable"
      :to="`/route/0`"
      style="position: fixed; left: 19rem; bottom: 1rem; top: auto;"
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
    ...mapState('route', { routeConfig: 'config' }),
    route() {
      if (this.rid === '0') return {}
      return this.routes.find(r => r.id === this.rid)
    },
    rid() {
      return this.$route.params.rid
    },
    isReady() {
      return this.routes && this.schemas && this.routeConfig
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
    this.fetchConfig()
  },
  methods: {
    ...mapActions('route', { fetchRoutes: 'fetchList', fetchConfig: 'fetchConfig' }),
    ...mapActions('schema', { fetchSchemas: 'fetchAll' }),
  },
}
</script>
