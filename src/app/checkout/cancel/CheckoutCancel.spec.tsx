import { render, screen } from '@testing-library/react';
import CheckoutCancelPage from './page';
import { useCartStore } from '@/stores/cartStore';

jest.mock('next/link');
jest.mock('@/components/UserInitializer/UserInitializer', () => ({
	__esModule: true,
	UserInitializer: () => null,
}));

const mockEntry = {
	product: { id: 1, images: [], slug: 'white-bra', title: 'White Bra', price: 50 },
	size: 'S',
	color: 'black',
	quantity: 2,
};

describe('<CheckoutCancelPage />', () => {
	it('explains that nothing was charged and leads back to checkout', () => {
		useCartStore.setState({ items: [mockEntry] });

		render(<CheckoutCancelPage />);

		expect(screen.getByRole('heading', { name: /payment cancelled/i })).toBeInTheDocument();
		expect(screen.getByText(/nothing was charged/i)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /return to checkout/i })).toHaveAttribute('href', '/checkout');
	});

	it('leaves the cart untouched', () => {
		useCartStore.setState({ items: [mockEntry] });

		render(<CheckoutCancelPage />);

		expect(useCartStore.getState().items).toHaveLength(1);
	});
});
