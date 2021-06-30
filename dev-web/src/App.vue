<template>
  <div id="app">
    <div class="header">
      <router-link class="logo" to="/">
        <v-icon name="logo" size="2rem" />
        <span style="font-size: 1.2rem; margin-left: 0.75rem">DEV</span>
      </router-link>

      <div style="flex: 1"></div>
    </div>
    <div class="body">
      <v-nav />
      <router-view></router-view>
    </div>
  </div>
  <ui-snackbar-container ref="message" position="right" />
</template>

<script>
export default {
  name: 'App',
  mounted() {
    this.$message.bind(() => this.$refs.message)
  },
}
</script>

<style lang="scss" scoped>
.header {
  height: 3.5rem;
  background: #212121; //$brand-primary-color;
  display: flex;
  align-items: center;

  .userinfo {
    position: relative;
    padding: 0 2rem;
    height: 3.5rem;
    line-height: 3.5rem;
    color: #ffffff;

    .user-menu {
      position: absolute;
      display: none;
      right: 0;
      top: 100%;
      width: 10rem;
      z-index: 50;
      background: #333333;

      a {
        display: block;
        line-height: 1;
        padding: 1rem 1.5rem;
        color: #aaaaaa;

        &:hover {
          color: #ffffff;
          background: #212121;
        }
      }
    }

    &:hover .user-menu {
      display: block;
    }
  }
}

.logo {
  color: #fff;
  text-decoration: none;
  font-size: 1.4rem;
  margin-left: 0.75rem;

  * {
    vertical-align: middle;
  }

  #wedge {
    fill: $brand-primary-color;
  }
}

.body {
  display: flex;
  position: relative;
  background-color: #f2f2f2;
  min-height: calc(100vh - 3.5rem);
}
</style>
