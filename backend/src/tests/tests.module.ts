import { Module } from '@nestjs/common';
import { TestsController } from './tests.controller';
import { LicenseTestsController } from './license-tests.controller';
import { TestsService } from './tests.service';
import { LicenseTestService } from './license-test.service';

// Two coupled entities of the test domain: the authored Test (+ its blocks and
// param selection) and the LicenseTest attempt (+ its computed variables). Both
// register with the access registry via their *.access.ts modules.
@Module({
  controllers: [TestsController, LicenseTestsController],
  providers: [TestsService, LicenseTestService],
})
export class TestsModule {}
