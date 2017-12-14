/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const webpack = require('webpack');
const Merge = require('webpack-merge');
const CommonConfig = require('./webpack.common.js');

//const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = Merge(CommonConfig, {

  output: {
      filename: '[name].[chunkhash].bundle.js',
      path: '/',
      crossOriginLoading: 'anonymous'
  },



  plugins: [

    //new ExtractTextPlugin('[name].[chunkhash].css'),

    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: true
    }),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      beautify: false,
      mangle: {
        screw_ie8: true,
        keep_fnames: true
      },
      compress: {
        screw_ie8: true
      },
      comments: false,
      debug: true
    })
  ]
});
