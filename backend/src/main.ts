import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Use a variable to hold the initialized server instance (for caching/warm starts)
let cachedServer;

// Function to create and initialize the NestJS application
async function createExpressApp(express) {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    // Pass the express instance if needed, though often NestFactory handles it
    // if using Express under the hood (which is the default).
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

// You can optionally keep the local bootstrap function outside the module.exports 
// block for local testing, but make sure it only runs if the file is executed directly.
if (require.main === module) {
  (async () => {
    const app = await NestFactory.create(AppModule, { cors: true });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    // ... Swagger setup again if needed for local development ...

    const port = process.env.PORT ? Number(process.env.PORT) : 4000;
    await app.listen(port);
    // eslint-disable-next-line no-console
    console.log(`API running at http://localhost:${port}/api`);
  })();
}