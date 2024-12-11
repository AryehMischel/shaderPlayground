const path = require('path');

module.exports = {
  entry: {
    home: './public/index.js',
    dissolveShader: './public/Demos/dissolveShader/index.js',
  },
  output: {
    filename: 'dist/[name].bundle.js', // Generates home.bundle.js, about.bundle.js, etc.
    path: path.resolve(__dirname, 'public'),
  },
  mode: 'development', // Set the mode to 'development' or 'production'
  module: {
    rules: [
      {
        test: /\.glsl$/,
        use: 'raw-loader'
      }
    ]
  }
};