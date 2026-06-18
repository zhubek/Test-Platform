import { IsObject, IsOptional } from 'class-validator';

// Finalize an attempt: store the computed variables (characteristic/scores) as
// a flat { variable: number } map and mark the attempt COMPLETED.
export class SubmitAttemptDto {
  @IsOptional()
  @IsObject()
  variables?: Record<string, number>;

  @IsOptional()
  @IsObject()
  progress?: Record<string, unknown>;
}
