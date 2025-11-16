export interface TicketType{
    id: number;
    showId: number;
    name: string;
    color: string;
    price: number;
    totalQuantity: number;
    remainingQuantity?: number;
    description: string;
    available?:number;
    seatUnit?:number;
}

export interface TicketTypeCreateDto{
    showId: number;
    name: string;
    color: string;
    price: number;
    totalQuantity: number;
    description: string;
    seatUnit?:number
}