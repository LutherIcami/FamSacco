import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async generateStatement(userId: string, options: { startDate?: Date; endDate?: Date } = {}) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { roles: { include: { role: true } } }
        });

        if (!user) throw new Error('User not found');

        const account = await this.prisma.account.findFirst({
            where: { userId, accountType: 'MEMBER_SAVINGS' }
        });

        if (!account) throw new Error('Savings account not found');

        const transactions = await this.prisma.transaction.findMany({
            where: {
                accountId: account.id,
                createdAt: {
                    gte: options.startDate,
                    lte: options.endDate,
                },
            },
            orderBy: { createdAt: 'desc' },
            include: {
                journalEntry: true
            }
        });

        return new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err) => reject(err));

            // --- Header ---
            doc.fontSize(24).font('Helvetica-Bold').text('FamSacco', { align: 'center' });
            doc.fontSize(10).font('Helvetica').text('Official Financial Statement', { align: 'center' });
            if (options.startDate || options.endDate) {
                const range = `${options.startDate?.toLocaleDateString() || 'Beginning'} - ${options.endDate?.toLocaleDateString() || 'Today'}`;
                doc.fontSize(8).text(`Reporting Period: ${range}`, { align: 'center' });
            }
            doc.moveDown(2);

            // --- Member Info ---
            doc.fontSize(12).font('Helvetica-Bold').text('Member Details');
            doc.fontSize(10).font('Helvetica').text(`Name: ${user.firstName} ${user.lastName}`);
            doc.text(`Email: ${user.email}`);
            doc.text(`Account ID: ${account.id}`);
            doc.text(`Statement Date: ${new Date().toLocaleDateString()}`);
            doc.moveDown(2);

            // --- Summary ---
            const totalCredit = transactions.reduce((sum, tx) => sum + Number(tx.credit), 0);
            const totalDebit = transactions.reduce((sum, tx) => sum + Number(tx.debit), 0);
            const balance = totalCredit - totalDebit;

            doc.fontSize(12).font('Helvetica-Bold').text('Summary');
            doc.fontSize(10).font('Helvetica').text(`Total Credits: KES ${totalCredit.toLocaleString()}`);
            doc.text(`Total Debits: KES ${totalDebit.toLocaleString()}`);
            doc.fontSize(12).text(`Current Balance: KES ${balance.toLocaleString()}`, { bold: true });
            doc.moveDown(2);

            // --- Mini Trend Chart (Simple Bars) ---
            if (transactions.length > 0) {
                doc.fontSize(10).font('Helvetica-Bold').text('Savings Trend (Last 10 Movements)');
                doc.moveDown(0.5);
                const chartX = 50;
                const chartY = doc.y;
                const chartWidth = 500;
                const chartHeight = 40;

                // Draw background
                doc.rect(chartX, chartY, chartWidth, chartHeight).fill('#f8fafc');

                const last10 = transactions.slice(0, 10).reverse();
                const maxVal = Math.max(...last10.map(t => Math.max(Number(t.credit), Number(t.debit))), 1);
                const barWidth = (chartWidth / last10.length) - 5;

                last10.forEach((tx, i) => {
                    const h = (Math.max(Number(tx.credit), Number(tx.debit)) / maxVal) * chartHeight;
                    const color = Number(tx.credit) > 0 ? '#10b981' : '#f87171';
                    doc.rect(chartX + (i * (barWidth + 5)), chartY + (chartHeight - h), barWidth, h).fill(color);
                });

                doc.moveDown(4);
            }

            // --- Transaction Table ---
            doc.fontSize(12).font('Helvetica-Bold').text('Transaction History');
            doc.moveDown(0.5);

            // Table Header
            const tableTop = doc.y;
            doc.fontSize(9).font('Helvetica-Bold');
            doc.text('Date', 50, tableTop);
            doc.text('Description', 130, tableTop);
            doc.text('Debit', 350, tableTop, { width: 60, align: 'right' });
            doc.text('Credit', 430, tableTop, { width: 60, align: 'right' });
            doc.text('Balance', 510, tableTop, { width: 60, align: 'right' });

            doc.moveTo(50, tableTop + 15).lineTo(570, tableTop + 15).stroke();
            doc.moveDown(1);

            let currentY = tableTop + 25;
            let runningBalance = balance;

            transactions.forEach((tx) => {
                if (currentY > 750) {
                    doc.addPage();
                    currentY = 50;
                }

                doc.fontSize(8).font('Helvetica');
                doc.text(new Date(tx.createdAt).toLocaleDateString(), 50, currentY);
                doc.text(tx.journalEntry.description || 'System Transaction', 130, currentY, { width: 200 });
                doc.text(Number(tx.debit) > 0 ? Number(tx.debit).toLocaleString() : '-', 350, currentY, { width: 60, align: 'right' });
                doc.text(Number(tx.credit) > 0 ? Number(tx.credit).toLocaleString() : '-', 430, currentY, { width: 60, align: 'right' });
                doc.text(runningBalance.toLocaleString(), 510, currentY, { width: 60, align: 'right' });

                runningBalance -= (Number(tx.credit) - Number(tx.debit));
                currentY += 20;
            });

            // --- Footer ---
            doc.fontSize(8).font('Helvetica-Oblique').text(
                'This is a computer-generated document and does not require a signature.',
                50, 780, { align: 'center' }
            );

            doc.end();
        });
    }

    async generateGlobalReport() {
        // Similar to above but for the entire SACCO
        // This could be a complex financial summary
        // For now let's just implement the member statement as requested
    }
}
