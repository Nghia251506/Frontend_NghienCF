export interface Combo {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

export interface BookingData {
  fullName: string;
  phone: string;
  combo: string;
  quantity: number;
  totalPrice: number;
  seatNumbers: string[];
}

export interface PaymentResponse {
  success: boolean;
  qrCode: string;
  orderId: string;
}