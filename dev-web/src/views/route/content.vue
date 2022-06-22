<template>
  <div v-if="value === undefined">
    <v-not-found />
  </div>
  <div v-else class="route-content">
    <v-loading v-if="value.$undone" />
    <v-form v-else :key="editable" ref="form" :data="value" :disabled="!editable">
      <div class="form">
        <div style="display: flex;">
          <v-input
            name="method"
            label="Method"
            required
            type="select"
            style="width: 8rem; margin-right: 1rem;"
            default-value="GET"
            :options="['GET', 'POST', 'PUT', 'DELETE']"
          />

          <template v-if="editable">
            <div class="api-prefix">{{ apiPrefix }}</div>

            <v-input
              name="module"
              label="Module"
              type="autocomplete"
              :suggestions="groups"
              default-value=""
              style="flex: 1; margin-right: 0.5rem;"
              help="可选"
            />

            <div class="api-prefix"></div>

            <v-input
              name="controller"
              label="Controller"
              required
              :bind="['path']"
              :rules="[rule.required, rule.path]"
              style="flex: 1; margin-right: 0.5rem;"
            />

            <div class="api-prefix"></div>

            <v-input
              name="path"
              label="路径"
              required
              :rules="[rule.required, rule.path, rule.pathExist]"
              style="flex: 2;"
              help="格式为 /{path:可选}/{method}"
              default-value=""
              @input="pathChange"
            />
          </template>
          <div v-else class="full-path">
            <div class="label">路径</div>
            <div class="path">{{ fullPath }}</div>
          </div>

          <v-input
            required
            label="Service.Method"
            :rules="[rule.required]"
            :suggestions="resolves"
            name="resolve"
            type="autocomplete"
            style="flex: 2; margin-left: 1rem;"
          />
        </div>

        <v-input name="title" label="接口描述" :rules="[rule.required]" required />

        <v-tabs v-for="(tab, i) in tabs" :key="i" style="margin-bottom: 1rem;">
          <v-tab
            v-for="(opt, name) in tab"
            :id="name"
            :key="name"
            :title="`${opt.title}(${propertiesLength[name]})`"
            :avariable="editable || propertiesLength[name] > 0"
          >
            <v-input
              :name="name"
              :schemas="schemas"
              :allow-dash="opt.allowDash"
              :type="opt.type || 'route-fields'"
              :default-value="{ type: 'object', properties: {} }"
            />
          </v-tab>
        </v-tabs>
      </div>

      <div class="foot">
        <template v-if="editable">
          <v-submit :loading="sending" @submit="handleSave">
            保存
          </v-submit>

          <ui-button
            v-if="rid !== '0'"
            button-type="button"
            :disabled="sending"
            @click="setEditable(false)"
          >
            取消
          </ui-button>

          <ui-button v-if="rid !== '0'" class="btn-remove" :disabled="sending">
            删除
            <v-confirm v-if="!sending" @confirm="handleRemove">
              确定删除?
            </v-confirm>
          </ui-button>
        </template>
        <template v-else>
          <ui-button :disabled="sending" button-type="button" @click="setEditable(true)">
            编辑
          </ui-button>
        </template>
      </div>
    </v-form>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Rule from '@/utils/rule'
import { getRouteParamsKeys, getAllRefs, getFullPath, getFunctionName } from '@/utils/route'
import { fastClone } from '@/utils/clone'
import fetch from '@/utils/fetch'
import { registerInput } from '@/components/form'
import Fields from './fields.vue'
import Params from './params.vue'

registerInput('route-fields', Fields)
registerInput('route-params', Params)

