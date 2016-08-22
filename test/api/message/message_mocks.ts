import {IMessageBase} from '../../../api/message/models.d';
import {IObjectCtor} from '../../../main';
import {IUserBase} from '../../../api/user/models.d';
import {user_mocks} from '../user/user_mocks';

declare var Object: IObjectCtor;

export const message_mocks: (users: Array<IUserBase>) => { successes: Array<IMessageBase>, failures: Array<{}> } =
    (users: Array<IUserBase>) => ({
        "failures": [
            {},
            {"email": "foo@bar.com "},
            {"password": "foo "},
            {"email": "foo@bar.com", "password": "foo", "bad_prop": true}
        ],
        "successes": <Array<IMessageBase>>((ob: Array<IMessageBase> = []) => [
            `can ${Math.random()} count`, `can ${Math.random()} count`
        ].forEach(msg => ((date: Date) =>
            users.forEach((user: IUserBase, idx: number) => ob.push(<IMessageBase>{
                uuid: `${users[idx === 0 ? 1 : 0].email}::${user.email}::${date.toISOString()}`,
                createdAt: date, updatedAt: date,
                to: user.email, from: users[idx === 0 ? 1 : 0].email, message: msg
            })))(new Date())
        ) || ob)()
    });

if (require.main === module) {
    console.info(message_mocks(user_mocks.successes.slice(20, 30)));
}
