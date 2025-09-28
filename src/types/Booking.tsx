export interface Booking{
    id: number;
    showId: number;
    ticketTypeId: number;
    customerName: string;
    phone: string;
    quantity: number;
    totalAmount: number;
    paymentStatus: string;
    paymentTime: Date;
}

export interface BookingDto{
    showId: number;
    customerName: string;
    phone: string;
    ticketTypeId: number;
    quantity: number;
}