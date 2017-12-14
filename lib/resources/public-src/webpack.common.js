/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const path = require('path');
//const ExtractTextPlugin = require('extract-text-webpack-plugin');
const webpack = require('webpack');

module.exports = {

    name: 'conga-client-profiler',

    context: path.resolve(__dirname),

    resolve: {
        modules: ['./../../../node_modules']
    },

    entry: {
        'conga-client-profiler': ['./js/profiler.js'],
        'conga-client-profiler-worker': ['./js/profiler-worker.js'],
        'conga-client-profiler-playback': ['./js/playback.js']
    },

    output: {
        filename: '[name].bundle.js',
        path: '/',
        publicPath: '/build/',
        crossOriginLoading: 'anonymous'
    },

    plugins: [
//        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
        //new ExtractTextPlugin('[name].css')
    ]

    // module: {
    //     rules: [
    //         {
    //             test: /\.(css|sass|scss)$/,
    //             use: ExtractTextPlugin.extract({
    //                 fallback: 'style-loader',
    //                 use: [ 'css-loader', 'sass-loader' ]
    //             })
    //         },
    //
    //         {
    //             test: /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
    //             // Limiting the size of the woff fonts breaks font-awesome ONLY for the extract text plugin
    //             // loader: "url?limit=10000"
    //             use: "url-loader"
    //         },
    //         {
    //             test: /\.(ttf|eot|svg)(\?[\s\S]+)?$/,
    //             use: require.resolve("url-loader") + "?name=../[path][name].[ext]"
    //         }
    //
    //     ]
    // }
};

