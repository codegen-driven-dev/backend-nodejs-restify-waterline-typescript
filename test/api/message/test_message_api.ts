import {series} from 'async';
import {IModelRoute} from 'nodejs-utils';
import {strapFramework} from 'restify-utils';
import {all_models_and_routes, strapFrameworkKwargs, IObjectCtor, c} from './../../../main';
import {tearDownConnections} from '../../shared_tests';
import {Collection, Connection} from 'waterline';
import {Server} from 'restify';
import {MessageTestSDK} from './message_test_sdk';
import {user_mocks} from '../user/user_mocks';
import {ITestSDK} from '../auth/auth_test_sdk.d';
import {AuthTestSDK} from '../auth/auth_test_sdk';
import {IUser} from '../../../api/user/models.d';
import {Response} from 'supertest';
import {message_mocks} from './message_mocks';
import {IMessageBase} from '../../../api/message/models.d';

declare var Object: IObjectCtor;

const user_models_and_routes: IModelRoute = {
    user: all_models_and_routes['user'],
    auth: all_models_and_routes['auth'],
    message: all_models_and_routes['message']
};

process.env.NO_SAMPLE_DATA = true;


describe('Message::routes', () => {
    let sdk: MessageTestSDK, auth_sdk: ITestSDK, app: Server,
        mocks: { successes: Array<IMessageBase>, failures: Array<{}> };

    before(done =>
        series([
            cb => tearDownConnections(c.connections, cb),
            cb => strapFramework(Object.assign({}, strapFrameworkKwargs, {
                models_and_routes: user_models_and_routes,
                createSampleData: false,
                start_app: false,
                use_redis: true,
                app_name: 'test-message-api',
                callback: (err, _app, _connections: Connection[], _collections: Collection[]) => {
                    if (err) return cb(err);
                    c.connections = _connections;
                    c.collections = _collections;
                    app = _app;
                    sdk = new MessageTestSDK(app);
                    auth_sdk = new AuthTestSDK(app);
                    console.info('user_mocks.successes =', user_mocks.successes);
                    mocks = message_mocks(user_mocks.successes);
                    return cb();
                }
            })),
            cb => user_mocks.successes.forEach((user: IUser, idx: number) => series([
                callback => auth_sdk.register(user, callback),
                callback => auth_sdk.login(user, callback)
            ], (err, results: Array<Response>) => {
                if (err) return cb(err);
                user['access_token'] = results[1].body.access_token;
                user_mocks.successes[idx] = user;
                return cb(err, user);
            }))
        ], done)
    );

    // Deregister database adapter connections
    after(done => series([
        cb => auth_sdk.unregister_all(user_mocks.successes, cb),
        cb => tearDownConnections(c.connections, cb)
    ], done));

    describe('/api/message/:to', () => {
        /* TODO: beforeEach delete posts, afterEach delete posts */

        it('POST should create message', done => sdk.create(user_mocks.successes[0].access_token, mocks[0], done));
        it('GET should get all messages', done => sdk.getAll(user_mocks.successes[0].access_token, mocks[0], done));
    });

    describe('/api/message/:to/:uuid', () => {
        /* TODO: beforeEach create posts, afterEach delete posts */

        it('GET should retrieve message', done => sdk.retrieve(user_mocks.successes[0].access_token, mocks[0], done));
        it('PUT should update message', done => sdk.update(user_mocks.successes[0].access_token, mocks[0], done));
        it('DELETE should destroy message', done => sdk.destroy(user_mocks.successes[0].access_token, mocks[0], done));
    });
});
