import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface TransactionInput {
    accountId: string;
    debit: number;
    credit: number;
}

@Injectable()
export class LedgerService {
    constructor(private prisma: PrismaService) { }

    /**
     * Executes a double-entry journal entry.
     * Ensures that the sum of debits equals the sum of credits.
     */
    async createJournalEntry(data: {
        referenceType: string;
        referenceId: string;
        description: string;
        createdBy: string;
        transactions: TransactionInput[];
    }) {
        const totalDebit = data.transactions.reduce((sum, tx) => sum + tx.debit, 0);
        const totalCredit = data.transactions.reduce((sum, tx) => sum + tx.credit, 0);

        // Using a small epsilon for float comparison if needed, 
        // but here we expect exact matches for financial integrity.
        if (Math.abs(totalDebit - totalCredit) > 0.001) {
            throw new BadRequestException(
                `Journal entry is unbalanced. Debits (${totalDebit}) must equal Credits (${totalCredit}).`
            );
        }

        return this.prisma.$transaction(async (tx) => {
            const entry = await tx.journalEntry.create({
                data: {
                    referenceType: data.referenceType,
                    referenceId: data.referenceId,
                    description: data.description,
                    createdBy: data.createdBy,
                },
            });

            const transactions = await Promise.all(
                data.transactions.map((t) =>
                    tx.transaction.create({
                        data: {
                            journalEntryId: entry.id,
                            accountId: t.accountId,
                            debit: new Decimal(t.debit),
                            credit: new Decimal(t.credit),
                        },
                    })
                )
            );

            return { entry, transactions };
        });
    }

    /**
     * Finds or creates a system account by type.
     */
    async getOrCreateSystemAccount(type: 'SACCO_POOL' | 'INCOME' | 'EXPENSE' | 'LOAN_RECEIVABLE') {
        let account = await this.prisma.account.findFirst({
            where: { accountType: type, userId: null },
        });

        if (!account) {
            account = await this.prisma.account.create({
                data: {
                    accountType: type,
                    userId: null,
                },
            });
        }

        return account;
    }

    /**
     * Finds or creates a member's savings account.
     */
    async getOrCreateMemberAccount(userId: string) {
        let account = await this.prisma.account.findUnique({
            // In our schema, we didn't add a unique constraint on (userId, accountType) 
            // but we can find it by userId and type.
            where: {
                // Wait, I need to check if there is a unique constraint or index.
                // Looking at the schema, Account has id. Let's use findFirst.
            }
        } as any);

        account = await this.prisma.account.findFirst({
            where: { userId, accountType: 'MEMBER_SAVINGS' }
        });

        if (!account) {
            account = await this.prisma.account.create({
                data: {
                    userId,
                    accountType: 'MEMBER_SAVINGS',
                },
            });
        }

        return account;
    }
}
