import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SocialModule } from './modules/social/social.module';
import { GovernanceModule } from './modules/governance/governance.module';
import { AuditModule } from './modules/audit/audit.module';
import { FinanceModule } from './modules/finance/finance.module';

@Module({
  imports: [DatabaseModule, AuthModule, UsersModule, SocialModule, GovernanceModule, AuditModule, FinanceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
