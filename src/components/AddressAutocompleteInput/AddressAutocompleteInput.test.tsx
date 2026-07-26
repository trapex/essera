import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';
import { ParsedAddress } from '@/hooks/useAddressAutocomplete';

const mockToken = { __tag: 'token' };

const defaultAddressComponents = [
	{ longText: '3517', shortText: '3517', types: ['street_number'] },
	{ longText: 'West Main Street', shortText: 'W Main St', types: ['route'] },
	{ longText: 'Houston', shortText: 'Houston', types: ['locality', 'political'] },
	{ longText: 'Texas', shortText: 'TX', types: ['administrative_area_level_1', 'political'] },
	{ longText: '77002', shortText: '77002', types: ['postal_code'] },
	{ longText: 'United States', shortText: 'US', types: ['country', 'political'] },
];

const missingCityComponents = [
	{ longText: '3517', shortText: '3517', types: ['street_number'] },
	{ longText: 'West Main Street', shortText: 'W Main St', types: ['route'] },
	{ longText: 'Texas', shortText: 'TX', types: ['administrative_area_level_1', 'political'] },
	{ longText: '77002', shortText: '77002', types: ['postal_code'] },
	{ longText: 'United States', shortText: 'US', types: ['country', 'political'] },
];

const defaultSuggestions = [
	{
		placePrediction: {
			placeId: 'ChIJ123',
			text: { text: '3517 West Main Street, Houston, TX, USA' },
			mainText: { text: '3517 West Main Street' },
			secondaryText: { text: 'Houston, TX, USA' },
		},
	},
];

const mockFetchFields = jest.fn();
const mockFetchSuggestions = jest.fn();
const mockPlaceConstructor = jest.fn();

const createMockPlace = (addressComponents: { longText: string; shortText: string; types: string[] }[]) => ({
	id: 'ChIJ123',
	addressComponents,
	fetchFields: mockFetchFields,
});

beforeAll(() => {
	Object.defineProperty(window, 'google', {
		value: {
			maps: {
				places: {
					AutocompleteSessionToken: jest.fn(() => mockToken),
					AutocompleteSuggestion: {
						fetchAutocompleteSuggestions: mockFetchSuggestions,
					},
					Place: mockPlaceConstructor,
				},
			},
		},
		configurable: true,
	});
});

beforeEach(() => {
	jest.clearAllMocks();
	mockFetchSuggestions.mockResolvedValue({ suggestions: defaultSuggestions });
	mockFetchFields.mockResolvedValue({});
	mockPlaceConstructor.mockImplementation(() => createMockPlace(defaultAddressComponents));
});

interface WrapperProps {
	initial?: string;
	onSelect?: (parsed: ParsedAddress) => void;
}

const Wrapper = ({ initial = '', onSelect = jest.fn() }: WrapperProps) => {
	const [value, setValue] = useState(initial);

	return (
		<AddressAutocompleteInput
			id="address"
			name="address"
			label="Address"
			value={value}
			onChange={(e) => setValue(e.target.value)}
			onAddressSelect={(parsed) => {
				setValue(parsed.address);
				onSelect(parsed);
			}}
		/>
	);
};

const openSuggestions = async (input: HTMLElement, value = '351') => {
	fireEvent.change(input, { target: { value } });
	await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());
};

