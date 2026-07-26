import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckoutCart } from './CheckoutCart';
import { useCartStore } from '@/stores/cartStore';

jest.mock('next/image');
jest.mock('next/link');
jest.mock('@/components/UserInitializer/UserInitializer', () => ({
	__esModule: true,
	UserInitializer: () => null,
}));

const mockProduct = {
	id: 1,
	images: ['/products/test.jpg'],
	slug: 'white-bra',
	title: 'White Bra',
	price: 50,
};

const mockEntry = {
	product: mockProduct,
	size: 'S',
	color: 'black',
	quantity: 2,
};

beforeEach(() => {
	useCartStore.setState({ items: [] });
	localStorage.clear();
});

describe('<CheckoutCart />', () => {
	it('shows the mobile order summary header collapsed by default', () => {
		render(<CheckoutCart />);

		const toggle = screen.getByRole('button', { name: /order summary/i });
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		expect(toggle).toHaveAttribute('aria-controls');
	});

	it('expands on tap and collapses on second tap', async () => {
		const user = userEvent.setup();
		render(<CheckoutCart />);

		const toggle = screen.getByRole('button', { name: /order summary/i });
		await user.click(toggle);
		expect(toggle).toHaveAttribute('aria-expanded', 'true');

		await user.click(toggle);
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
	});

	it('renders cart items correctly', () => {
		useCartStore.setState({ items: [mockEntry] });
		render(<CheckoutCart />);

		expect(screen.getByText('White Bra')).toBeInTheDocument();
		expect(screen.getByText('S')).toBeInTheDocument();
		expect(screen.getByText('color: black')).toBeInTheDocument();
		expect(screen.getByText('2')).toBeInTheDocument();
		expect(screen.getByText('$50.00')).toBeInTheDocument();
		expect(
			within(screen.getByText('Total').parentElement as HTMLElement).getByText('$100.00')
		).toBeInTheDocument();
	});

	it('keeps totals correct', () => {
		useCartStore.setState({
			items: [
				{ ...mockEntry, quantity: 1 },
				{
					product: { ...mockProduct, id: 2, title: 'Silk Brief', price: 30 },
					size: 'M',
					color: 'white',
					quantity: 1,
				},
			],
		});
		render(<CheckoutCart />);

		expect(
			within(screen.getByText('Total').parentElement as HTMLElement).getByText('$80.00')
		).toBeInTheDocument();
	});

	it('shows the empty cart message when there are no items', () => {
		render(<CheckoutCart />);
		expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
	});

	it('keeps the order summary content region associated with the toggle button', () => {
		render(<CheckoutCart />);

		const toggle = screen.getByRole('button', { name: /order summary/i });
		const controls = toggle.getAttribute('aria-controls');
		const region = document.getElementById(controls!);

		expect(region).toHaveAttribute('role', 'region');
		expect(region).toHaveAttribute('aria-labelledby', toggle.id);
	});
});
