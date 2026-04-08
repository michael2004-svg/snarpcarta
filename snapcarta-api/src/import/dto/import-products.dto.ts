import { IsString, IsOptional, IsUUID, MinLength, IsUrl, IsArray } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ImportProductsDto {
  @ApiProperty({ description: 'Search keyword for AliExpress products', example: 'wireless earbuds' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  keyword?: string

  @ApiPropertyOptional({ description: 'Category ID to assign imported products' })
  @IsOptional()
  @IsUUID()
  categoryId?: string

  @ApiPropertyOptional({ description: 'AliExpress product URL to scrape' })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string

  @ApiPropertyOptional({ description: 'List of AliExpress product URLs to scrape' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  urls?: string[]
}
