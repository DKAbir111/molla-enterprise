import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

// Cache the server instance for warm starts
let cachedServer;

// Allowed origins. FRONTEND_ORIGIN accepts a comma-separated list so a dev box
// can serve both http://localhost:3000 and its LAN address at the same time.
const FRONTEND_URL = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const ALLOWED_ORIGINS = FRONTEND_URL.split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);
const ALLOWED_ORIGIN = ALLOWED_ORIGINS[0];

// Testing on a real phone means the browser sends Origin: http://192.168.x.x:3000,
// which never matches a localhost allowlist — every call dies as a CORS error
// that looks like the API is down. In dev only, private LAN origins are allowed
// as well. This stays off in production, where the allowlist is the whole point.
const LAN_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|10\.[\d.]+|192\.168\.[\d.]+|172\.(1[6-9]|2\d|3[01])\.[\d.]+)(:\d+)?$/;

function devCorsOrigin(origin: string | undefined, cb: (e: Error | null, ok?: boolean) => void) {
  // No Origin header at all — curl, Swagger UI, same-origin. Always fine.
  if (!origin) return cb(null, true);
  if (ALLOWED_ORIGINS.includes(origin.replace(/\/$/, '')) || LAN_ORIGIN.test(origin)) {
    return cb(null, true);
  }
  // Deny by omitting Access-Control-Allow-Origin, not by throwing. Throwing here
  // turns every blocked request into a 500 with a full stack trace, which buries
  // real errors in the log and lets any origin fill it on demand. Without the
  // header the browser blocks the response on its own — which is the whole
  // mechanism CORS relies on.
  return cb(null, false);
}

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
      origin: devCorsOrigin,
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
