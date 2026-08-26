// Mirrors the backend checkout contract (`POST /checkout/payment`,
// `GET /checkout/payment/:orderId`). Prices are never sent: the backend
// recomputes every line from the database.

export interface CheckoutItemDTO {
	productId: number;
	variant: string;       // variant colour, e.g. "black"
	size: string;          // e.g. "34B"
	quantity: number;
}

export interface CreateCheckoutPaymentDTO {
	items: CheckoutItemDTO[];
	email?: string;        // guest receipt address; ignored when authenticated
}

// Everything needed to hand the buyer over to Stripe Checkout.
export interface CheckoutPaymentDTO {
	orderId: string;
	sessionId: string;
	url: string;           // hosted Stripe Checkout URL to redirect to
	amount: number;        // total in minor units
	currency: string;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface PaymentStatusDTO {
	id: string;
	status: OrderStatus;
	totalAmount: number;   // minor units
	currency: string;
	paidAt: string | null;
}
