// production config
const {merge} = require("webpack-merge");
const {resolve} = require("path");

const commonConfig = require("./common");
module.exports = ((env) => {
	let filename = './index.tsx';
    let buildName = 'index';
	if(env.filename) {
		filename = './' + env.filename
        buildName = env.filename.replace('.tsx', '')
	}
    return merge(commonConfig, {
        mode: "production",
        entry: filename,
        output: {
            // filename: "js/bundle.[contenthash].min.js",
            filename: "js/"+ buildName + ".min.js",
            path: resolve(__dirname, "../../dist"),
            publicPath: "/",
        },
        devtool: "source-map",
        plugins: [],
		target: ["web", "es5"],
    });
});
