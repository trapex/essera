'use client';
import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import type { ChangeEvent, FocusEvent, FormEvent } from 'react';
import { TextareaProps } from './Textarea.props';
import styles from './Textarea.module.css';
import clsx from 'clsx';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
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
		...props
	},
	ref
) {
	const internalRef = useRef<HTMLTextAreaElement>(null);
	const generatedId = useId();
	const id = idProp ?? generatedId;

	const [isFocused, setIsFocused] = useState(false);
	const [hasValue, setHasValue] = useState(false);

	const isFloating = isFocused || hasValue;

	useImperativeHandle(ref, () => internalRef.current as HTMLTextAreaElement);

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

	const handleFocus = (e: FocusEvent<HTMLTextAreaElement>) => {
		setIsFocused(true);
		onFocus?.(e);
	};

	const handleBlur = (e: FocusEvent<HTMLTextAreaElement>) => {
		setIsFocused(false);
		setHasValue(e.currentTarget.value.length > 0);
		onBlur?.(e);
	};

	const handleInput = (e: FormEvent<HTMLTextAreaElement>) => {
		setHasValue(e.currentTarget.value.length > 0);
		onInput?.(e);
	};

	const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
		setHasValue(e.currentTarget.value.length > 0);
		onChange?.(e);
	};

	return (
		<div className={clsx(styles.root, label && styles.rootWithLabel)}>
			{leftIcon && <span className={clsx(styles.icon, styles.iconLeft)}>{leftIcon}</span>}

			<textarea
				ref={internalRef}
				id={id}
				disabled={disabled}
				aria-invalid={!!isInvalid}
				placeholder={label ? undefined : placeholder}
				onFocus={handleFocus}
				onBlur={handleBlur}
				onInput={handleInput}
				onChange={handleChange}
				className={clsx(
					styles.textarea,
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
