import { IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';

export class GenerateLicensesDto {
  @IsInt()
  @Min(1)
  @Max(200)
  count!: number;

  @IsOptional()
  @IsISO8601()
  expirationDate?: string;
}
