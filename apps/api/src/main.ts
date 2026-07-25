import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3001);
  // Bind all interfaces for container platforms (Fly, Render, Docker)
  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`Allô Services API listening on http://0.0.0.0:${port}/api/v1`);
}

void bootstrap();
