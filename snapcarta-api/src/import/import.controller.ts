import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { ImportService } from './import.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { ImportProductsDto } from './dto/import-products.dto'

@ApiTags('import')
@Controller('import')
@UseGuards(JwtAuthGuard)
@Roles('admin')
@ApiBearerAuth()
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('aliexpress')
  @ApiOperation({ summary: 'Import products from AliExpress by keyword (admin only)' })
  @ApiResponse({ status: 201, description: 'Products imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or API error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  importProducts(@Body() body: ImportProductsDto) {
    return this.importService.importFromAliExpress(body.keyword || '', body.categoryId)
  }

  @Post('aliexpress/preview')
  @ApiOperation({ summary: 'Preview products from AliExpress (admin only)' })
  @ApiResponse({ status: 200, description: 'Products fetched successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or API error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  previewProducts(@Body() body: ImportProductsDto) {
    return this.importService.previewFromAliExpress(body.keyword, body.categoryId, body.sourceUrl, body.urls)
  }
}
