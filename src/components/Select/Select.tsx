'use client';
import { Children, forwardRef, isValidElement, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FocusEvent } from 'react';
import { SelectProps } from './Select.props';
import styles from './Select.module.css';
import clsx from 'clsx';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
	{
		className,
		isInvalid,
		leftIcon,
		rightIcon,
		disabled,
		children,
		label,
		id: idProp,
		onFocus,
		onBlur,
		onChange,
		...props
	},
	ref
) {
	const internalRef = useRef<HTMLSelectElement>(null);
	const generatedId = useId();
	const id = idProp ?? generatedId;

	const [isFocused, setIsFocused] = useState(false);
	const [hasValue, setHasValue] = useState(false);

	const isFloating = isFocused || hasValue;

	const hasEmptyOption = useMemo(() => {
		return Children.toArray(children).some(
			(child) => isValidElement<{ value?: string }>(child) && child.props.value === ''
		);
	}, [children]);

	useImperativeHandle(ref, () => internalRef.current as HTMLSelectElement);

	useEffect(() => {
		if (internalRef.current) {
			setHasValue(internalRef.current.value.length > 0);
		}
	}, []);

	useEffect(() => {
		if (props.value !== undefined) {
			setHasValue(String(props.value).length > 0);
		}
	}, [props.value]);

	const handleFocus = (e: FocusEvent<HTMLSelectElement>) => {
		setIsFocused(true);
		onFocus?.(e);
	};

	const handleBlur = (e: FocusEvent<HTMLSelectElement>) => {
		setIsFocused(false);
		setHasValue(e.currentTarget.value !== '');
		onBlur?.(e);
	};

	const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
		setHasValue(e.currentTarget.value !== '');
		onChange?.(e);
	};

	return (
		<div className={clsx(styles.root, label && styles.rootWithLabel)}>
			{leftIcon && <span className={clsx(styles.icon, styles.iconLeft)}>{leftIcon}</span>}

			<select
				ref={internalRef}
				id={id}
				disabled={disabled}
				aria-invalid={!!isInvalid}
				onFocus={handleFocus}
				onBlur={handleBlur}
				onChange={handleChange}
				className={clsx(
					styles.select,
					label && styles.withLabel,
					isInvalid && styles.invalid,
					disabled && styles.disabled,
					className
				)}
				{...props}
			>
				{label && !hasEmptyOption && (
					<option value="" disabled hidden>
						{label}
					</option>
				)}
				{children}
			</select>

			{label && (
				<label htmlFor={id} className={clsx(styles.label, isFloating && styles.labelFloating)}>
					{label}
				</label>
			)}

			{rightIcon && <span className={clsx(styles.icon, styles.iconRight)}>{rightIcon}</span>}
		</div>
	);
});
