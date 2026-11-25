// src/seeder/DatabaseSeeder.ts
import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/core';
import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import Role from '../src/modules/auth/entities/role.entity';
import User from '../src/modules/auth/entities/user.entity';

dotenv.config();

export class DatabaseSeeder extends Seeder {
    async run(em: EntityManager): Promise<void> {
        await this.validateExistingDefaultRoles(em);
        await this.validateExistingSuperAdmin(em);
    }

    public async validateExistingDefaultRoles(em: EntityManager): Promise<void> {
        const existingClientBookkeeperRole = await em.findOne(Role, { name: "client_bookkeeper" });
        const existingClientAdminRole = await em.findOne(Role, { name: "client_admin" });
        const existingServiceOwnerRole = await em.findOne(Role, { name: "service_owner" });

        if (!existingClientBookkeeperRole) {
            const clientBookkeeperRole = new Role("client_bookkeeper");
            await em.persist(clientBookkeeperRole).flush();
            console.log("Client bookkeeper role created in database");
        }
        if (!existingClientAdminRole) {
            const clientAdminRole = new Role("client_admin");
            await em.persist(clientAdminRole).flush();
            console.log("Client admin role created in database");
        }
        if (!existingServiceOwnerRole) {
            const serviceOwnerRole = new Role("service_owner");
            await em.persist(serviceOwnerRole).flush();
            console.log("Service owner role created in database");
        }
    }


    public async validateExistingSuperAdmin(em: EntityManager): Promise<void> {
        const adminName = process.env.SUPER_ADMIN_USERNAME;
        const adminPwd = process.env.SUPER_ADMIN_PWD;

        if (!adminName || !adminPwd) {
            throw new Error(
                "SUPER_ADMIN_USERNAME and SUPER_ADMIN_PWD must be set in .env"
            );
        }

        const existingAdmin = await em.findOne(User, {
            email: adminName,
        });

        if (existingAdmin) {
            if (!existingAdmin.isActive) {
                existingAdmin.isActive = true;
                await em.flush();

                console.log(`Super admin "${adminName}" set to active.`);
            } else {
                console.log(`Super admin "${adminName}" already exists.`);
            }

            return;
        }

        const serviceOwnerRole = await em.findOne(Role, { name: "service_owner" });

        if (!serviceOwnerRole) {
            throw new Error("Service owner role should always exist.");
        }

        const hash = await bcrypt.hash(adminPwd, 12);

        const admin = new User("admin", "admin");

        admin.email = adminName;
        admin.password = hash;
        admin.isActive = true;

        admin.roles.add(serviceOwnerRole);

        await em.persist(admin).flush();

        console.log(`Super admin "${adminName}" created.`);
    }
}
