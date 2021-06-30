<template>
  <v-loading v-if="!data" />
  <div v-else class="schema-container">
    <v-fab-add to="/schema/0" />

    <div class="schema-list">
      <v-search v-model="filter" style="width: 20rem; margin-bottom: 2rem; padding: 0.5rem 0;" />

      <v-table :data="list" @row-click="handleRowClick">
        <v-table-col title="名称" name="name" />
        <v-table-col title="Tag" name="tag" />
        <v-table-col title="说明" name="description" />
      </v-table>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import fuzzysearch from 'fuzzysearch'

export default {
  data() {
    return {
      filter: '',
    }
  },
  computed: {
    ...mapState('schema', ['data']),
    list() {
      const list = Object.values(this.data).sort((a, b) => a.name.localeCompare(b.name))
      if (this.filter) {
        return list.filter(
          d => fuzzysearch(this.filter, d.tag || '') || fuzzysearch(this.filter, d.name),
        )
      }
      return list
    },
  },
  created() {
    this.$store.dispatch('schema/fetchAll', {})
  },
  methods: {
    handleRowClick(schema) {
      this.$router.push(`/schema/${schema.name}`)
    },
  },
}
</script>

<style lang="scss" scoped>
.schema-container {
  flex: 1;
}

.schema-list {
  padding: 2rem;
  margin: 0 auto;
}
</style>
