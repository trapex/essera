'use client';
import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import type { AnimationEvent, ChangeEvent, FocusEvent, FormEvent } from 'react';
import { InputProps } from './Input.props';
import styles from './Input.module.css';
import clsx from 'clsx';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
	{
		className,
		isInvalid,
		leftIcon,
		rightIcon,
		disabled,
		label,
		id: idProp,
		placeholder,
		onFocus,
		onBlur,
		onInput,
		onChange,
		onAnimationStart,
		...props
	},
	ref
) {
	const internalRef = useRef<HTMLInputElement>(null);
	const generatedId = useId();
	const id = idProp ?? generatedId;

	const [isFocused, setIsFocused] = useState(false);
	const [hasValue, setHasValue] = useState(false);

	const isFloating = isFocused || hasValue;

	useImperativeHandle(ref, () => internalRef.current as HTMLInputElement);

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

	const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
		setIsFocused(true);
		onFocus?.(e);
	};

	const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
		setIsFocused(false);
		setHasValue(e.currentTarget.value.length > 0);
		onBlur?.(e);
	};

	const handleInput = (e: FormEvent<HTMLInputElement>) => {
		setHasValue(e.currentTarget.value.length > 0);
		onInput?.(e);
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setHasValue(e.currentTarget.value.length > 0);
		onChange?.(e);
	};

	const handleAnimationStart = (e: AnimationEvent<HTMLInputElement>) => {
		if (e.animationName === 'onAutoFillStart') {
			setHasValue(true);
		} else if (e.animationName === 'onAutoFillCancel') {
			setHasValue(e.currentTarget.value.length > 0);
		}
		onAnimationStart?.(e);
	};

	return (
		<div className={clsx(styles.root, label && styles.rootWithLabel)}>
			{leftIcon && <span className={clsx(styles.icon, styles.iconLeft)}>{leftIcon}</span>}

			<input
				ref={internalRef}
				id={id}
				disabled={disabled}
				aria-invalid={!!isInvalid}
				placeholder={label ? undefined : placeholder}
				onFocus={handleFocus}
				onBlur={handleBlur}
				onInput={handleInput}
				onChange={handleChange}
				onAnimationStart={handleAnimationStart}
				className={clsx(
					styles.input,
					label && styles.withLabel,
					isInvalid && styles.invalid,
					disabled && styles.disabled,
					className
				)}
				{...props}
			/>

			{label && (
				<label htmlFor={id} className={clsx(styles.label, isFloating && styles.labelFloating)}>
					{label}
				</label>
			)}

			{rightIcon && <span className={clsx(styles.icon, styles.iconRight)}>{rightIcon}</span>}
		</div>
	);
});
