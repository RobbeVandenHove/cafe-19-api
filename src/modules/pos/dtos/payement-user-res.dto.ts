
export default class PayementUserDTO {
    public id: string;
    public initials: string;
    public name: string;
    public email: string;
    public budget: number;
    public overdraft: number;

    public constructor(id: string, initials: string, name: string, email: string, budget: number, overdraft: number) {
        this.id = id;
        this.initials = initials;
        this.name = name;
        this.email = email;
        this.budget = budget;
        this.overdraft = overdraft;
    }
}