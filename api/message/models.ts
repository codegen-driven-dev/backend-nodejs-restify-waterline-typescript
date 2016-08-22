import {IMessage} from './models.d';

export const Message = {
    identity: 'message_tbl',
    connection: 'postgres',
    _omit: [/*'uuid'*/],
    beforeCreate: function (msg: IMessage, next) {
        if (msg.createdAt === undefined || msg.uuid === undefined) {
            msg.createdAt = new Date();
            msg.uuid = `${msg.from}::${msg.to}::${msg.createdAt.toISOString()}`;
        }
        // TODO: Date validation (is provided date within <threshold> of server date?)
        next();
    },
    attributes: {
        uuid: {
            type: 'string',
            primaryKey: true
        },
        message: {
            type: 'string',
            required: true
        },
        to: {
            type: 'string',
            required: true
        },
        from: {
            type: 'string',
            required: true
        },
        toJSON: function toJSON() {
            let msg: IMessage = this.toObject();
            Message._omit.map(k => delete msg[k]);
            for (const key in msg)
                if (msg.hasOwnProperty(key) && !msg[key]) delete msg[key];
            return msg;
        }
    }
};
