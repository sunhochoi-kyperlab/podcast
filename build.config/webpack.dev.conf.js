var path = require('path')
var config = require('../config')
var webpack = require('webpack')
var merge = require('webpack-merge')
var utils = require('./utils')
var baseWebpackConfig = require('./webpack.base.conf')
var CopyWebpackPlugin = require('copy-webpack-plugin')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var FriendlyErrors = require('friendly-errors-webpack-plugin')
var iconPath = config.build.orientation === 'landscape' ? './icon/' : './icon/portrait/'

// add hot-reload related code to entry chunks
// Object.keys(baseWebpackConfig.entry).forEach(function (name) {
//   baseWebpackConfig.entry[name] = ['./build/dev-client'].concat(baseWebpackConfig.entry[name])
// })
baseWebpackConfig.entry = ['./build.config/dev-client'].concat(baseWebpackConfig.entry)

module.exports = merge(baseWebpackConfig, {
  module: {
    loaders: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap })
  },
  // eval-source-map is faster for development
  devtool: '#inline-source-map',
  vue: {
    loaders: utils.cssLoaders({
      sourceMap: config.build.cssSourceMap,
      extract: false
    })
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': config.dev.env
    }),
    // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    // https://github.com/ampedandwired/html-webpack-plugin
    new CopyWebpackPlugin([
      { from: './config/config.xml', flatten:true },
      { from: iconPath + '*.png', flatten:true },
      { from: iconPath + '*.jpg', flatten:true },
      { from: iconPath + './icon/*.jpg', flatten:true }
    ]),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      title: config.widget.env.appName,
      inject: true,
      chunksSortMode: 'dependency'
    }),
    new FriendlyErrors(),
    new ExtractTextPlugin(utils.assetsPath('css/[name].[contenthash].css')),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: function (module, count) {
        // any required modules inside node_modules are extracted to vendor
        return (
          module.resource &&
          /\.js$/.test(module.resource) &&
          module.resource.indexOf(
            path.join(__dirname, '../node_modules')
          ) === 0
        )
      }
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      chunks: ['vendor']
    })
  ]
})
