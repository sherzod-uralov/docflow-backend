import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SeedModule } from './seed/seed.module';
import { SeedService } from './seed/seed.service';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  // Create a separate app for seeding
  const seedApp = await NestFactory.create(SeedModule);
  const seedService = seedApp.get(SeedService);
  await seedService.seedAdminUser();

  await seedApp.close();

  const app = await NestFactory.create(AppModule);
  const bodyParser = require('body-parser');

  app.use((req, res, next) => {
    if (req.originalUrl === '/upload/large-stream-direct') {
      return next();
    }
    // For all other routes, use the regular body parsers
    bodyParser.json({ limit: '50mb' })(req, res, (err) => {
      if (err) return next(err);
      bodyParser.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
    });
  });

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'http://192.168.28.86:3000',
      'http://127.0.0.1:3000',
      'http://192.168.0.111:3000',
      '*',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
    ],
    credentials: false,
    maxAge: 86400,
    optionsSuccessStatus: 200,
  });

  app.use('/upload/large-stream', (req, res, next) => {
    req.setTimeout(30 * 60 * 1000);
    res.setTimeout(30 * 60 * 1000);
    next();
  });


  app.use('/upload/large-stream-direct', (req, res, next) => {
    req.setTimeout(60 * 60 * 1000);
    res.setTimeout(60 * 60 * 1000);
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('DocFlow API')
    .setDescription('Hujjat oqimi tizimi API hujjatlari. API REST endpointlari va WebSocket real-time aloqani taqdim etadi. WebSocket haqida qo\'shimcha ma\'lumot olish uchun WEBSOCKET.md faylini ko\'ring.')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT token kiriting',
    })
    .addTag('auth', 'Autentifikatsiya')
    .addTag('users', 'Foydalanuvchilar boshqaruvi')
    .addTag('roles', 'Rollar boshqaruvi')
    .addTag('permissions', 'Ruxsatlar boshqaruvi')
    .addTag('documents', 'Hujjatlar boshqaruvi')
    .addTag('document-types', 'Hujjat turlari boshqaruvi')
    .addTag('journals', 'Jurnallar boshqaruvi')
    .addTag('upload', 'Fayl yuklash')
    .addTag('approval-workflows', 'Kelishish jarayonlari')
    .addTag('statistics', 'Tizim statistikasi')
    .addTag('departments', 'Bo\'limlar boshqaruvi')
    .addTag('websockets', 'Real-time WebSocket aloqa')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  const customOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      defaultModelsExpandDepth: 0,
      defaultModelExpandDepth: 1,
      displayRequestDuration: true,
      filter: true,
      operationsSorter: 'alpha',
      tagsSorter: 'alpha',
      tryItOutEnabled: true,
      syntaxHighlight: {
        activate: true,
        theme: 'agate',
      },
    },
    customSiteTitle: 'DocFlow API Hujjatlari',
    customCss: '.swagger-ui .topbar { display: none }',
    customfavIcon: '/favicon.ico',
  };

  SwaggerModule.setup('api', app, document, customOptions);

  await app.listen(process.env.PORT ?? 3003, '192.168.0.109');
}
bootstrap();
//test1
