"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
let cachedServer;
const FRONTEND_URL = process.env.APP_PUBLIC_URL || 'http://localhost:3000';
const ALLOWED_ORIGIN = FRONTEND_URL.endsWith('/') ? FRONTEND_URL.slice(0, -1) : FRONTEND_URL;
async function createExpressApp(express) {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {});
    app.enableCors({
        origin: ALLOWED_ORIGIN,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Business Man API')
        .setDescription('Minimal API for Business Management')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    await app.init();
    return app.getHttpAdapter().getInstance();
}
module.exports = async (req, res) => {
    if (!cachedServer) {
        const express = await Promise.resolve().then(() => require('express'));
        cachedServer = await createExpressApp(express);
    }
    cachedServer(req, res);
};
if (require.main === module) {
    (async () => {
        const app = await core_1.NestFactory.create(app_module_1.AppModule, {});
        app.enableCors({
            origin: 'http://localhost:3000',
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        });
        app.setGlobalPrefix('api');
        app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
        const port = process.env.PORT ? Number(process.env.PORT) : 4000;
        await app.listen(port);
        console.log(`API running at http://localhost:${port}/api`);
    })();
}
