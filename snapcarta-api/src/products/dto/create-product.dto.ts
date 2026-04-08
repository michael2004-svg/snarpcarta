import { IsString, IsNumber, IsOptional, IsBoolean, IsArray } from 'class-validator'

export class CreateProductDto {
  @IsString()
  title: string

  @IsString()
  description: string

  @IsNumber()
  price: number

  @IsNumber()
  originalPrice: number

  @IsString()
  image: string

  @IsOptional()
  @IsArray()
  images?: string[]

  @IsOptional()
  specs?: Record<string, string>

  @IsOptional()
  @IsString()
  categoryId?: string

  @IsOptional()
  @IsString()
  aliexpressId?: string

  @IsOptional()
  @IsNumber()
  stock?: number

  @IsOptional()
  @IsString()
  badge?: string

  @IsOptional()
  @IsNumber()
  rating?: number

  @IsOptional()
  @IsNumber()
  reviewCount?: number

  @IsOptional()
  @IsBoolean()
  inStock?: boolean
}
