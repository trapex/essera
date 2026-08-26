import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckoutCart } from './CheckoutCart';
import { DeliveryForm } from '@/components/DeliveryForm/DeliveryForm';
import { useCartStore } from '@/stores/cartStore';
import { ApiError } from '@/api/apiClient';
import { createCheckoutPayment } from '@/api/checkout';
import { redirectTo } from '@/utils/redirect';

jest.mock('next/image');
jest.mock('next/link');
jest.mock('@/components/UserInitializer/UserInitializer', () => ({
	__esModule: true,
	UserInitializer: () => null,
}));
jest.mock('@/api/checkout', () => ({
	...jest.requireActual('@/api/checkout'),
	createCheckoutPayment: jest.fn(),
}));
jest.mock('@/utils/redirect', () => ({ redirectTo: jest.fn() }));

const createPayment = createCheckoutPayment as jest.MockedFunction<typeof createCheckoutPayment>;
const redirect = redirectTo as jest.MockedFunction<typeof redirectTo>;

const session = {
	orderId: 'order-1',
	sessionId: 'cs_test_1',
	url: 'https://checkout.stripe.com/c/pay/cs_test_1',
	amount: 10000,
	currency: 'usd',
};

const mockEntry = {
	product: { id: 1, images: [], slug: 'white-bra', title: 'White Bra', price: 50 },
	size: 'S',
	color: 'black',
	quantity: 2,
};

const payButton = () => screen.getByRole('button', { name: /continue to payment|redirecting to payment/i });

beforeEach(() => {
	jest.clearAllMocks();
	localStorage.clear();
	useCartStore.setState({ items: [mockEntry] });
});

describe('<CheckoutCart /> payment', () => {
	it('sends the cart lines — and no prices — to the backend, then hands over to Stripe', async () => {
		const user = userEvent.setup();
		createPayment.mockResolvedValue(session);

		render(<CheckoutCart />);
		await user.click(payButton());

		await waitFor(() => expect(redirect).toHaveBeenCalledWith(session.url));
		expect(createPayment).toHaveBeenCalledWith({
			items: [{ productId: 1, variant: 'black', size: 'S', quantity: 2 }],
		});
	});

	it('keeps the cart until the payment is confirmed', async () => {
		const user = userEvent.setup();
		createPayment.mockResolvedValue(session);

		render(<CheckoutCart />);
		await user.click(payButton());

		await waitFor(() => expect(redirect).toHaveBeenCalled());
		expect(useCartStore.getState().items).toHaveLength(1);
	});

	it('disables the button and shows the loading state while the session is created', async () => {
		const user = userEvent.setup();
		let resolve: (value: typeof session) => void = () => {};
		createPayment.mockReturnValue(new Promise((r) => { resolve = r; }));

		render(<CheckoutCart />);
		await user.click(payButton());

		const button = payButton();
		expect(button).toBeDisabled();
		expect(button).toHaveAttribute('aria-busy', 'true');
		expect(button).toHaveTextContent(/redirecting to payment/i);

		resolve(session);
		await waitFor(() => expect(redirect).toHaveBeenCalled());
	});

	it('never creates two sessions, however fast the button is clicked twice', async () => {
		const user = userEvent.setup();
		createPayment.mockReturnValue(new Promise(() => {}));

		render(<CheckoutCart />);
		const button = payButton();
		await user.click(button);
		await user.click(button);

		expect(createPayment).toHaveBeenCalledTimes(1);
	});

	it('shows the backend message for a cart the backend rejects, and allows a retry', async () => {
		const user = userEvent.setup();
		createPayment.mockRejectedValue(new ApiError(409, '"White Bra" (black / S) has only 1 left'));

		render(<CheckoutCart />);
		await user.click(payButton());

		expect(await screen.findByRole('alert')).toHaveTextContent('"White Bra" (black / S) has only 1 left');
		expect(redirect).not.toHaveBeenCalled();
		expect(payButton()).toBeEnabled();
	});

	it('never leaks a transport failure to the buyer', async () => {
		const user = userEvent.setup();
		createPayment.mockRejectedValue(new TypeError('Failed to fetch'));

		render(<CheckoutCart />);
		await user.click(payButton());

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent(/check your connection/i);
		expect(alert).not.toHaveTextContent(/fetch/i);
	});

	it('reports a Stripe failure without naming the provider', async () => {
		const user = userEvent.setup();
		createPayment.mockRejectedValue(new ApiError(503, 'Could not start the payment'));

		render(<CheckoutCart />);
		await user.click(payButton());

		expect(await screen.findByRole('alert')).toHaveTextContent(/could not start the payment/i);
	});

	it('does not pay while the delivery form is incomplete', async () => {
		const user = userEvent.setup();

		render(
			<>
				<DeliveryForm />
				<CheckoutCart />
			</>,
		);
		await user.click(payButton());

		expect(createPayment).not.toHaveBeenCalled();
	});

	it('cannot be started with an empty cart', () => {
		useCartStore.setState({ items: [] });
		render(<CheckoutCart />);

		expect(payButton()).toBeDisabled();
	});
});
