// shared config (dev and prod)
const { resolve } = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
	resolve: {
		extensions: [".js", ".jsx", ".ts", ".tsx"],
		alias: {
			'react-dom': '@hot-loader/react-dom',
		},
	},
	context: resolve(__dirname, "../../src"),
	module: {
		rules: [
			{
				test: [/\.jsx?$/, /\.tsx?$/],
				use: ["babel-loader"],
				exclude: /node_modules/,
			},
			{
				test: /\.(js|jsx|tsx|ts)?$/,
				include: /node_modules/,
				use: ['react-hot-loader/webpack'],
			},
			// {
			// 	test: /\.p?css$/,
			// 	use: [
			// 		{loader: "style-loader"},
			// 		{loader: "css-loader"},
			// 		{loader: "postcss-loader"}
			// 	],
			// },
			// {
			// 	test: /\.(scss|sass)$/,
			// 	use: ["style-loader", "css-loader", "sass-loader"],
			// },
			{
				test: /\.p?css$/,
				use: [
					{loader: "style-loader"},
					{
						loader: "css-loader",
						options: {
							sourceMap: true,
						}
					},
					{loader: "postcss-loader"},
				],
			},
			{
				// test: /\.(scss|sass)$/,
				test: /\.s[ac]ss$/i,
				use: [
					"style-loader",
					{
						loader: "css-loader",
						options: {
							sourceMap: true,
						},
					},
					'postcss-loader',
					{
						loader: "sass-loader",
						options: {
							sourceMap: true,
						},
					},
				],
			},
			{
				test: /\.(jpe?g|png|gif|svg)$/i,
				use: [
					"file-loader?hash=sha512&digest=hex&name=img/[contenthash].[ext]",
					"image-webpack-loader?bypassOnDebug&optipng.optimizationLevel=7&gifsicle.interlaced=false",
				],
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({ template: "index.html.ejs" }),
	],
	externals: {
		react: "React",
		"react-dom": "ReactDOM",
	},
	performance: {
		hints: false,
	},
};
