import { PrismaClient, AccountType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const OFFICIALS = [
    {
        email: 'admin@famsacco.com',
        firstName: 'System',
        lastName: 'Administrator',
        password: 'Admin@123',
        roles: ['super_admin'],
    },
    {
        email: 'treasurer@famsacco.com',
        firstName: 'Jane',
        lastName: 'Kamau',
        password: 'Treasurer@123',
        roles: ['treasurer'],
    },
    {
        email: 'secretary@famsacco.com',
        firstName: 'Peter',
        lastName: 'Mwangi',
        password: 'Secretary@123',
        roles: ['secretary'],
    },
    {
        email: 'committee1@famsacco.com',
        firstName: 'Grace',
        lastName: 'Wanjiru',
        password: 'Committee@123',
        roles: ['committee', 'member'],
    },
    {
        email: 'committee2@famsacco.com',
        firstName: 'Samuel',
        lastName: 'Odhiambo',
        password: 'Committee@123',
        roles: ['committee', 'member'],
    },
    {
        email: 'member1@famsacco.com',
        firstName: 'Alice',
        lastName: 'Njeri',
        password: 'Member@123',
        roles: ['member'],
    },
    {
        email: 'member2@famsacco.com',
        firstName: 'James',
        lastName: 'Otieno',
        password: 'Member@123',
        roles: ['member'],
    },
    {
        email: 'member3@famsacco.com',
        firstName: 'Mary',
        lastName: 'Wambui',
        password: 'Member@123',
        roles: ['member'],
    },
];

async function assignRole(userId: string, roleName: string) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) return;
    const existing = await prisma.userRole.findFirst({ where: { userId, roleId: role.id } });
    if (!existing) {
        await prisma.userRole.create({ data: { userId, roleId: role.id } });
    }
}

async function ensureMemberSavingsAccount(userId: string) {
    const existing = await prisma.account.findFirst({ where: { userId, accountType: AccountType.MEMBER_SAVINGS } });
    if (!existing) {
        await prisma.account.create({
            data: { userId, accountType: AccountType.MEMBER_SAVINGS }
        });
    }
}

async function main() {
    console.log('🌱 Seeding FamSacco database...\n');

    // 1. Ensure all roles exist
    const allRoles = ['super_admin', 'treasurer', 'secretary', 'committee', 'member'];
    for (const roleName of allRoles) {
        await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
        });
    }
    console.log('✅ Roles created:', allRoles.join(', '));

    // 2. Ensure system ledger accounts exist
    const systemAccounts = [AccountType.SACCO_POOL, AccountType.LOAN_RECEIVABLE, AccountType.INCOME];
    for (const accountType of systemAccounts) {
        const existing = await prisma.account.findFirst({ where: { accountType, userId: null } });
        if (!existing) {
            await prisma.account.create({ data: { accountType } });
            console.log(`  ↳ System account created: ${accountType}`);
        }
    }
    console.log('✅ System ledger accounts ensured\n');

    // 3. Seed users
    console.log('👥 Creating users...\n');
    for (const official of OFFICIALS) {
        const hashedPassword = await bcrypt.hash(official.password, 10);

        const user = await prisma.user.upsert({
            where: { email: official.email },
            update: {},
            create: {
                email: official.email,
                firstName: official.firstName,
                lastName: official.lastName,
                passwordHash: hashedPassword,
                status: 'ACTIVE',
            },
        });

        // Assign roles
        for (const roleName of official.roles) {
            await assignRole(user.id, roleName);
        }

        // Every real user gets a personal savings account
        if (!official.roles.includes('super_admin')) {
            await ensureMemberSavingsAccount(user.id);
        }

        console.log(`  ✓ ${official.firstName} ${official.lastName}`);
        console.log(`    Email   : ${official.email}`);
        console.log(`    Password: ${official.password}`);
        console.log(`    Roles   : ${official.roles.join(', ')}`);
        console.log();
    }

    console.log('━'.repeat(55));
    console.log('🚀 Seeding complete! Login credentials summary:\n');
    console.log('  Role          │ Email                       │ Password');
    console.log('  ──────────────┼─────────────────────────────┼─────────────────');
    console.log('  Chairperson   │ admin@famsacco.com           │ Admin@123');
    console.log('  Treasurer     │ treasurer@famsacco.com       │ Treasurer@123');
    console.log('  Secretary     │ secretary@famsacco.com       │ Secretary@123');
    console.log('  Committee x2  │ committee1/2@famsacco.com   │ Committee@123');
    console.log('  Member x3     │ member1/2/3@famsacco.com    │ Member@123');
    console.log('━'.repeat(55));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
