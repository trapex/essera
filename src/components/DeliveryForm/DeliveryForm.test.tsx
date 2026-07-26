import { render, screen } from '@testing-library/react';
import { DeliveryForm } from './DeliveryForm';

describe('DeliveryForm', () => {
	it('renders all checkout fields with connected floating labels', () => {
		render(<DeliveryForm />);

		const fields = [
			'Country/Region *',
			'First Name *',
			'Last Name *',
			'Address *',
			'Apartment, suite, etc.',
			'City *',
			'State *',
			'ZIP Code *',
			'Phone *',
		];

		fields.forEach((labelText) => {
			expect(screen.getByLabelText(labelText)).toBeInTheDocument();
		});
	});
});
