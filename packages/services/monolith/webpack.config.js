module.exports = function(options) {
    return {
        ...options,
        // We tell Webpack to treat these modules as "external".
        // This means: "Don't try to bundle these files. Just leave a 'require()' statement in the output."
        // Since our code never actually calls the functions that require these (e.g., we don't start a Kafka server),
        // Node.js will never try to load them, so it won't crash at runtime.
        externals: [
            // Keep existing externals (important!)
            ...(Array.isArray(options.externals) ? options.externals : [options.externals]),
            {
                // Mark the unused microservice drivers as external
                '@grpc/grpc-js': 'commonjs @grpc/grpc-js',
                '@grpc/proto-loader': 'commonjs @grpc/proto-loader',
                'kafkajs': 'commonjs kafkajs',
                'mqtt': 'commonjs mqtt',
                'nats': 'commonjs nats',
                'ioredis': 'commonjs ioredis',
                '@nestjs/websockets/socket-module': 'commonjs @nestjs/websockets/socket-module',
            },
        ],
    };
};