// postcss.config.js
// module.exports = {
//     plugins: {
//         tailwindcss: {},
//         autoprefixer: {},
//     },
// }

// // postcss.config.js
const isProduction = process.env.NODE_ENV === 'production';
const purgecss = require('@fullhuman/postcss-purgecss');  // 추가
module.exports = {
    plugins: [
        require('postcss-import'),
        require('tailwindcss'),
        // 아래 추가
        /*isProduction ? purgecss({
            content: ['./src/!**!/!*.{js,jsx,ts,tsx}', './dist/index.html'],
            extractors: [
                {
                    extractor: content => content.match(/[A-z0-9-:\/]+/g),
                    extensions: ["html", "js", "jsx", "ts", "tsx"]
                }
            ]
        }) : false,*/
        require('autoprefixer')({ grid : false }),
        isProduction ? require('cssnano')({ preset: 'default' }) : false,
    ]
}
