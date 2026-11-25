import { Migration } from '@mikro-orm/migrations';

export class Migration20261123110005 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "stampcards" drop constraint "stampcards_firefighter_id_foreign";`);

    this.addSql(`alter table "users" add column "budget" real not null default 0;`);

    this.addSql(`alter table "stampcards" add column "budget" real not null, add column "user_id" uuid null;`);
    this.addSql(`alter table "stampcards" alter column "firefighter_id" drop default;`);
    this.addSql(`alter table "stampcards" alter column "firefighter_id" type uuid using ("firefighter_id"::text::uuid);`);
    this.addSql(`alter table "stampcards" alter column "firefighter_id" drop not null;`);
    this.addSql(`alter table "stampcards" add constraint "stampcards_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "stampcards" add constraint "stampcards_firefighter_id_foreign" foreign key ("firefighter_id") references "firefighters" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "stampcards" drop constraint "stampcards_user_id_foreign";`);
    this.addSql(`alter table "stampcards" drop constraint "stampcards_firefighter_id_foreign";`);

    this.addSql(`alter table "users" drop column "budget";`);

    this.addSql(`alter table "stampcards" drop column "budget", drop column "user_id";`);

    this.addSql(`alter table "stampcards" alter column "firefighter_id" drop default;`);
    this.addSql(`alter table "stampcards" alter column "firefighter_id" type uuid using ("firefighter_id"::text::uuid);`);
    this.addSql(`alter table "stampcards" alter column "firefighter_id" set not null;`);
    this.addSql(`alter table "stampcards" add constraint "stampcards_firefighter_id_foreign" foreign key ("firefighter_id") references "firefighters" ("id") on update cascade;`);
  }

}
