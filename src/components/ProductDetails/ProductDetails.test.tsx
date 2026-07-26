import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductDetails } from './ProductDetails';
import { ModalProvider } from '@/contexts/ModalContext';
import { ModalManager } from '@/components';
import { useCartStore } from '@/stores/cartStore';
import { mockProduct } from '@/data/product';

jest.mock('@/components/UserInitializer/UserInitializer', () => ({
	__esModule: true,
	UserInitializer: () => null,
}));
jest.mock('next/image');
jest.mock('next/link');
jest.mock('next/navigation', () => ({
	__esModule: true,
	usePathname: jest.fn().mockReturnValue('/'),
}));
jest.mock('@/api/products', () => ({
	__esModule: true,
	fetchDetailsBySlug: jest.fn().mockResolvedValue([]),
}));

const renderProduct = () =>
	render(
		<ModalProvider>
			<ModalManager />
			<ProductDetails product={mockProduct} />
		</ModalProvider>
	);

describe('<ProductDetails />', () => {
	beforeEach(() => {
		useCartStore.setState({ items: [] });
		localStorage.clear();
	});

	it('shows a validation message when adding without a selected size', async () => {
		const user = userEvent.setup();
		renderProduct();

		const addButton = screen.getByRole('button', { name: /add to bag/i });
		await user.click(addButton);

		await waitFor(() => {
			expect(screen.getByText('Please select a size')).toBeInTheDocument();
		});
	});

	it('adds the product and opens the bag drawer with the selected size', async () => {
		const user = userEvent.setup();
		renderProduct();

		await user.click(screen.getByRole('button', { name: 'S' }));
		await user.click(screen.getByRole('button', { name: /add to bag/i }));

		await waitFor(() => {
			expect(screen.getByRole('dialog', { name: /my bag/i })).toBeInTheDocument();
		});

		const dialog = screen.getByRole('dialog', { name: /my bag/i });
		expect(within(dialog).getByText(mockProduct.title)).toBeInTheDocument();
		expect(within(dialog).getByText('QTY: 1')).toBeInTheDocument();
		expect(within(dialog).getByText(`$${mockProduct.discountPrice!.toFixed(2)}`, { selector: '.price' })).toBeInTheDocument();
	});

	it('increases and decreases quantity inside the drawer', async () => {
		const user = userEvent.setup();
		renderProduct();

		await user.click(screen.getByRole('button', { name: 'S' }));
		await user.click(screen.getByRole('button', { name: /add to bag/i }));

		await waitFor(() => {
			expect(screen.getByRole('dialog', { name: /my bag/i })).toBeInTheDocument();
		});

		const dialog = screen.getByRole('dialog', { name: /my bag/i });
		const increase = within(dialog).getByRole('button', { name: /increase quantity/i });
		const decrease = within(dialog).getByRole('button', { name: /decrease quantity/i });

		await user.click(increase);
		expect(within(dialog).getByText('QTY: 2')).toBeInTheDocument();

		await user.click(decrease);
		expect(within(dialog).getByText('QTY: 1')).toBeInTheDocument();
		expect(decrease).toBeDisabled();
	});

	it('removes an item and updates the drawer', async () => {
		const user = userEvent.setup();
		renderProduct();

		await user.click(screen.getByRole('button', { name: 'S' }));
		await user.click(screen.getByRole('button', { name: /add to bag/i }));

		await waitFor(() => {
			expect(screen.getByRole('dialog', { name: /my bag/i })).toBeInTheDocument();
		});

		const dialog = screen.getByRole('dialog', { name: /my bag/i });
		await user.click(within(dialog).getByRole('button', { name: /remove item/i }));

		await waitFor(() => {
			expect(screen.getByText('Your bag is empty')).toBeInTheDocument();
		});
	});

	it('calculates the subtotal in the drawer', async () => {
		const user = userEvent.setup();
		renderProduct();

		await user.click(screen.getByRole('button', { name: 'S' }));
		await user.click(screen.getByRole('button', { name: /add to bag/i }));
		await waitFor(() => {
			expect(screen.getByRole('dialog', { name: /my bag/i })).toBeInTheDocument();
		});

		const dialog = screen.getByRole('dialog', { name: /my bag/i });
		await user.click(within(dialog).getByRole('button', { name: /increase quantity/i }));

		const expected = (mockProduct.discountPrice! * 2).toFixed(2);
		await waitFor(() => {
			expect(within(dialog).getByText(`$${expected}`)).toBeInTheDocument();
		});
	});

	it('closes the drawer when the close button is clicked', async () => {
		const user = userEvent.setup();
		renderProduct();

		await user.click(screen.getByRole('button', { name: 'S' }));
		await user.click(screen.getByRole('button', { name: /add to bag/i }));

		await waitFor(() => {
			expect(screen.getByRole('dialog', { name: /my bag/i })).toBeInTheDocument();
		});

		await user.click(screen.getByRole('button', { name: /close dialog/i }));

		await waitFor(() => {
			expect(screen.queryByRole('dialog', { name: /my bag/i })).not.toBeInTheDocument();
		});
	});
});
