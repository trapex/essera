'use client';
import { CartItemProps } from './CartItem.props';
import styles from './CartItem.module.css';
import Image from 'next/image';
import clsx from 'clsx';

export const CartItem = ({ product, size, color, quantity, onRemove, onQuantityChange, className, ...props }: CartItemProps) => {

	return (
		<div className={clsx(styles.cartItem, className)} {...props}>
			<div className={clsx(styles.imageWrapper)}>
				<Image
					className={clsx(styles.image)}
					src={product.images[0]}
					alt={product.title}
					width={120}
					height={150}
				/>
			</div>
			<div className={clsx(styles.info)}>
				<div className={clsx(styles.title)}>{product.title}</div>
				<div className={clsx(styles.price)}>${product.price.toFixed(2)}</div>
				<div className={clsx(styles.meta)}>
					<span>{color}</span>
					<span>{size}</span>
				</div>
				<div className={styles.bottomRow}>
					<div className={clsx(styles.controls)}>
						<button
							className={styles.qtyBtn}
							onClick={() => onQuantityChange(product.id, size, color, quantity - 1)}
							disabled={quantity <= 1}
							aria-label="Decrease quantity"
							type="button"
						>−
						</button>
						<span className={styles.qtyLabel}>QTY: {quantity}</span>
						<button
							className={styles.qtyBtn}
							onClick={() => onQuantityChange(product.id, size, color, quantity + 1)}
							aria-label="Increase quantity"
							type="button"
						>+
						</button>
					</div>
					<button
						className={styles.remove}
						onClick={() => onRemove(product.id, size, color)}
						aria-label="Remove item"
						type="button"
					>
						Remove
					</button>
				</div>
			</div>
		</div>
	);
};
