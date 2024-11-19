'use strict';

const path = require('path');
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin');

module.exports = {
  mode: 'development',
  entry: {
    main: './src/js/main.js', // 主入口
    login: './src/js/login.js', // 独立的 login.js
  },
  output: {
    filename: '[name].js', // 动态生成 main.js 和 login.js
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 8080,
    hot: true,
  },
  stats: {
    warnings: false, // 屏蔽警告
  },
  plugins: [
    // 共享 main.js 和 main.css 的页面
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      chunks: ['main'], // 加载 main.js 和 main.css
    }),
    new HtmlWebpackPlugin({
      template: './src/user.html',
      filename: 'user.html',
      chunks: ['main'], // 加载 main.js 和 main.css
    }),
    new HtmlWebpackPlugin({
      template: './src/train.html',
      filename: 'train.html',
      chunks: ['main'], // 加载 main.js 和 main.css
    }),
    new HtmlWebpackPlugin({
      template: './src/register.html',
      filename: 'register.html',
      chunks: ['login'], // 只加载 login.js
      excludeAssets: [/main\.css/], // 排除 main.css
    }),
    // 独立 login.js 和 login.css 的页面
    new HtmlWebpackPlugin({
      template: './src/login.html',
      filename: 'login.html',
      chunks: ['login'], // 只加载 login.js
      excludeAssets: [/main\.css/], // 排除 main.css
    }),
    // 独立 manage.js 和 manage.css 的页面
    new HtmlWebpackPlugin({
      template: './src/manage.html',
      filename: 'manage.html',
      chunks: ['login'], // 只加载 login.js
      excludeAssets: [/main\.css/], // 排除 main.css
    }),
    // new HtmlWebpackExcludeAssetsPlugin(),
    new HtmlWebpackPlugin({
      template: './src/dataAnalysis.html',
      filename: 'dataAnalysis.html',
      chunks: ['main'], // 加载 main.js 和 main.css
    }),
    new MiniCssExtractPlugin({ filename: '[name].css' }), // 动态生成 main.css 和 login.css
  ],
  module: {
    rules: [
      {
        test: /\.svg$/,
        type: 'asset/resource',
        generator: {
          filename: 'icons/[hash].svg',
        },
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
                plugins: [autoprefixer], // 正确地添加 autoprefixer
              },
            },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'], // 替换 style-loader
      },
    ],
  },
};
