<template>
  <div class="list">
    <v-search v-model="filter" />
    <div class="inner">
      <router-link
        v-for="r in filterList"
        :key="r.id"
        :class="['item', activeId === r.id ? 'active' : '']"
        :to="`/route/${r.id}`"
      >
        <div class="title">{{ r.title }}</div>
        <div class="path">
          {{ getFullPath(r) }}
        </div>
        <span v-if="r.module" class="module" @click.stop.prevent="moduleClick(r.module)">
          {{ r.module }}
        </span>
      </router-link>
    </div>
  </div>
</template>

<script>
import fuzzysearch from 'fuzzysearch'
import { getFullPath } from '@/utils/route'

export default {
  props: {
    activeId: String,
    apiPrefix: String,
    list: Array,
  },
  data() {
    return {
      filter: '',
    }
  },
  computed: {
    filterList() {
      const { filter } = this
      if (filter) {
        return this.list.filter(
          d => d.module === filter || fuzzysearch(filter, d.title + this.getFullPath(d)),
        )
      }
      return this.list
    },
  },
  methods: {
    moduleClick(module) {
      this.filter = module
    },
    getFullPath(value) {
      return getFullPath(value, this.apiPrefix)
    },
  },
}
</script>

<style lang="scss" scoped>
.list {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 20rem;
  height: calc(100vh - 3.5rem);

  &::after {
    content: ' ';
    height: 100%;
    width: 0;
    border-right: solid 1px rgba(0, 0, 0, 0.1);
    position: absolute;
    right: 0;
    top: 0;
  }
}

.inner {
  flex: 1;
  overflow: auto;
}

.item {
  position: relative;
  display: block;
  padding: 1rem;
  cursor: pointer;
  border-bottom: solid 1px rgba(0, 0, 0, 0.05);
  align-items: center;

  .module {
    position: absolute;
    right: 1rem;
    top: 0.5rem;
    font-size: 0.85rem;
    line-height: 1rem;
    text-align: right;
    color: $brand-primary-color;
  }

  .method {
    // transform: scale(0.8);
    padding: 2px;
    border-radius: 0.5rem;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.item.active {
  background: $brand-primary-color;
  color: #fff;

  .path,
  .module {
    color: #fff;
  }
}

.title {
  display: flex;
  align-items: center;

  span {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 8px;
    border-radius: 4px;
    background: #333333;
  }

  .status-1 {
    background: #ff9800;
  }

  .status-2 {
    background: #4caf50;
  }
}

.path {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  height: 1rem;
  color: #777;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
