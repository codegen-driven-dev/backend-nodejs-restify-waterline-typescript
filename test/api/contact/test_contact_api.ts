import * as async from 'async';
import { IModelRoute } from 'nodejs-utils';
import { strapFramework } from 'restify-utils';
import { all_models_and_routes, c, IObjectCtor, strapFrameworkKwargs } from '../../../main';
import { create_and_auth_users, tearDownConnections } from '../../shared_tests';
import { Collection, Connection } from 'waterline';
import { Server } from 'restify';
import { ContactTestSDK } from './contact_test_sdk';
import { user_mocks } from '../user/user_mocks';
import { IAuthSdk } from '../auth/auth_test_sdk.d';
import { AuthTestSDK } from '../auth/auth_test_sdk';
import { IUserBase } from '../../../api/user/models.d';
import { contact_mocks } from './contact_mocks';
import { IContactBase } from '../../../api/contact/models.d';

declare const Object: IObjectCtor;

const models_and_routes: IModelRoute = {
    user: all_models_and_routes['user'],
    auth: all_models_and_routes['auth'],
    contact: all_models_and_routes['contact']
};

process.env['NO_SAMPLE_DATA'] = 'true';
const user_mocks_subset: IUserBase[] = user_mocks.successes.slice(20, 30);

describe('Contact::routes', () => {
    let sdk: ContactTestSDK;
    let auth_sdk: IAuthSdk;
    let app: Server;
    let mocks: {successes: IContactBase[], failures: Array<{}>};

    before('tearDownConnections', done => tearDownConnections(c.connections, done));

    before('strapFramework', done => strapFramework(Object.assign({}, strapFrameworkKwargs, {
        models_and_routes,
        createSampleData: false,
        start_app: false,
        use_redis: true,
        app_name: 'test-contact-api',
        callback: (err, _app, _connections: Connection[], _collections: Collection[]) => {
            if (err) return done(err);
            c.connections = _connections;
            c.collections = _collections;
            app = _app;
            sdk = new ContactTestSDK(app);
            auth_sdk = new AuthTestSDK(app);
            mocks = contact_mocks(user_mocks_subset);
            return done();
        }
    })));

    before('Create & auth users', done => create_and_auth_users(user_mocks_subset, auth_sdk, done));

    // Deregister database adapter connections
    after('unregister all users', done => auth_sdk.unregister_all(user_mocks_subset, done));
    after('tearDownConnections', done => tearDownConnections(c.connections, done));

    describe('/api/contact', () => {
        afterEach('deleteContact', done => sdk.destroy(user_mocks_subset[0].access_token, mocks.successes[0], done));

        it('POST should create contact', done =>
            sdk.create(user_mocks_subset[0].access_token, mocks.successes[0], done)
        );

        it('GET should get all contacts', done => async.series([
                cb => sdk.create(user_mocks_subset[0].access_token, mocks.successes[0], cb),
                cb => sdk.getAll(user_mocks_subset[0].access_token, mocks.successes[0], cb)
            ], done)
        );
    });

    describe('/api/contact/:email', () => {
        before('createContact', done => sdk.create(user_mocks_subset[0].access_token, mocks.successes[1], _ => done()));
        after('deleteContact', done => sdk.destroy(user_mocks_subset[0].access_token, mocks.successes[1], done));

        it('GET should retrieve contact', done =>
            sdk.retrieve(user_mocks_subset[0].access_token, mocks.successes[1], done)
        );

        it('PUT should update contact', done =>
            sdk.update(user_mocks_subset[0].access_token, mocks.successes[1],
                {
                    owner: mocks.successes[1].owner,
                    email: mocks.successes[1].email,
                    name: `NAME: ${mocks.successes[1].email}`
                } as IContactBase, done)
        );

        it('DELETE should destroy contact', done =>
            sdk.destroy(user_mocks_subset[0].access_token, mocks.successes[1], done)
        );
    });
});
