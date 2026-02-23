"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    const roles = ['super_admin', 'treasurer', 'committee', 'member'];
    for (const roleName of roles) {
        await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
        });
    }
    console.log('✅ Roles created');
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
    const superAdminRole = await prisma.role.findUnique({ where: { name: 'super_admin' } });
    if (superAdminRole) {
        await prisma.userRole.upsert({
            where: {
                id: `${admin.id}_${superAdminRole.id}`,
            },
            update: {},
            create: {
                userId: admin.id,
                roleId: superAdminRole.id,
            },
        }).catch(async () => {
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
//# sourceMappingURL=seed.js.map