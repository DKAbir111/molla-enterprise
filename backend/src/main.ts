import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Use a variable to hold the initialized server instance (for caching/warm starts)
let cachedServer;

// --- Define the allowed origin based on environment ---
// Use APP_PUBLIC_URL from Vercel environment variables for production.
const FRONTEND_URL = process.env.APP_PUBLIC_URL || 'http://localhost:3000';
// Strip trailing slash if present for cleaner origin matching.
const ALLOWED_ORIGIN = FRONTEND_URL.endsWith('/') ? FRONTEND_URL.slice(0, -1) : FRONTEND_URL;


// Function to create and initialize the NestJS application
async function createExpressApp(express) {
  // 1. Remove CORS config from NestFactory.create()
  const app = await NestFactory.create(AppModule, {
    // ❌ REMOVED: cors: true,
  });

  // 2. Add app.enableCors() explicitly for reliable header setting
  app.enableCors({
    origin: ALLOWED_ORIGIN, // Only allows your Vercel frontend domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    // VITAL: Explicitly allow headers used for JSON and Authentication
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger setup remains the same
  const config = new DocumentBuilder()
    .setTitle('Business Man API')
    .setDescription('Minimal API for Business Management')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Initialize the app but DO NOT call app.listen()
  await app.init();

  // Return the underlying HTTP adapter instance (the Express app handler)
  return app.getHttpAdapter().getInstance();
}

// Export the handler function Vercel expects
module.exports = async (req, res) => {
  if (!cachedServer) {
    // Lazy load the framework adapter (Express)
    const express = await import('express');
    cachedServer = await createExpressApp(express);
  }
  // Let the Express app handle the request
  cachedServer(req, res);
};

// Local bootstrap function (modified to use explicit enableCors for consistency)
if (require.main === module) {
  (async () => {
    // 1. Remove CORS config from NestFactory.create()
    const app = await NestFactory.create(AppModule, {
      // ❌ REMOVED: cors: true
    });

    // 2. Add app.enableCors() for local development
    app.enableCors({
      origin: 'http://localhost:3000', // Default local dev URL
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    // ... Swagger setup remains the same ...

    const port = process.env.PORT ? Number(process.env.PORT) : 4000;
    await app.listen(port);
    // eslint-disable-next-line no-console
    console.log(`API running at http://localhost:${port}/api`);
  })();
}