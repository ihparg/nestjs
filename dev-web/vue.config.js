const { resolve } = require('path')

module.exports = {
  devServer: {
    port: 3001,
    proxy: {
      '^/dev': {
        target: 'http://localhost:3009',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  lintOnSave: false,
  // assetsDir: 'dev/public',
  outputDir: '../dist/dev/public',
  publicPath: '/dev/public',
  css: {
    loaderOptions: {
      scss: {
        additionalData: '@use "sass:math";@import "~@/ui/styles/imports.scss";',
      },
    },
  },
  chainWebpack: config => {
    // alias 配置
    config.resolve.alias.set('@', resolve('src'))
    // svg-sprite-loader 配置
    config.module.rules.delete('svg')
    config.module
      .rule('svg-smart')
      .test(/\.svg$/)
      .include.add(resolve('src/assets/svg'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]',
      })
  },
}