describe('AddressAutocompleteInput', () => {
	it('renders the Address input with a connected floating label', () => {
		render(<Wrapper />);
		const input = screen.getByLabelText('Address');
		expect(input).toBeInTheDocument();
		expect(input).toHaveAttribute('role', 'combobox');
	});

	it('shows address suggestions after typing at least 3 characters and debounces requests', async () => {
		render(<Wrapper />);
		const input = screen.getByLabelText('Address');

		await openSuggestions(input, '351');

		expect(mockFetchSuggestions).toHaveBeenCalledTimes(1);
		const request = mockFetchSuggestions.mock.calls[0][0];
		expect(request.includedRegionCodes).toEqual(['us']);
		expect(request.includedPrimaryTypes).toBeUndefined();

		expect(screen.getByRole('listbox')).toBeInTheDocument();
		expect(screen.getByText('3517 West Main Street')).toBeInTheDocument();
	});

	it('selecting a suggestion fills the address and related fields', async () => {
		const onSelect = jest.fn();
		render(<Wrapper onSelect={onSelect} />);
		const input = screen.getByLabelText('Address');

		await openSuggestions(input, '351');
		const option = screen.getByRole('option');
		fireEvent.pointerDown(option, { pointerType: 'mouse' });

		await waitFor(() =>
			expect(onSelect).toHaveBeenCalledWith(
				expect.objectContaining({
					address: '3517 West Main Street',
					city: 'Houston',
					state: 'TX',
					zip: '77002',
					country: 'United States',
				})
			)
		);
	});

	it('keeps floating labels raised after programmatic population', async () => {
		render(<Wrapper onSelect={jest.fn()} />);
		const input = screen.getByLabelText('Address');

		await openSuggestions(input, '351');
		const option = screen.getByRole('option');
		fireEvent.pointerDown(option, { pointerType: 'mouse' });

		const label = screen.getByText('Address');
		await waitFor(() => expect(label).toHaveClass('labelFloating'));
	});

	it('supports keyboard navigation to select a suggestion', async () => {
		const onSelect = jest.fn();
		render(<Wrapper onSelect={onSelect} />);
		const input = screen.getByLabelText('Address');

		await openSuggestions(input, '351');
		fireEvent.keyDown(input, { key: 'ArrowDown' });
		fireEvent.keyDown(input, { key: 'Enter' });

		await waitFor(() =>
			expect(onSelect).toHaveBeenCalledWith(
				expect.objectContaining({
					address: '3517 West Main Street',
					state: 'TX',
				})
			)
		);
	});

	it('closes the suggestion list on Escape', async () => {
		render(<Wrapper />);
		const input = screen.getByLabelText('Address');

		await openSuggestions(input, '351');
		expect(screen.queryByRole('listbox')).toBeInTheDocument();

		fireEvent.keyDown(input, { key: 'Escape' });
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});

	it('closes the suggestion list when clicking outside', async () => {
		render(<Wrapper />);
		const input = screen.getByLabelText('Address');

		await openSuggestions(input, '351');
		expect(screen.queryByRole('listbox')).toBeInTheDocument();

		fireEvent.mouseDown(document.body);
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});

	it('allows manual editing after an address is selected', async () => {
		render(<Wrapper onSelect={jest.fn()} />);
		const input = screen.getByLabelText('Address');

		await openSuggestions(input, '351');
		const option = screen.getByRole('option');
		fireEvent.pointerDown(option, { pointerType: 'mouse' });

		await waitFor(() => expect(input).toHaveValue('3517 West Main Street'));

		fireEvent.change(input, { target: { value: 'Manual address' } });
		expect(input).toHaveValue('Manual address');
	});

	it('handles missing address components safely', async () => {
		mockPlaceConstructor.mockImplementationOnce(() => createMockPlace(missingCityComponents));
		const onSelect = jest.fn();
		render(<Wrapper onSelect={onSelect} />);
		const input = screen.getByLabelText('Address');

		await openSuggestions(input, '351');
		const option = screen.getByRole('option');
		fireEvent.pointerDown(option, { pointerType: 'mouse' });

		await waitFor(() =>
			expect(onSelect).toHaveBeenCalledWith(
				expect.objectContaining({
					address: '3517 West Main Street',
					city: '',
					state: 'TX',
					zip: '77002',
					country: 'United States',
				})
			)
		);
	});

	it('does not break the form when autocomplete is unavailable', async () => {
		mockFetchSuggestions.mockRejectedValueOnce(new Error('REQUEST_DENIED'));
		const onSelect = jest.fn();
		render(<Wrapper onSelect={onSelect} />);
		const input = screen.getByLabelText('Address');

		fireEvent.change(input, { target: { value: '351' } });
		await waitFor(() => expect(mockFetchSuggestions).toHaveBeenCalled());
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		expect(input).toHaveValue('351');
	});
});
