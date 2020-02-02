const PerspectivePlugin = require("@finos/perspective-webpack-plugin");

module.exports = {
    configureWebpack: {
        plugins: [
            new PerspectivePlugin()
        ]
    },
    devServer: {
        host: 'localhost',
        proxy: {
            '/api/*': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                autoRewrite: true,
            },
        },
    },
};
