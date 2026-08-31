import { render, screen, waitFor } from '@testing-library/react';
import { CheckoutSuccess } from './CheckoutSuccess';
import { useCartStore } from '@/stores/cartStore';
import { fetchPaymentStatus } from '@/api/checkout';
import type { PaymentStatusDTO } from '@/interfaces/checkout.interface';

jest.mock('next/link');
jest.mock('@/components/UserInitializer/UserInitializer', () => ({
	__esModule: true,
	UserInitializer: () => null,
}));
jest.mock('@/api/checkout', () => ({ fetchPaymentStatus: jest.fn() }));

const searchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({ useSearchParams: () => searchParams }));

const status = fetchPaymentStatus as jest.MockedFunction<typeof fetchPaymentStatus>;

const order = (overrides: Partial<PaymentStatusDTO> = {}): PaymentStatusDTO => ({
	id: 'order-1',
	status: 'PENDING',
	totalAmount: 10000,
	currency: 'usd',
	paidAt: null,
	...overrides,
});

const mockEntry = {
	product: { id: 1, images: [], slug: 'white-bra', title: 'White Bra', price: 50 },
	size: 'S',
	color: 'black',
	quantity: 2,
};

beforeEach(() => {
	jest.clearAllMocks();
	localStorage.clear();
	searchParams.set('orderId', 'order-1');
	useCartStore.setState({ items: [mockEntry] });
});

describe('<CheckoutSuccess />', () => {
	it('confirms the payment against the backend rather than trusting the redirect', async () => {
		status.mockResolvedValue(order({ status: 'PAID', paidAt: '2026-08-25T00:00:00.000Z' }));

		render(<CheckoutSuccess />);

		expect(screen.getByText(/confirming your payment/i)).toBeInTheDocument();
		expect(await screen.findByText(/thank you for your order/i)).toBeInTheDocument();
		expect(status).toHaveBeenCalledWith('order-1', expect.anything());
		expect(screen.getByRole('link', { name: /continue shopping/i })).toBeInTheDocument();
	});

	it('clears the cart only once the backend reports the order paid', async () => {
		status.mockResolvedValue(order({ status: 'PAID' }));

		render(<CheckoutSuccess />);

		await waitFor(() => expect(useCartStore.getState().items).toHaveLength(0));
	});

	it('keeps the cart and says so when the payment failed', async () => {
		status.mockResolvedValue(order({ status: 'FAILED' }));

		render(<CheckoutSuccess />);

		expect(await screen.findByText(/did not go through/i)).toBeInTheDocument();
		expect(useCartStore.getState().items).toHaveLength(1);
		expect(screen.getByRole('link', { name: /back to checkout/i })).toBeInTheDocument();
	});

	it('does not call the backend without an order id', () => {
		searchParams.delete('orderId');

		render(<CheckoutSuccess />);

		expect(status).not.toHaveBeenCalled();
		expect(screen.getByText(/could not find that order/i)).toBeInTheDocument();
	});
});
