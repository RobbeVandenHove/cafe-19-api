import { UUID } from "crypto";

export default class FirefighterResDTO {
    public id: string;
    public initials: string;
    public fullName: string;
    public email: string;
    public isLeader?: boolean;
    public isAdmin?: boolean;
    public isBookkeeper?: boolean;

    public constructor(id: string, initials: string, fullName: string, email: string, isLeader?: boolean, isAdmin?: boolean, isBookkeeper?: boolean) {
        this.id = id;
        this.initials = initials
        this.fullName = fullName;
        this.email = email;
        this.isLeader = isLeader;
        this.isAdmin = isAdmin;
        this.isBookkeeper = isBookkeeper;
    }
}