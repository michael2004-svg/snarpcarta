import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Global prefix
  app.setGlobalPrefix('api')

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }))

  // Exception filter
  app.useGlobalFilters(new HttpExceptionFilter())

  // Swagger docs
  const config = new DocumentBuilder()
    .setTitle('Snapcarta API')
    .setDescription('Snapcarta eCommerce API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const doc = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, doc)

  await app.listen(process.env.PORT ?? 3001)
  console.log(`🚀 Snapcarta API running on port ${process.env.PORT ?? 3001}`)
  console.log(`📖 Swagger docs: http://localhost:${process.env.PORT ?? 3001}/api/docs`)
}
bootstrap()