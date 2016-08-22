import * as restify from 'restify';
import {waterfall} from 'async';
import {Query, WLError} from 'waterline';
import {has_body, mk_valid_body_mw, mk_valid_body_mw_ignore} from 'restify-validators';
import {NotFoundError, fmtError} from 'restify-errors';
import {has_auth} from './../auth/middleware';
import {IMessage, IMessageBase} from './models.d';
import {c} from '../../main';


const message_schema: tv4.JsonSchema = require('./../../test/api/message/schema');

export function read(app: restify.Server, namespace: string = ""): void {
    app.get(`${namespace}/:to/:uuid`, has_auth(),
        function (req: restify.Request, res: restify.Response, next: restify.Next) {
            const Message: Query = c.collections['message_tbl'];

            Message.findOne({from: req['user_id'], to: req.params.to}, (error: WLError, message: IMessage) => {
                if (error) return next(fmtError(error));
                else if (!message) return next(new NotFoundError('Message'));
                res.json(message);
                return next();
            });
        }
    );
}

export function update(app: restify.Server, namespace: string = ""): void {
    app.put(`${namespace}/:to/:uuid`, has_body, mk_valid_body_mw(message_schema, false),
        mk_valid_body_mw_ignore(message_schema, ['Missing required property']), has_auth(),
        function (req: restify.Request, res: restify.Response, next: restify.Next) {
            const Message: Query = c.collections['message_tbl'];

            waterfall([
                cb => Message.findOne({to: req.params.to, from: req['user_id'], uuid: req.params.uuid},
                    (err: WLError, msg: IMessage) => {
                        if (err) return cb(err);
                        else if (!msg) return cb(new NotFoundError('Message'));
                        return cb(err, msg)
                    }),
                (msg: IMessageBase, cb) =>
                    Message.update(msg, req.body, (e, messages: IMessage[]) => cb(e, messages[0]))
            ], (error, message: IMessage) => {
                if (error) return next(fmtError(error));
                res.json(200, message);
                return next()
            });
        }
    );
}

export function del(app: restify.Server, namespace: string = ""): void {
    app.del(`${namespace}/:to/:uuid`, has_auth(),
        function (req: restify.Request, res: restify.Response, next: restify.Next) {
            const Message: Query = c.collections['message_tbl'];

            Message.destroy({to: req.params.to, from: req['user_id'], uuid: req.params.uuid}).exec(error => {
                if (error) return next(fmtError(error));
                res.send(204);
                return next();
            });
        }
    );
}
