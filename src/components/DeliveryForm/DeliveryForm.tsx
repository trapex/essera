'use client';
import { ChangeEvent, FocusEvent, useRef, useState } from 'react';
import { DeliveryFormProps } from './DeliveryForm.props';
import styles from './DeliveryForm.module.css';
import clsx from 'clsx';
import { Input } from '@/components/Input/Input';
import { AddressAutocompleteInput } from '@/components/AddressAutocompleteInput/AddressAutocompleteInput';
import type { ParsedAddress } from '@/hooks/useAddressAutocomplete';
import { DELIVERY_FORM_ID } from '@/constants/checkout';

interface FormValues {
	country: string;
	firstName: string;
	lastName: string;
	address: string;
	apartments: string;
	city: string;
	state: string;
	zip: string;
	phone: string;
}

const initialValues: FormValues = {
	country: 'United States',
	firstName: '',
	lastName: '',
	address: '',
	apartments: '',
	city: '',
	state: '',
	zip: '',
	phone: '+1 ',
};

const PHONE_MAX_DIGITS = 10;

const stripPhoneDigits = (value: string): string => {
	let digits = value.replace(/\D/g, '');
	if (digits.startsWith('1')) digits = digits.slice(1);
	return digits.slice(0, PHONE_MAX_DIGITS);
};

const formatPhone = (digits: string): string => {
	const n = digits.length;
	if (n === 0) return '+1 ';
	if (n <= 3) return `+1 (${digits}`;
	if (n <= 6) return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
	return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const phoneCaretPosition = (formatted: string, digitsBefore: number): number => {
	let count = 0;
	for (let i = 0; i < formatted.length; i++) {
		const ch = formatted[i];
		if (ch >= '0' && ch <= '9' && i > 1) {
			count++;
			if (count === digitsBefore) return i + 1;
		}
	}
	return formatted.length;
};

export const DeliveryForm = ({ children, className, ...props }: DeliveryFormProps) => {
	const [values, setValues] = useState<FormValues>(initialValues);
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const apartmentsRef = useRef<HTMLInputElement>(null);

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setValues((prev) => ({ ...prev, [name]: value }));
	};

	const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
		const { name } = e.target;
		setTouched((prev) => ({ ...prev, [name]: true }));
	};

	const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
		const input = e.currentTarget;
		const raw = input.value;
		const selectionStart = input.selectionStart ?? raw.length;
		const digitsBefore = stripPhoneDigits(raw.slice(0, selectionStart)).length;
		const digits = stripPhoneDigits(raw);
		const formatted = formatPhone(digits);
		const newCaret = phoneCaretPosition(formatted, digitsBefore);

		setValues((prev) => ({ ...prev, phone: formatted }));
		window.setTimeout(() => {
			input.setSelectionRange(newCaret, newCaret);
		}, 0);
	};

	const handleAddressSelect = (parsed: ParsedAddress) => {
		setValues((prev) => ({
			...prev,
			address: parsed.address,
			city: parsed.city,
			state: parsed.state,
			zip: parsed.zip,
			country: 'United States',
		}));
		apartmentsRef.current?.focus();
	};

	return (
		<form id={DELIVERY_FORM_ID} className={clsx(styles.form, className)} autoComplete="off" {...props}>
			<div className={clsx(styles.field)}>
				<Input
					label="Country/Region *"
					type="text"
					id="country"
					name="country"
					value={values.country}
					onChange={handleChange}
					onBlur={handleBlur}
					readOnly
					required
					minLength={2}
					isInvalid={Boolean(touched.country && !values.country)}
					autoComplete="country-name"
					className={styles.control}
				/>
			</div>
			<div className={clsx(styles.group)}>
				<div className={clsx(styles.field)}>
					<Input
						label="First Name *"
						type="text"
						id="firstName"
						name="firstName"
						value={values.firstName}
						onChange={handleChange}
						onBlur={handleBlur}
						required
						minLength={2}
						isInvalid={Boolean(touched.firstName && !values.firstName)}
						autoComplete="given-name"
						className={styles.control}
					/>
				</div>
				<div className={clsx(styles.field)}>
					<Input
						label="Last Name *"
						type="text"
						id="lastName"
						name="lastName"
						value={values.lastName}
						onChange={handleChange}
						onBlur={handleBlur}
						required
						minLength={2}
						isInvalid={Boolean(touched.lastName && !values.lastName)}
						autoComplete="family-name"
						className={styles.control}
					/>
				</div>
			</div>
			<div className={clsx(styles.field)}>
				<AddressAutocompleteInput
					label="Address *"
					type="text"
					id="address"
					name="address"
					value={values.address}
					onChange={handleChange}
					onBlur={handleBlur}
					onAddressSelect={handleAddressSelect}
					required
					minLength={2}
					isInvalid={Boolean(touched.address && !values.address)}
					autoComplete="street-address"
					className={styles.control}
				/>
			</div>
			<div className={clsx(styles.field)}>
				<Input
					label="Apartment, suite, etc."
					type="text"
					id="apartments"
					name="apartments"
					ref={apartmentsRef}
					value={values.apartments}
					onChange={handleChange}
					autoComplete="address-line2"
					className={styles.control}
				/>
			</div>
			<div className={clsx(styles.group)}>
				<div className={clsx(styles.field)}>
					<Input
						label="City *"
						type="text"
						id="city"
						name="city"
						value={values.city}
						onChange={handleChange}
						onBlur={handleBlur}
						required
						minLength={2}
						isInvalid={Boolean(touched.city && !values.city)}
						autoComplete="address-level2"
						className={styles.control}
					/>
				</div>
				<div className={clsx(styles.field)}>
					<Input
						label="State *"
						type="text"
						id="state"
						name="state"
						value={values.state}
						onChange={handleChange}
						onBlur={handleBlur}
						required
						minLength={2}
						isInvalid={Boolean(touched.state && !values.state)}
						autoComplete="address-level1"
						className={styles.control}
					/>
				</div>
				<div className={clsx(styles.field)}>
					<Input
						label="ZIP Code *"
						type="text"
						id="zip"
						name="zip"
						value={values.zip}
						onChange={handleChange}
						onBlur={handleBlur}
						required
						minLength={2}
						isInvalid={Boolean(touched.zip && !values.zip)}
						autoComplete="postal-code"
						className={styles.control}
					/>
				</div>
			</div>
			<div className={clsx(styles.field)}>
				<Input
					label="Phone *"
					type="tel"
					id="phone"
					name="phone"
					value={values.phone}
					onChange={handlePhoneChange}
					onBlur={handleBlur}
					inputMode="tel"
					required
					minLength={2}
					isInvalid={Boolean(touched.phone && values.phone === '+1 ')}
					autoComplete="tel"
					className={styles.control}
				/>
			</div>
			{children}
		</form>
	);
};
