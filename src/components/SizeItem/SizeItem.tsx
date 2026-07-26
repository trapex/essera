import { SizeItemProps } from './SizeItem.props';
import styles from './SizeItem.module.css';
import clsx from 'clsx';

export const SizeItem = ({ sizeOption, selected = false, onSizeSelect, className, ...props }: SizeItemProps) => {
	const { size, label, quantity, inStock } = sizeOption;
	const isDisabled = (inStock === false || quantity === 0);

	return (
		<button
			type="button"
			className={clsx(styles.item, className, {
				[styles.selected]: selected,
				[styles.disabled]: isDisabled,
			})}
			onClick={() => onSizeSelect?.(size)}
			disabled={isDisabled}
			aria-pressed={selected}
			{...props}
		>
			{label || size}
		</button>
	);
};
