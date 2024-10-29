import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MyService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [MyService],
})
export class AppModule {}
