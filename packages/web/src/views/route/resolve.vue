<template>
  <div ref="container" class="resolve" :class="classes" @click="open">
    <div class="label">调用函数</div>
    <div class="value">{{ value }}</div>
    <div v-if="!!error" class="feedback">{{ error }}</div>
    <div v-if="isRender" class="panel">
      <v-loading v-if="refreshing" />
      <div v-else class="panel-inner">
        <div v-if="funcs" class="func list">
          <v-search v-model="funcFilter" class="search" />
          <a v-for="f in funcs" :key="f" :class="{ active: f === func }" @click="funcChange(f)">
            {{ f }}
          </a>
        </div>
      </div>
      <div class="footer">
        <a @click="forceRefresh">
          <v-icon name="refresh" size="1rem" />
          刷新
        </a>
      </div>
    </div>
  </div>
  <div v-if="focused" class="overlay" @click="close"></div>
</template>

<script>
import fuzzysearch from 'fuzzysearch'
import fetch from '@/utils/fetch'

export default {
  inheritAttrs: false,
  props: {
    disabled: Boolean,
    resolves: Object,
    value: String,
    error: String,
    invalid: Boolean,
  },
  emits: ['input'],
  data() {
    // eslint-disable-next-line prefer-const
    let [type, func, version] = (this.value || '').split(/[:@]/)
    const graphqlDisabled = type[0] === '*'
    if (graphqlDisabled) type = type.substr(1)

    const types = Object.keys(this.resolves)
    if (!this.value && types.length === 1) {
      // eslint-disable-next-line prefer-destructuring
      type = types[0]
    }

    return {
      funcFilter: '',
      focused: false,
      isRender: false,
      type,
      types,
      func,
      version,
      refreshing: false,
      graphqlDisabled,
    }
  },
  computed: {
    funcs() {
      return this.resolves.filter(f => fuzzysearch(this.funcFilter, f)).sort()
    },
    formatValue() {
      const value = [this.graphqlDisabled ? '*' : '', this.func].join('')
      return value
    },
    classes() {
      return {
        focused: this.focused,
        disabled: this.disabled,
        'is-invalid': this.invalid,
      }
    },
  },
  methods: {
    close() {
      this.focused = false
    },
    open() {
      if (this.disabled) return
      this.focused = true
      this.isRender = true
    },
    setValue() {
      setTimeout(() => {
        this.close()
        this.$emit('input', this.formatValue)
      }, 100)
    },
    funcChange(func) {
      this.func = func
      this.setValue()
    },
    graphqlToggle(event) {
      if (this.graphqlDisabled === event) return
      this.graphqlDisabled = event
      if (this.func) this.setValue()
    },
    forceRefresh() {
      this.refreshing = true
      fetch.get(`/dev/resolve/list?force=true`).then(res => {
        this.$store.commit('route/SET_RESOLVES', res)
        this.refreshing = false
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.resolve {
  position: relative;
  margin-left: 1rem;
  width: 20rem;

  &:hover:not(.disabled) {
    .label {
      color: $ui-input-label-color--hover;
    }
    .value {
      border-bottom-color: $ui-input-label-color--hover;
    }
  }

  &.focused:not(.disabled) {
    .label {
      color: $ui-input-label-color--active;
    }
    .value {
      border-bottom-color: $ui-input-border-color--active;
      border-bottom-width: $ui-input-border-width--active;
    }
    .panel {
      display: block;
    }
  }
}

.label {
  color: rgba(0, 0, 0, 0.54);
  cursor: default;
  font-size: 0.9375rem;
  line-height: normal;
  margin-bottom: 0;
  transform-origin: left;
  transition: color 0.1s ease, transform 0.2s ease;

  &:after {
    content: '*';
    margin-left: 0.5rem;
    color: $md-red-700;
  }
}

.disabled .label:after {
  display: none;
}

.is-invalid,
.is-invalid.focused:not(.disabled),
.is-invalid:hover:not(.disabled) {
  .feedback,
  .label {
    color: $ui-input-label-color--invalid;
  }
  .value {
    border-bottom-color: $ui-input-label-color--invalid;
  }
}

.feedback {
  color: $ui-input-feedback-color;
  font-size: $ui-input-feedback-font-size;
  line-height: $ui-input-feedback-line-height;
  margin: 0;
  padding-top: $ui-input-feedback-padding-top;
  position: relative;
}

.value {
  height: 2rem;
  line-height: 1;
  align-items: center;
  border: none;
  border-bottom: solid 1px rgba(0, 0, 0, 0.12);
  color: rgba(0, 0, 0, 0.87);
  cursor: pointer;
  display: flex;
  font-family: inherit;
  font-size: 1rem;
  font-weight: normal;
  min-height: 2rem;
  padding: 0;
  transition: border 0.1s ease;
  user-select: none;
  width: 100%;
}

.disabled .value {
  cursor: default;
  border-bottom-style: dotted;
  border-bottom-width: 2px;
}

.panel {
  position: absolute;
  display: none;
  right: 0;
  width: 40rem;
  height: 19rem;
  background: #fff;
  z-index: 100;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14),
    0 1px 10px 0 rgba(0, 0, 0, 0.12);
}

.overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 99;
  background: rgba(0, 0, 0, 0.01);
}

.list {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-right: solid 1px #eee;

  &:hover {
    overflow-y: auto;
  }

  a {
    cursor: pointer;
    display: block;
    padding: 4px 8px;
  }

  .active {
    color: #fff;
    background: $brand-primary-color;
  }
}

.panel-inner {
  display: flex;
  height: 16rem;
}

.footer {
  display: flex;
  position: absolute;
  height: 3rem;
  left: 0;
  right: 0;
  bottom: 0;
  border-top: 1px solid #eee;
  line-height: 3rem;
  padding: 0 1rem;

  a {
    cursor: pointer;
  }
}

.type {
  width: 8rem;
}

.func {
  flex: 1;
}

.search {
  position: sticky;
  top: 0;
  padding: 4px 8px;
  background: #ffffff;
}

.version {
  width: 8rem;
}
</style>
