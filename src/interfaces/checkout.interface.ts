// Mirrors the backend checkout contract (`POST /checkout/payment`,
// `GET /checkout/payment/:orderId`). Prices are never sent: the backend
// recomputes every line from the database.

export interface CheckoutItemDTO {
	productId: number;
	variant: string;       // variant colour, e.g. "black"
	size: string;          // e.g. "34B"
	quantity: number;
}

// Delivery address stored on the order; it never affects pricing.
export interface ShippingAddressDTO {
	country: string;
	firstName: string;
	lastName: string;
	address: string;
	apartments?: string;
	city: string;
	state: string;
	zip: string;
	phone: string;
}

export interface CreateCheckoutPaymentDTO {
	items: CheckoutItemDTO[];
	email?: string;        // guest receipt address; ignored when authenticated
	shipping?: ShippingAddressDTO;
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
