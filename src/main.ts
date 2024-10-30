import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { envs } from './config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  //const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  //  transport: Transport.NATS,
  //  options: {
  //    servers: envs.NATS_SERVERS
  //  }
  //});

  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted:true
    })
  )


  await app.listen(3002);
}
bootstrap();
