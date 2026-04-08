import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { CategoriesService } from './categories.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../common/decorators/roles.decorator'

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private svc: CategoriesService) {}

  @Get() findAll() { return this.svc.findAll() }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  create(@Body() body: any) { return this.svc.create(body) }
}