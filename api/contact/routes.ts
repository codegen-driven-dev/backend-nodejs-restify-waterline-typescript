import * as restify from 'restify';
import { Query, WLError } from 'waterline';
import { fmtError, NotFoundError } from 'restify-errors';
import { has_body, mk_valid_body_mw } from 'restify-validators';
import { JsonSchema } from 'tv4';
import { c } from '../../main';
import { has_auth } from '../auth/middleware';
import { IContact } from './models.d';

/* tslint:disable:no-var-requires */
const contact_schema: JsonSchema = require('./../../test/api/contact/schema');

export const create = (app: restify.Server, namespace: string = ''): void => {
    const add_owner_mw = (req: restify.Request, res: restify.Response, next: restify.Next) => {
        req.body.owner = req['user_id'];
        return next();
    };

    app.post(namespace, has_auth(), has_body, add_owner_mw, mk_valid_body_mw(contact_schema),
        (req: restify.Request, res: restify.Response, next: restify.Next) => {
            const Contact: Query = c.collections['contact_tbl'];

            Contact.create(req.body).exec((error: WLError | Error, contact: IContact) => {
                if (error) return next(fmtError(error));
                else if (!contact) return next(new NotFoundError('Contact'));
                res.json(201, contact);
                return next();
            });
        }
    );
};

export const read = (app: restify.Server, namespace: string = ''): void => {
    app.get(namespace, has_auth(),
        (req: restify.Request, res: restify.Response, next: restify.Next) => {
            const Contact: Query = c.collections['contact_tbl'];

            Contact.find({ owner: req['user_id'] }, (error: WLError, contacts: IContact[]) => {
                if (error) return next(fmtError(error));
                else if (!contacts) return next(new NotFoundError('Contact'));
                res.json({ contacts, owner: req['user_id'] });
                return next();
            });
        }
    );
};
