const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlInlineScriptPlugin = require("html-inline-script-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HTMLInlineCSSWebpackPlugin =
  require("html-inline-css-webpack-plugin").default;

const uiHtmlPath = path.resolve(__dirname, "dist", "ui.html");

function readUiHtml() {
  if (!fs.existsSync(uiHtmlPath)) {
    return "<html><body><p>Build UI first.</p></body></html>";
  }
  return fs.readFileSync(uiHtmlPath, "utf8");
}

/** Ensures code.js rebuilds when ui.html changes (for watch mode) */
function addUiHtmlDependencyPlugin() {
  return {
    apply(compiler) {
      compiler.hooks.compilation.tap("AddUiHtmlDependency", (compilation) => {
        compilation.fileDependencies.add(uiHtmlPath);
      });
    },
  };
}

/** @type {import('webpack').Configuration} */
const uiConfig = {
  name: "ui",
  entry: "./src/app/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: false,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: { transpileOnly: true },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.module\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              esModule: false,
              modules: {
                namedExport: false,
                localIdentName: "[local]_[hash:base64:5]",
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.woff2$/,
        type: "asset/inline",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      template: "./src/app/template.html",
      filename: "ui.html",
      inject: "body",
    }),
    new HtmlInlineScriptPlugin(),
    new HTMLInlineCSSWebpackPlugin(),
  ],
};

/** @type {import('webpack').Configuration} */
const codeConfig = {
  name: "code",
  target: ["web", "es2017"],
  entry: "./src/controller/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "code.js",
    clean: false,
    environment: {
      arrowFunction: true,
      const: true,
      destructuring: false,
      forOf: true,
      module: false,
      optionalChaining: false,
      templateLiteral: true,
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
            compilerOptions: {
              target: "ES2017",
            },
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  plugins: [
    new webpack.DefinePlugin({
      __html__: JSON.stringify(readUiHtml()),
    }),
    addUiHtmlDependencyPlugin(),
  ],
};

/**
 * Build order: UI must be built before code (so __html__ gets dist/ui.html).
 * Use: webpack --env target=ui && webpack --env target=code
 * Or: webpack --env target=ui (then) webpack --env target=code --watch
 * @param {{ target?: string }} env
 */
module.exports = (env = {}) => {
  if (env.target === "ui") return [uiConfig];
  if (env.target === "code") return [codeConfig];
  return [uiConfig, codeConfig];
};
