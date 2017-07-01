import { IObjectCtor } from '../../../main';
import { IContactBase } from '../../../api/contact/models.d';
import { IUserBase } from '../../../api/user/models.d';
import { user_mocks } from '../user/user_mocks';

declare const Object: IObjectCtor;

export const contact_mocks: (users: IUserBase[]) => {successes: IContactBase[], failures: Array<{}>} =
    (users: IUserBase[]) => ({
        failures: [
            {},
            { email: 'foo@bar.com ' },
            { password: 'foo ' },
            { email: 'foo@bar.com', password: 'foo', bad_prop: true }
        ],
        successes: ((ob: IContactBase[] = []) => [
            `can ${Math.random()} count`, `can ${Math.random()} count`
        ].forEach(msg => ((date: Date) =>
            users.forEach((user: IUserBase, idx: number) => ob.push({
                email: user.email,
                owner: users[idx === 0 ? 1 : 0].email
            } as IContactBase)))(new Date())
        ) || ob)() as IContactBase[]
    });

if (require.main === module) {
    /* tslint:disable:no-console */
    console.info(contact_mocks(user_mocks.successes.slice(20, 30)));
}
