import { Migration } from '@mikro-orm/migrations';

export class Migration20261120094433 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "stock" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "inventory_price" real not null default 0, constraint "stock_pkey" primary key ("id"));`);

    this.addSql(`create table "beverages" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "name" varchar(255) not null, "stock_id" uuid not null, "type" text check ("type" in ('ALCOHOLIC', 'NON_ALCOHOLIC', 'SNACK')) not null, "price" real not null default 0, "amount" int not null default 0, constraint "beverages_pkey" primary key ("id"));`);

    this.addSql(`alter table "beverages" add constraint "beverages_stock_id_foreign" foreign key ("stock_id") references "stock" ("id") on update cascade;`);

    this.addSql(`alter table "firehouses" add column "stock_id" uuid not null;`);
    this.addSql(`alter table "firehouses" add constraint "firehouses_stock_id_foreign" foreign key ("stock_id") references "stock" ("id") on update cascade;`);
    this.addSql(`alter table "firehouses" add constraint "firehouses_stock_id_unique" unique ("stock_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "beverages" drop constraint "beverages_stock_id_foreign";`);

    this.addSql(`alter table "firehouses" drop constraint "firehouses_stock_id_foreign";`);

    this.addSql(`drop table if exists "stock" cascade;`);

    this.addSql(`drop table if exists "beverages" cascade;`);

    this.addSql(`alter table "firehouses" drop constraint "firehouses_stock_id_unique";`);
    this.addSql(`alter table "firehouses" drop column "stock_id";`);
  }

}
