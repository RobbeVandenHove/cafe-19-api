export default class UserStampcardHistoryListResDTO {
    public id: string;
    public number: number;
    public createdAt: Date;
    public isPaid: boolean;
    public leftOver: number;
    public price: number

    public constructor(id: string, number: number, createdAt: Date, isPaid: boolean, leftOver: number, price: number) {
        this.id = id;
        this.number = number;
        this.createdAt = createdAt;
        this.isPaid = isPaid;
        this.leftOver = leftOver;
        this.price = price;
    }
}