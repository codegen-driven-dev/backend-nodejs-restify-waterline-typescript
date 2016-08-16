import {Model, Record} from 'waterline';

export interface IMessage extends Model, Record, IMessageBase {
}

export interface IMessageBase {
    uuid: string;
    message: string;
    from: string;
    to: string;
}
