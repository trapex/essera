import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';
import styles from './Input.module.css';

describe('Input', () => {
	it('keeps an accessible label connected to the input', () => {
		render(<Input label="First Name" id="firstName" name="firstName" />);

		const input = screen.getByLabelText('First Name');
		expect(input).toBeInTheDocument();
		expect(input).toHaveAttribute('id', 'firstName');
	});

	it('shows the label in placeholder position when empty', () => {
		render(<Input label="First Name" id="firstName" name="firstName" />);

		const label = screen.getByText('First Name');
		expect(label).not.toHaveClass(styles.labelFloating);
	});

	it('floats the label on focus', async () => {
		render(<Input label="First Name" id="firstName" name="firstName" />);

		const input = screen.getByLabelText('First Name');
		await userEvent.click(input);

		expect(screen.getByText('First Name')).toHaveClass(styles.labelFloating);
	});

	it('keeps the label floating after typing and blurring', async () => {
		render(<Input label="First Name" id="firstName" name="firstName" />);

		const input = screen.getByLabelText('First Name');
		await userEvent.type(input, 'Tatiana');
		await userEvent.tab();

		const label = screen.getByText('First Name');
		expect(label).toHaveClass(styles.labelFloating);
		expect(input).toHaveValue('Tatiana');
	});

	it('keeps the label floating for a prefilled value', () => {
		render(<Input label="First Name" id="firstName" name="firstName" defaultValue="Tatiana" />);

		expect(screen.getByText('First Name')).toHaveClass(styles.labelFloating);
	});

	it('does not render a duplicate placeholder when a label is provided', () => {
		render(<Input label="First Name" id="firstName" name="firstName" />);

		const input = screen.getByLabelText('First Name');
		expect(input).not.toHaveAttribute('placeholder');
	});

	it('still exposes validation errors', () => {
		render(<Input label="First Name" id="firstName" name="firstName" isInvalid />);

		expect(screen.getByLabelText('First Name')).toHaveAttribute('aria-invalid', 'true');
	});
});
