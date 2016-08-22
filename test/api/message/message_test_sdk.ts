import * as supertest from 'supertest';
import {Response} from 'supertest';
import * as chai from 'chai';
import {expect} from 'chai';
import {sanitiseSchema} from 'nodejs-utils';
import {fmtError} from 'restify-errors';
import * as chaiJsonSchema from 'chai-json-schema';
import {cb} from '../../share_interfaces.d';
import {IMessageBase} from '../../../api/message/models.d';
import {User} from '../../../api/user/models';

const user_schema = sanitiseSchema(require('./../user/schema.json'), User._omit);
const message_schema = require('./schema.json');

chai.use(chaiJsonSchema);

export class MessageTestSDK {
    constructor(public app) {
    }

    create(access_token: string, msg: IMessageBase, cb: cb) {
        if (!access_token) return cb(new TypeError('`access_token` argument to `create` must be defined'));
        else if (!msg) return cb(new TypeError('`msg` argument to `create` must be defined'));

        supertest(this.app)
            .post(`/api/message/${msg.to}`)
            .set('Connection', 'keep-alive')
            .set('X-Access-Token', access_token)
            .send(msg)
            .expect('Content-Type', /json/)
            .end((err, res: Response) => {
                if (err) return cb(err);
                else if (res.error) return cb(fmtError(res.error));

                try {
                    expect(res.status).to.be.equal(201);
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.be.jsonSchema(message_schema);
                } catch (e) {
                    err = <Chai.AssertionError>e;
                } finally {
                    cb(err, res);
                }
            });
    }

    getAll(access_token: string, msg: IMessageBase, cb: cb) {
        if (!access_token) return cb(new TypeError('`access_token` argument to `getAll` must be defined'));
        else if (!msg) return cb(new TypeError('`msg` argument to `getAll` must be defined'));

        supertest(this.app)
            .get(`/api/message/${msg.to}`)
            .set('Connection', 'keep-alive')
            .set('X-Access-Token', access_token)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res: Response) => {
                if (err) return cb(err);
                else if (res.error) return cb(res.error);
                try {
                    expect(res.body).to.have.property('from');
                    expect(res.body).to.have.property('to');
                    expect(res.body).to.have.property('messages');
                    expect(res.body.messages).to.be.instanceOf(Array);
                    res.body.messages.map(msg => {
                        expect(msg).to.be.an('object');
                        expect(msg).to.be.jsonSchema(message_schema);
                    });
                } catch (e) {
                    err = <Chai.AssertionError>e;
                } finally {
                    cb(err, res);
                }
            })
    }

    retrieve(access_token: string, msg: IMessageBase, cb: cb) {
        if (!access_token) return cb(new TypeError('`access_token` argument to `retrieve` must be defined'));
        else if (!msg) return cb(new TypeError('`msg` argument to `retrieve` must be defined'));

        supertest(this.app)
            .get(`/api/message/${msg.to}/${msg.uuid}`)
            .set('Connection', 'keep-alive')
            .set('X-Access-Token', access_token)
            .end((err, res: Response) => {
                if (err) return cb(err);
                else if (res.error) return cb(res.error);
                try {
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.be.jsonSchema(message_schema);
                } catch (e) {
                    err = <Chai.AssertionError>e;
                } finally {
                    cb(err, res);
                }
            })
    }

    update(access_token: string, initial_msg: IMessageBase,
           updated_msg: {message: string, uuid?: string, to?: string}, cb: cb) {
        if (!access_token) return cb(new TypeError('`access_token` argument to `update` must be defined'));
        else if (!initial_msg) return cb(new TypeError('`initial_msg` argument to `update` must be defined'));
        else if (!updated_msg) return cb(new TypeError('`updated_msg` argument to `update` must be defined'));
        else if (updated_msg.uuid !== initial_msg.uuid)
            return cb(new ReferenceError(`${initial_msg.uuid} != ${updated_msg.uuid} (\`uuid\`s between msgs)`));
        else if (updated_msg.to !== undefined && updated_msg.to !== initial_msg.to)
            return cb(new ReferenceError(`${initial_msg.to} != ${updated_msg.to} (\`to\` between msgs)`));

        supertest(this.app)
            .put(`/api/message/${initial_msg.to}/${initial_msg.uuid}`)
            .set('Connection', 'keep-alive')
            .set('X-Access-Token', access_token)
            .send(updated_msg)
            .end((err, res: Response) => {
                if (err) return cb(err);
                else if (res.error) return cb(res.error);
                try {
                    expect(res.body).to.be.an('object');
                    Object.keys(updated_msg).map(
                        attr => expect(updated_msg[attr]).to.be.equal(res.body[attr])
                    );
                    expect(res.body).to.be.jsonSchema(message_schema);
                } catch (e) {
                    err = <Chai.AssertionError>e;
                } finally {
                    cb(err, res);
                }
            })
    }

    destroy(access_token: string, msg: IMessageBase, cb: cb) {
        if (!access_token) return cb(new TypeError('`access_token` argument to `destroy` must be defined'));
        else if (!msg) return cb(new TypeError('`msg` argument to `destroy` must be defined'));

        supertest(this.app)
            .del(`/api/message/${msg.to}/${msg.uuid}`)
            .set('Connection', 'keep-alive')
            .set('X-Access-Token', access_token)
            .end((err, res: Response) => {
                if (err) return cb(err);
                else if (res.error) return cb(res.error);
                try {
                    expect(res.status).to.be.equal(204);
                } catch (e) {
                    err = <Chai.AssertionError>e;
                } finally {
                    cb(err, res);
                }
            })
    }
}
