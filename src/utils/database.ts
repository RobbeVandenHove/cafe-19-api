import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import logger from './logger';
import config from '../../mikro-orm.config';

export default class Database {
    private static _instance: Database;
    private static _entityManager: EntityManager;

    private constructor() {

    }

    public static async initORM() {
        const orm = await MikroORM.init(config);
        await orm.getMigrator().up();
        this._entityManager = orm.em.fork();
        logger.info('[INFO] ORM Ready');
    }

    /**
     * This checks if an instance of the database exists. If it exists,
     * it will return the existing instance of it. If it doesn't exists,
     * it will create a new instance of database and return that new instance.
     *
     * The method is static, which results in the possibility to call the method
     * without creating an instance of database. And thus the database has control
     * over the amount of instances that can be created. This is called a singleton pattern.
     */
    public static getInstance(): Database {
        if (this._instance == null) {
            this._instance = new Database();
        }
        return this._instance;
    }

    public static getEntityManager(): EntityManager {
        return this._entityManager;
    }
}
