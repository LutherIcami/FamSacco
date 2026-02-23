import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Create Roles
    const roles = ['super_admin', 'treasurer', 'committee', 'member'];
    for (const roleName of roles) {
        await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
        });
    }
    console.log('✅ Roles created');

    // 2. Create Default Admin User
    const adminEmail = 'admin@famsacco.com';
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            firstName: 'System',
            lastName: 'Administrator',
            passwordHash: hashedPassword,
            status: 'ACTIVE',
        },
    });

    // 3. Assign super_admin role to the user
    const superAdminRole = await prisma.role.findUnique({ where: { name: 'super_admin' } });
    if (superAdminRole) {
        await prisma.userRole.upsert({
            where: {
                id: `${admin.id}_${superAdminRole.id}`, // We'll just check if it exists or create
            },
            update: {},
            create: {
                userId: admin.id,
                roleId: superAdminRole.id,
            },
        }).catch(async () => {
            // Fallback if specific composite constraint doesn't exist but we want to avoid duplicates
            const existing = await prisma.userRole.findFirst({
                where: { userId: admin.id, roleId: superAdminRole.id }
            });
            if (!existing) {
                await prisma.userRole.create({
                    data: { userId: admin.id, roleId: superAdminRole.id }
                });
            }
        });
    }

    console.log('✅ Admin user created: admin@famsacco.com / Admin@123');
    console.log('🚀 Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
