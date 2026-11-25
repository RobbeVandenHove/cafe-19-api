import { Migration } from '@mikro-orm/migrations';

export class Migration20261123191544 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "terminals" add column "coupled" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "terminals" drop column "coupled";`);
  }

}
