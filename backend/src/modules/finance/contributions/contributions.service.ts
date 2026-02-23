import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { LedgerService } from '../journal/ledger.service';

import { AuditService } from '../audit/audit.service';

@Injectable()
export class ContributionsService {
    constructor(
        private prisma: PrismaService,
        private ledgerService: LedgerService,
        private auditService: AuditService
    ) { }

    async deposit(userId: string, data: { amount: number; month: string }, adminId: string) {
        if (data.amount <= 0) throw new BadRequestException('Amount must be positive');

        const contribution = await this.prisma.$transaction(async (tx) => {
            // 1. Create Contribution record
            const contrib = await tx.contribution.create({
                data: {
                    userId,
                    amount: data.amount,
                    month: data.month,
                    status: 'CONFIRMED'
                }
            });

            // 2. Double-Entry
            const poolAccount = await this.ledgerService.getOrCreateSystemAccount('SACCO_POOL');
            const memberAccount = await this.ledgerService.getOrCreateMemberAccount(userId);

            await this.ledgerService.createJournalEntry({
                referenceType: 'contribution',
                referenceId: contrib.id,
                description: `Monthly contribution for ${data.month}`,
                createdBy: adminId,
                transactions: [
                    { accountId: poolAccount.id, debit: data.amount, credit: 0 },
                    { accountId: memberAccount.id, debit: 0, credit: data.amount }
                ]
            });

            return contrib;
        });

        // Log the action
        await this.auditService.log(adminId, 'DEPOSIT_RECORDED', 'contribution', contribution.id);

        return contribution;
    }

    async findAll() {
        return this.prisma.contribution.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByUser(userId: string) {
        return this.prisma.contribution.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }
}
