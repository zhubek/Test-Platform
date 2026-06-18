import { Module } from '@nestjs/common';
import { DataCatalogsController } from './data-catalogs.controller';
import { DataCatalogsService } from './data-catalogs.service';

@Module({
  controllers: [DataCatalogsController],
  providers: [DataCatalogsService],
})
export class DataCatalogsModule {}
