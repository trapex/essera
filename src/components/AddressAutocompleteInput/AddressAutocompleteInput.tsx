'use client';

import { ChangeEvent, FocusEvent, KeyboardEvent, useCallback, useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';
import { Input } from '@/components/Input/Input';
import { useAddressAutocomplete, type ParsedAddress } from '@/hooks/useAddressAutocomplete';
import { AddressAutocompleteInputProps } from './AddressAutocompleteInput.props';
import styles from './AddressAutocompleteInput.module.css';

const MIN_INPUT_LENGTH = 3;

export const AddressAutocompleteInput = ({
	onAddressSelect,
	value,
	onChange,
	onFocus,
	onBlur,
	onKeyDown,
	...props
}: AddressAutocompleteInputProps) => {
	const { predictions, isLoading, fetchPredictions, selectPrediction } = useAddressAutocomplete();
	const [isOpen, setIsOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const listId = useId();
	const skipFetchRef = useRef(false);

	const valueAsString = typeof value === 'string' ? value : String(value ?? '');

	const closeList = useCallback(() => {
		setIsOpen(false);
		setActiveIndex(-1);
	}, []);

	const handleSelect = useCallback(
		async (index: number) => {
			const prediction = predictions[index];
			if (!prediction) return;

			try {
				closeList();
				const parsed = await selectPrediction(prediction.placeId);
				if (!parsed) return;

				skipFetchRef.current = true;
				onAddressSelect(parsed, parsed.address);
			} catch (err) {
				if (process.env.NODE_ENV === 'development') {
					console.error('[AddressAutocompleteInput]', err);
				}
			}
		},
		[predictions, selectPrediction, onAddressSelect, closeList]
	);

	useEffect(() => {
		if (skipFetchRef.current) {
			skipFetchRef.current = false;
			return;
		}
		fetchPredictions(valueAsString);
	}, [valueAsString, fetchPredictions]);

	useEffect(() => {
		if (valueAsString.length < MIN_INPUT_LENGTH) {
			closeList();
		}
	}, [valueAsString, closeList]);

	useEffect(() => {
		if (predictions.length > 0 && valueAsString.length >= MIN_INPUT_LENGTH) {
			setIsOpen(true);
		}
	}, [predictions, valueAsString]);

	useEffect(() => {
		const handleDocumentClick = (event: MouseEvent) => {
			if (!containerRef.current || containerRef.current.contains(event.target as Node)) return;
			closeList();
		};

		document.addEventListener('mousedown', handleDocumentClick);
		return () => document.removeEventListener('mousedown', handleDocumentClick);
	}, [closeList]);

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		onChange?.(e);
	};

	const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
		onFocus?.(e);
		if (valueAsString.length >= MIN_INPUT_LENGTH && predictions.length > 0) {
			setIsOpen(true);
		}
	};

	const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
		onBlur?.(e);
		closeList();
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		onKeyDown?.(e);

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setIsOpen(true);
			setActiveIndex((prev) => Math.min(prev + 1, predictions.length - 1));
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setIsOpen(true);
			setActiveIndex((prev) => (prev <= 0 ? predictions.length - 1 : prev - 1));
		} else if (e.key === 'Enter') {
			if (isOpen && activeIndex >= 0 && activeIndex < predictions.length) {
				e.preventDefault();
				handleSelect(activeIndex);
			}
		} else if (e.key === 'Escape') {
			closeList();
		} else if (e.key === 'Tab') {
			closeList();
		}
	};

	const activeDescendantId =
		isOpen && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined;

	const rightIcon = (
		<span className={clsx('material-icons-outlined', isLoading && styles.spinIcon)}>
			{isLoading ? 'sync' : 'search'}
		</span>
	);

	return (
		<div className={styles.root} ref={containerRef}>
			<Input
				{...props}
				value={value}
				onChange={handleChange}
				onFocus={handleFocus}
				onBlur={handleBlur}
				onKeyDown={handleKeyDown}
				role="combobox"
				aria-autocomplete="list"
				aria-expanded={isOpen}
				aria-controls={listId}
				aria-haspopup="listbox"
				aria-activedescendant={activeDescendantId}
				rightIcon={rightIcon}
			/>
			{isOpen && predictions.length > 0 && (
				<ul id={listId} className={styles.list} role="listbox" aria-label="Address suggestions">
					{predictions.map((prediction, index) => (
						<li
							key={prediction.placeId}
							id={`${listId}-option-${index}`}
							className={clsx(styles.item, index === activeIndex && styles.itemActive)}
							role="option"
							aria-selected={index === activeIndex}
							onPointerDown={(e) => {
								e.preventDefault();
								handleSelect(index);
							}}
						>
							<span className={styles.primary}>{prediction.mainText}</span>
							{prediction.secondaryText && (
								<span className={styles.secondary}>{prediction.secondaryText}</span>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export type { ParsedAddress };