export default {
  props: {
    apiPrefix: String,
    editable: Boolean,
    rid: String,
    route: Object,
    routes: Object,
    schemas: Object,
  },
  emits: ['update:editable'],
  data() {
    const groups = {}
    const { rid } = this
    const existedPath = {}
    this.routes.forEach(r => {
      if (r.module) groups[r.module] = true
      if (rid !== r.id) existedPath[this.getFullPath(r)] = true
    })

    return {
      sending: false,
      errors: {},
      existedPath,
      resolves: [],
      groups: Object.keys(groups),
      rule: Rule({
        pathExist: (value, f, callback) => {
          const fullPath = this.getFullPath(f)

          if (this.existedPath[fullPath]) callback(new Error('路径已存在'))
          else callback(true)
        },
        path: { regExp: '^[A-Za-z0-9-_/]+$', message: '路径格式不正确' },
      }),
      value: fastClone(this.route),
    }
  },
  computed: {
    // ...mapState('route', ['resolves']),
    ...mapGetters('schema', ['flattenedSchemas']),
    propertiesLength() {
      const length = {}
      ;[
        'requestBody',
        'routeParams',
        'queryString',
        'requestHeaders',
        'responseBody',
        'responseHeaders',
      ].forEach(key => {
        if (this.value[key]) {
          length[key] = this.value[key].properties
            ? Object.keys(this.value[key].properties).length
            : 1
        } else {
          length[key] = 0
        }
      })
      return length
    },
    prefix() {
      const { module } = this.value
      return `${this.apiPrefix ? this.apiPrefix : ''}${module ? `/${module}` : ''}`
    },
    fullPath() {
      return this.getFullPath(this.value).split(':')[1]
    },
    tabs() {
      const tabs = {
        request: {
          requestBody: { title: 'REQUEST BODY' },
          queryString: { title: 'QUERY STRING' },
          requestHeaders: { title: 'REQUEST HEADERS', allowDash: true },
        },
        response: {
          responseBody: { title: 'RESPONSE BODY' },
          responseHeaders: { title: 'RESPONSE HEADERS', allowDash: true },
        },
      }

      if (!this.value.method || this.value.method === 'GET') {
        delete tabs.request.requestBody
      } else {
        delete tabs.request.queryString
      }

      return tabs
    },
  },
  watch: {
    editable(val) {
      if (val === false) this.value = this.cloneRoute()
    },
    routes() {
      this.value = this.cloneRoute()
    },
  },
  created() {
    fetch.get(`/dev/resolve/list?force=true`).then(res => {
      res.forEach(r => this.resolves.push(r))
    })
  },
  methods: {
    checkRefs() {
      const allRefs = getAllRefs(this.value)
      const refs = {}
      for (let i = 0; i < allRefs.length; i++) {
        const ref = allRefs[i]
        // refs 只收集第一层Schema Id
        const { id } = this.schemas[ref.split('.')[0]]
        refs[id] = true

        if (!(ref in this.flattenedSchemas)) {
          this.$message.error(`找不到引用字段${ref}，请检查后再提交`)
          return null
        }
      }

      return refs
    },
    handleSave(data) {
      const refs = this.checkRefs()
      if (!refs) return

      this.sending = true
      data.refs = Object.keys(refs)
      fetch
        .post(`/dev/route/save`, data)
        .then(res => {
          this.$message.show('保存成功')
          this.$store.commit('route/SET_ROUTE', res)
          if (!data.id) this.$router.push(`/route/${res.id}`)
          else this.$emit('update:editable', false)
        })
        .finally(() => {
          this.sending = false
        })
    },
    setEditable(editable) {
      this.$emit('update:editable', editable)
    },
    cloneRoute() {
      return fastClone(this.route)
    },
    pathChange(path) {
      const properties = this.value.routeParams ? this.value.routeParams.properties : {}
      const newProps = {}
      const keys = getRouteParamsKeys(path)
      keys.forEach(key => {
        newProps[key] = properties[key] || { type: 'string' }
      })
      this.value.routeParams = { type: 'object', properties: newProps }
      this.value.resolve = getFunctionName(path)
    },
    getFullPath(value) {
      return getFullPath(value, this.apiPrefix)
    },
    handleRemove() {
      this.sending = true
      fetch
        .delete(`/dev/route`, { id: this.rid })
        .then(() => {
          this.$router.push(`/route`)
          setTimeout(() => {
            this.$store.commit('route/REMOVE', this.rid)
          })
        })
        .finally(() => {
          this.sending = false
        })
    },
  },
}
</script>

<style lang="scss" scoped>
.route-content {
  flex: 1;
  position: relative;
  height: calc(100vh - 3.5rem);
  overflow: auto;
}

.form {
  min-height: calc(100vh - 7.5rem);
  padding: 2rem;
}

.api-prefix {
  padding-top: 1.8rem;
  font-size: 0.875rem;
  margin-right: 4px;

  &::after {
    content: ' /';
  }
}

.full-path {
  flex: 2;
  margin-bottom: 1rem;

  .label {
    color: rgba(0, 0, 0, 0.54);
  }

  .path {
    height: 2rem;
    line-height: 2rem;
    border-bottom: dotted 2px rgba(0, 0, 0, 0.12);
  }
}

.foot {
  position: sticky;
  bottom: 0;
  padding: 1rem 2rem;
  height: 4rem;
  background: #f2f2f2;
  box-shadow: $box-shadow;

  button + button {
    margin-left: 1rem;
  }

  .btn-remove {
    float: right;
  }
}
</style>

<style lang="scss">
.route-content {
  .ui-autocomplete.is-disabled .ui-autocomplete__input,
  .ui-textbox.is-disabled .ui-textbox__input,
  .ui-select.is-disabled .ui-select__display {
    color: #000;
  }
}
</style>
