import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';
import styles from './Select.module.css';

describe('Select', () => {
	it('keeps an accessible label connected to the select', () => {
		render(
			<Select label="State" id="state" name="state">
				<option value=""></option>
				<option value="NY">New York</option>
			</Select>
		);

		expect(screen.getByLabelText('State')).toBeInTheDocument();
	});

	it('shows the label in placeholder position when no option is selected', () => {
		render(
			<Select label="State" id="state" name="state">
				<option value=""></option>
				<option value="NY">New York</option>
			</Select>
		);

		expect(screen.getByText('State')).not.toHaveClass(styles.labelFloating);
	});

	it('floats the label and shows the selected value', async () => {
		render(
			<Select label="State" id="state" name="state">
				<option value=""></option>
				<option value="NY">New York</option>
			</Select>
		);

		const select = screen.getByLabelText('State');
		await userEvent.selectOptions(select, 'NY');

		expect(screen.getByText('State')).toHaveClass(styles.labelFloating);
		expect(select).toHaveValue('NY');
	});
});
