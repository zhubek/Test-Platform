import { IsObject } from 'class-validator';

// Persist the in-progress answers blob (keyed by question field).
export class SaveProgressDto {
  @IsObject()
  progress!: Record<string, unknown>;
}
