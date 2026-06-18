import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AssistantModule } from './assistant/assistant.module';
import { AuthModule } from './auth/auth.module';
import { BlocksModule } from './blocks/blocks.module';
import { CommonModule } from './common/common.module';
import { DataCatalogsModule } from './data-catalogs/data-catalogs.module';
import { AllExceptionsFilter } from './common/logging/all-exceptions.filter';
import { LoggingInterceptor } from './common/logging/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LanguagesModule } from './languages/languages.module';
import { LicensesModule } from './licenses/licenses.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ParamsModule } from './params/params.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { TestsModule } from './tests/tests.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    OrganizationsModule,
    LicensesModule,
    ParamsModule,
    LanguagesModule,
    BlocksModule,
    DataCatalogsModule,
    TestsModule,
    AssistantModule,
  ],
  providers: [
    // Global request-timing + response envelope + single error logger.
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
