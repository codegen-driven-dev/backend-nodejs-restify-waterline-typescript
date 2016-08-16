import * as restify from 'restify';
import {waterfall} from 'async';
import {Query, WLError} from 'waterline';
import {has_body, mk_valid_body_mw, mk_valid_body_mw_ignore} from 'restify-validators';
import {isShallowSubset} from 'nodejs-utils';
import {NotFoundError, fmtError} from 'restify-errors';
import {has_auth} from './../auth/middleware';
import {IMessage, IMessageBase} from './models.d';
import {c} from '../../main';


const message_schema: tv4.JsonSchema = require('./../../test/api/message/schema');

export function create(app: restify.Server, namespace: string = ""): void {
    app.post(`${namespace}/:to`, has_auth(), has_body, mk_valid_body_mw(message_schema),
        function (req: restify.Request, res: restify.Response, next: restify.Next) {
            const Message: Query = c.collections['message_tbl'];

            req.body.from = req['user_id'];
            req.body.to = req.params.to;
            Message.create(req.body).exec((error: WLError|Error, msg: IMessage) => {
                if (error) return next(fmtError(error));
                else if (!msg) return next(new NotFoundError('Message'));
                res.json(201, msg);
                return next();
            });
        }
    )
}

export function read(app: restify.Server, namespace: string = ""): void {
    app.get(`${namespace}/:to`, has_auth(),
        function (req: restify.Request, res: restify.Response, next: restify.Next) {
            const Message: Query = c.collections['message_tbl'];

            Message.find({from: req['user_id'], to: req.params.to}, (error: WLError, messages: IMessage[]) => {
                if (error) return next(fmtError(error));
                else if (!messages) return next(new NotFoundError('Message'));
                res.json({messages: messages, from: req['user_id'], to: req.params.to});
                return next();
            });
        }
    );
}

export function update(app: restify.Server, namespace: string = ""): void {
    app.put(`${namespace}/:to/:datetime`, has_body, mk_valid_body_mw(message_schema, false),
        mk_valid_body_mw_ignore(message_schema, ['Missing required property']), has_auth(),
        function (req: restify.Request, res: restify.Response, next: restify.Next) {
            if (!isShallowSubset(req.body, message_schema.properties))
                return res.json(400, {
                        error: 'ValidationError',
                        error_message: 'Invalid keys detected in body'
                    }) && next();
            else if (!req.body || !Object.keys(req.body).length)
                return res.json(400, {error: 'ValidationError', error_message: 'Body required'}) && next();

            const Message: Query = c.collections['message_tbl'];

            waterfall([
                cb => Message.findOne({to: req.params.to, from: req['user_id'], datetime: req['datetime']},
                    (err: WLError, msg: IMessage) => {
                        if (err) cb(err);
                        else if (!msg) cb(new NotFoundError('Message'));
                        return cb(err, msg)
                    }),
                (msg: IMessageBase, cb) =>
                    Message.update(msg, req.body, (e, messages: IMessage[]) => cb(e, messages[0]))
            ], (error, msg: IMessage) => {
                if (error) return next(fmtError(error));
                res.json(200, msg);
                return next()
            });
        }
    );
}

export function del(app: restify.Server, namespace: string = ""): void {
    app.del(`${namespace}/:to/:datetime`, has_auth(),
        function (req: restify.Request, res: restify.Response, next: restify.Next) {
            const Message: Query = c.collections['message_tbl'];

            Message.destroy({to: req.params.to, from: req['user_id'], datetime: req['datetime']}, error => {
                if (error) return next(fmtError(error));
                res.status(204);
                return next();
            });
        }
    );
}
