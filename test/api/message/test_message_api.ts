import { series, forEachOf } from 'async';
import { IModelRoute } from 'nodejs-utils';
import { strapFramework } from 'restify-utils';
import { Collection, Connection } from 'waterline';
import { Server } from 'restify';
import { Response } from 'supertest';
import { all_models_and_routes, strapFrameworkKwargs, IObjectCtor, c } from '../../../main';
import { IUser, IUserBase } from '../../../api/user/models.d';
import { IMessageBase } from '../../../api/message/models.d';
import { tearDownConnections } from '../../shared_tests';
import { MessageTestSDK } from './message_test_sdk';
import { user_mocks } from '../user/user_mocks';
import { AuthTestSDK } from '../auth/auth_test_sdk';
import { message_mocks } from './message_mocks';

declare const Object: IObjectCtor;

const models_and_routes: IModelRoute = {
    user: all_models_and_routes['user'],
    auth: all_models_and_routes['auth'],
    message: all_models_and_routes['message']
};

process.env['NO_SAMPLE_DATA'] = 'true';
const user_mocks_subset: Array<IUserBase> = user_mocks.successes.slice(20, 30);

describe('Message::routes', () => {
    let sdk: MessageTestSDK, auth_sdk/*: ITestSDK*/, app: Server,
        mocks: {successes: Array<IMessageBase>, failures: Array<{}>};

    before('tearDownConnections', done => tearDownConnections(c.connections, done));

    before('strapFramework', done => strapFramework(Object.assign({}, strapFrameworkKwargs, {
        models_and_routes: models_and_routes,
        createSampleData: false,
        start_app: false,
        use_redis: true,
        app_name: 'test-message-api',
        callback: (err, _app, _connections: Connection[], _collections: Collection[]) => {
            if (err) return done(err);
            c.connections = _connections;
            c.collections = _collections;
            app = _app;
            sdk = new MessageTestSDK(app);
            auth_sdk = new AuthTestSDK(app);
            mocks = message_mocks(user_mocks_subset);
            return done();
        }
    })));

    before('Create & auth users', done => forEachOf(user_mocks_subset, (user: IUser, idx: number, callback) => series([
        cb => auth_sdk.register(user, cb),
        cb => auth_sdk.login(user, cb)
    ], (err, results: Array<Response>) => {
        if (err) return callback(err);
        user['access_token'] = results[1].body.access_token;
        user_mocks_subset[idx] = user;
        return callback();
    }), done));

    // Deregister database adapter connections
    after('unregister all users', done => auth_sdk.unregister_all(user_mocks_subset, done));
    after('tearDownConnections', done => tearDownConnections(c.connections, done));

    describe('/api/message/:to', () => {
        afterEach('deleteMessage', done => sdk.destroy(user_mocks_subset[0].access_token, mocks.successes[0], done));

        it('POST should create message', done =>
            sdk.create(user_mocks_subset[0].access_token, mocks.successes[0], done)
        );

        it('GET should get all messages', done => series([
                cb => sdk.create(user_mocks_subset[0].access_token, mocks.successes[0], cb),
                cb => sdk.getAll(user_mocks_subset[0].access_token, mocks.successes[0], cb)
            ], done)
        );
    });

    describe('/api/message/:to/:uuid', () => {
        before('createMessage', done => sdk.create(user_mocks_subset[0].access_token, mocks.successes[1], _ => done()));
        after('deleteMessage', done => sdk.destroy(user_mocks_subset[0].access_token, mocks.successes[1], done));

        it('GET should retrieve message', done =>
            sdk.retrieve(user_mocks_subset[0].access_token, mocks.successes[1], done)
        );

        it('PUT should update message', done =>
            sdk.update(user_mocks_subset[0].access_token, mocks.successes[1],
                {message: mocks.successes[2].message, uuid: mocks.successes[1].uuid}, done)
        );

        it('DELETE should destroy message', done =>
            sdk.destroy(user_mocks_subset[0].access_token, mocks.successes[1], done)
        );
    });
});
