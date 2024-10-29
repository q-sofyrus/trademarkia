import { Controller, Get } from '@nestjs/common';
import { MyService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly myService: MyService) {}

  @Get()
  getHello() {
    return this.myService.fetch();
  }
}
