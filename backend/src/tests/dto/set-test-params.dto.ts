import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

export class TestParamInput {
  @IsString()
  projectParamId!: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

// Replace the test's project-parameter selection with this list.
export class SetTestParamsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestParamInput)
  params!: TestParamInput[];
}
