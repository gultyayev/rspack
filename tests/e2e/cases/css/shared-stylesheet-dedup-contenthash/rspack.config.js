const { rspack } = require('@rspack/core');

/** @type { import('@rspack/core').RspackOptions } */
module.exports = {
  context: __dirname,
  mode: 'development',
  entry: {
    main: ['./src/index.css', './src/index.js'],
  },
  devServer: {
    hot: true,
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './src/index.html',
      inject: 'body',
    }),
    // Like shared-stylesheet-dedup, splitChunks hoists the CSS into one shared `style`
    // chunk that the hot update lists alongside `main`. Unlike that case the filename is
    // content-hashed, so the stylesheet href changes on every edit - the combination
    // (a shared stylesheet + a hashed, per-update-changing filename + repeated edits)
    // that the plain contenthash-hmr and shared-stylesheet-dedup cases don't cover
    // together. See rspack#14793 / #6869.
    new rspack.CssExtractRspackPlugin({
      filename: '[name].[contenthash:8].css',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        type: 'javascript/auto',
        use: [rspack.CssExtractRspackPlugin.loader, 'css-loader'],
      },
    ],
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        style: {
          name: 'style',
          test: /\.css$/,
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },
};
