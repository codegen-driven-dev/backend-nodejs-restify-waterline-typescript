import {IMessageBase} from '../../../api/message/models.d';
import {IObjectCtor} from '../../../main';
import {IUserBase} from '../../../api/user/models.d';

declare var Object: IObjectCtor;

export const message_mocks: (users: Array<IUserBase>) => { successes: Array<IMessageBase>, failures: Array<{}> } =
    (users: Array<IUserBase>) => ({
        "failures": [
            {},
            {"email": "foo@bar.com "},
            {"password": "foo "},
            {"email": "foo@bar.com", "password": "foo", "bad_prop": true}
        ],
        "successes": [
            `can ${Math.random()} count`, `can ${Math.random()} count`
        ].map(msg => <IMessageBase>Object.assign(msg, ((date: Date) =>
            users.forEach((user: IUserBase, idx: number) => ({
                uuid: `${user[idx === 0 ? 1 : 0].email}::${user.email}::${date}`, createdAt: date, updatedAt: date,
                to: user.email, from: user[idx === 0 ? 1 : 0].email
            })))(new Date())
        ))
    });
