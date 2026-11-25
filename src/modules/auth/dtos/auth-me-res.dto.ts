import Role from "../entities/role.entity";

export default class AuthMeRes {
    public firstName: string;
    public lastName: string;
    public email: string;
    public roles: Role[];

    public constructor(firstName: string, lastName: string, email: string, roles: Role[]) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.roles = roles;
    }
}