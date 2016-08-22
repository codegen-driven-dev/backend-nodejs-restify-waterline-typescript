import * as restify from 'restify';
import {Query, WLError} from 'waterline';
import {has_body, mk_valid_body_mw} from 'restify-validators';
import {NotFoundError, fmtError} from 'restify-errors';
import {has_auth} from './../auth/middleware';
import {IMessage} from './models.d';
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
