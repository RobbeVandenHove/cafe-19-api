import UserStampcardHistoryListResDTO from "./user-stampcard-history-list-res.dto";

export default class UserStampcardListResDTO {
    public id: string;
    public name: string;
    public email: string;
    public budget: number;
    public history: UserStampcardHistoryListResDTO[];

    public constructor(id: string, name: string, email: string, budget: number, history: UserStampcardHistoryListResDTO[]) {
        this.id = id;
        this.name = name;
        this.email = email
        this.budget = budget;
        this.history = history;
    }
}

