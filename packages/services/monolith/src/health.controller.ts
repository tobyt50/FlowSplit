import { Controller, Get, HttpCode, HttpStatus, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  healthCheck() {
    // GET /api/health
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}