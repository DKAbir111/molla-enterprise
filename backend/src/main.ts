import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

// Cache the server instance for warm starts
let cachedServer;

// Allowed origins
const FRONTEND_URL = process.env.FRONTEND_ORIGIN || process.env.APP_PUBLIC_URL || 'http://localhost:3000';
const ALLOWED_ORIGIN = FRONTEND_URL.endsWith('/') ? FRONTEND_URL.slice(0, -1) : FRONTEND_URL;

// Function to create and initialize the NestJS application
function resolveUploadsDir() {
  const parent = path.resolve(__dirname, '..'); // src in dev, dist in prod
  const isDist = path.basename(parent) === 'dist';
  const backendRoot = isDist ? path.resolve(parent, '..') : parent;
  return path.resolve(backendRoot, 'uploads');
}

function mountUploads(app: NestExpressApplication) {
  const uploadsDir = resolveUploadsDir();
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });
}

async function createExpressApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Enable CORS
  app.enableCors({
    origin: ALLOWED_ORIGIN,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global prefix and pipes
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false
  }));

  mountUploads(app);

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Business Man API')
    .setDescription('API for Business Management')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Initialize the app (DO NOT call app.listen() for Vercel)
  await app.init();

  // Return the Express instance
  return app.getHttpAdapter().getInstance();
}

// Export the handler function for Vercel
module.exports = async (req, res) => {
  if (!cachedServer) {
    cachedServer = await createExpressApp();
  }
  cachedServer(req, res);
};

// Local development bootstrap
if (require.main === module) {
  (async () => {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.enableCors({
      origin: 'http://localhost:3000',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    mountUploads(app);

    const config = new DocumentBuilder()
      .setTitle('Business Man API')
      .setDescription('API for Business Management')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT ? Number(process.env.PORT) : 4000;
    await app.listen(port);
    console.log(`API running at http://localhost:${port}/api`);
    console.log(`Swagger docs at http://localhost:${port}/api/docs`);
  })();
}
