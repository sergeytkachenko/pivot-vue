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
                target: 'http://192.168.2.100:3000',
                changeOrigin: true,
                autoRewrite: true,
            },
        },
    },
};
