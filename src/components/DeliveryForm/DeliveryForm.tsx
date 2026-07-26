'use client';
import { DeliveryFormProps } from './DeliveryForm.props';
import styles from './DeliveryForm.module.css';
import clsx from 'clsx';
import { Input } from '@/components/Input/Input';

export const DeliveryForm = ({ children, className, ...props }: DeliveryFormProps) => {

	return (
		<form className={clsx(styles.form, className)} autoComplete="off" {...props}>
			<div className={clsx(styles.field)}>
				<Input
					label="Country/Region"
					type="text"
					id="country"
					name="country"
					required
					minLength={2}
					autoComplete="country-name"
					className={styles.control}
				/>
			</div>
			<div className={clsx(styles.group)}>
				<div className={clsx(styles.field)}>
					<Input
						label="First Name"
						type="text"
						id="firstName"
						name="firstName"
						required
						minLength={2}
						autoComplete="given-name"
						className={styles.control}
					/>
				</div>
				<div className={clsx(styles.field)}>
					<Input
						label="Last Name"
						type="text"
						id="lastName"
						name="lastName"
						required
						minLength={2}
						autoComplete="family-name"
						className={styles.control}
					/>
				</div>
			</div>
			<div className={clsx(styles.field)}>
				<Input
					label="Address"
					type="text"
					id="address"
					name="address"
					required
					minLength={2}
					autoComplete="street-address"
					className={styles.control}
				/>
			</div>
			<div className={clsx(styles.field)}>
				<Input
					label="Apartment, suite, etc. (optional)"
					type="text"
					id="apartments"
					name="apartments"
					required
					minLength={2}
					autoComplete="address-line2"
					className={styles.control}
				/>
			</div>
			<div className={clsx(styles.group)}>
				<div className={clsx(styles.field)}>
					<Input
						label="City"
						type="text"
						id="city"
						name="city"
						required
						minLength={2}
						autoComplete="address-level2"
						className={styles.control}
					/>
				</div>
				<div className={clsx(styles.field)}>
					<Input
						label="State"
						type="text"
						id="state"
						name="state"
						required
						minLength={2}
						autoComplete="address-level1"
						className={styles.control}
					/>
				</div>
				<div className={clsx(styles.field)}>
					<Input
						label="ZIP Code"
						type="text"
						id="zip"
						name="zip"
						required
						minLength={2}
						autoComplete="postal-code"
						className={styles.control}
					/>
				</div>
			</div>
			<div className={clsx(styles.field)}>
				<Input
					label="Phone"
					type="text"
					id="phone"
					name="phone"
					required
					minLength={2}
					autoComplete="tel"
					className={styles.control}
				/>
			</div>
			{children}
		</form>
	);
};
