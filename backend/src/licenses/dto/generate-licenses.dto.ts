import { IsInt, IsISO8601, Max, Min } from 'class-validator';

export class GenerateLicensesDto {
  @IsInt()
  @Min(1)
  @Max(200)
  count!: number;

  /** Required: every license must carry an expiration; validated ≤ org/project. */
  @IsISO8601()
  expirationDate!: string;
}
