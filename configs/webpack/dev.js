// development config
const { merge } = require("webpack-merge");
const webpack = require("webpack");
const commonConfig = require("./common");

module.exports = ((env) => {
    let filename = './index.tsx';
    if(env.filename) {
        filename = './' + env.filename
    }
    return merge(commonConfig, {
        mode: "development",
        entry: [
            "@babel/polyfill",
            "react-hot-loader/patch", // activate HMR for React
            "webpack-dev-server/client?http://localhost:8100", // bundle the client for webpack-dev-server and connect to the provided endpoint
            "webpack/hot/only-dev-server", // bundle the client for hot reloading, only- means to only hot reload for successful updates
            filename, // the entry point of our app
        ],
        devServer: {
            hot: true, // enable HMR on the server
            port: 8100
        },
        devtool: "cheap-module-source-map",
        plugins: [
            new webpack.HotModuleReplacementPlugin(), // enable HMR globally
        ],
        target: ["web", "es5"],
    })
});
