'use strict'

const path = require('path')
const autoprefixer = require('autoprefixer')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  mode: 'development',
  entry: './src/js/main.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 8080,
    hot: true,
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html', filename: 'index.html' }),
    new HtmlWebpackPlugin({ template: './src/user.html', filename: 'user.html' }), // 这里添加第二个页面
    new MiniCssExtractPlugin({ filename: 'main.css' }) // CSS提取插件
  ],
  module: {
    rules: [
      {
        test: /\.svg$/,
        type: 'asset/resource',
        generator: {
          filename: 'icons/[hash].svg'
        }
      },
      {
        test: /\.(scss)$/,
        use: [
          MiniCssExtractPlugin.loader, // 替换 style-loader
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  autoprefixer // 这里正确地添加autoprefixer
                ]
              }
            }
          },
          'sass-loader'
        ]
      },
      {
        test: /\.css$/,    
        use: [MiniCssExtractPlugin.loader, 'css-loader'] // 替换 style-loader
      }
    ]
  }
}

