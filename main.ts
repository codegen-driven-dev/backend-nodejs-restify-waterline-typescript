import * as redis from 'redis';
import { Collection, Connection, Query } from 'waterline';
import * as waterline_postgres from 'waterline-postgresql';
import { createLogger } from 'bunyan';
import { Server } from 'restify';
import { IModelRoute, populateModelRoutes } from 'nodejs-utils';
import { IStrapFramework, strapFramework } from 'restify-utils';

import { SampleData } from './test/SampleData';
import { user_mocks } from './test/api/user/user_mocks';

/* tslint:disable:no-var-requires */
export const package_ = Object.freeze(require('./package'));
export const logger = createLogger({
    name: 'main'
});

/* tslint:disable:no-unused-expression */
process.env['NO_DEBUG'] || logger.info(Object.keys(process.env).sort().map(k => ({ [k]: process.env[k] })));

export interface IObjectCtor extends ObjectConstructor {
    assign(target: any, ...sources: any[]): any;
}

declare const Object: IObjectCtor;

/* TODO: Put this all in tiered environment-variable powered .json file */
const db_uri: string = process.env['RDBMS_URI'] || process.env['DATABASE_URL'] || process.env['POSTGRES_URL'];
// Database waterline_config
export const waterline_config = Object.freeze({
    adapters: {
        url: db_uri,
        postgres: waterline_postgres
    },
    defaults: {
        migrate: 'create'
    },
    connections: {
        main_db: {
            adapter: 'postgres',
            connection: db_uri,
            pool: {
                min: 2,
                max: 20
            }
        }
    }
});

export const all_models_and_routes: IModelRoute = populateModelRoutes('.');

export const redis_cursors: {redis: redis.RedisClient} = { redis: null };

export const c: {collections: Query[], connections: Connection[]} = { collections: [], connections: [] };

const _cache = {};
export const cache = {};
const default_user: string = JSON.stringify(user_mocks.successes[98]);
export const strapFrameworkKwargs: IStrapFramework = Object.freeze({
    app_name: package_.name,
    models_and_routes: all_models_and_routes,
    logger,
    _cache,
    package_,
    root: '/api',
    skip_db: false,
    collections: c.collections,
    waterline_config: waterline_config as any,
    use_redis: true,
    redis_cursors,
    createSampleData: true,
    SampleData,
    sampleDataToCreate: (sampleData: SampleData) => [
        cb => sampleData.unregister(default_user, (err, res) => cb(err, 'removed default user; next: adding')),
        cb => sampleData.registerLogin(default_user, cb)
    ]
} as IStrapFramework);

if (require.main === module)
    strapFramework(Object.assign({
            start_app: true, callback: (err, _app: Server, _connections: Connection[], _collections: Collection[]) => {
                if (err) throw err;
                c.connections = _connections;
                c.collections = _collections;
            }
        }, strapFrameworkKwargs)
    );
