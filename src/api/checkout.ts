import { ApiError, apiClientAuth } from '@/api/apiClient';
import type {
	CheckoutPaymentDTO,
	CreateCheckoutPaymentDTO,
	PaymentStatusDTO,
} from '@/interfaces/checkout.interface';

/**
 * Opens a Stripe Checkout Session for the cart. The bearer token is attached when the
 * buyer is signed in, which links the order to them; a guest may pass an email instead.
 */
export function createCheckoutPayment(payload: CreateCheckoutPaymentDTO, signal?: AbortSignal) {
	return apiClientAuth<CheckoutPaymentDTO>('/checkout/payment', {
		method: 'POST',
		body: JSON.stringify(payload),
		signal,
	});
}

/** Payment state of an order. Only this — never the Stripe redirect — confirms a payment. */
export function fetchPaymentStatus(orderId: string, signal?: AbortSignal) {
	return apiClientAuth<PaymentStatusDTO>(`/checkout/payment/${orderId}`, { signal });
}

const GENERIC_ERROR = 'We could not start the payment. Please try again in a moment.';

/**
 * A message safe to render. The cart errors (`404`/`409`) name the product and are meant
 * for the buyer; anything else — Stripe, network, unexpected statuses — is generic, so no
 * provider or transport detail reaches the page.
 */
export function checkoutErrorMessage(error: unknown): string {
	if (!(error instanceof ApiError)) {
		return 'We could not reach the store. Please check your connection and try again.';
	}

	switch (error.status) {
		case 400:
			return 'Something in your cart is not valid. Please review it and try again.';
		case 404:
		case 409:
			return error.serverMessage ?? 'An item in your cart is no longer available. Please review your cart.';
		case 401:
		case 403:
			return 'Your session has expired. Please sign in again and retry.';
		default:
			return GENERIC_ERROR;
	}
}
