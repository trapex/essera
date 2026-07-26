'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';

import { ProductDetailsProps } from './ProductDetails.props';
import styles from './ProductDetails.module.css';

import { useModal } from '@/contexts/ModalContext';
import { SizeItem, Button, Accordion } from '@/components';

import { fetchDetailsBySlug } from '@/api/products';
import type { Details, Variants } from '@/interfaces/product.interface';
import type { SizeOption } from '@/interfaces/size.interface';
import type { AccordionItem } from '@/interfaces/accordion.interface';
import { useCartStore } from '@/stores/cartStore';

export const ProductDetails = ({
	product,
	className,
	onFavoriteToggle: _onFavoriteToggle, // not used yet, but kept for API parity
	...props
}: ProductDetailsProps) => {
	void _onFavoriteToggle;
	const { title, basePrice, discountPrice, label } = product;

	/* ------------------ Variant, images, sizes ------------------ */

	// Pick current variant (for now the first one). Memoized for stability.
	const currentVariant = useMemo<Variants | null>(() => {
		return product?.variants?.length ? product.variants[0] : null;
	}, [product?.variants]);

	// Images come from the current variant; fallback to empty.
	const images = useMemo<string[]>(() => currentVariant?.images ?? [], [currentVariant]);

	// Sort sizes like "32A, 32B, 34A, 34B, ..." (numeric asc, then letter asc)
	const productSizes = useMemo(() => {
		const sizes = currentVariant?.sizes ?? [];
		return sizes.slice().sort((a, b) => {
			const A = a.size.match(/^(\d+)([A-ZА-Я])$/i);
			const B = b.size.match(/^(\d+)([A-ZА-Я])$/i);
			if (!A || !B) return 0;
			const nA = parseInt(A[1], 10);
			const nB = parseInt(B[1], 10);
			if (nA !== nB) return nA - nB;
			return A[2].localeCompare(B[2]);
		});
	}, [currentVariant]);

	/* ------------------ Details (accordion data) ------------------ */

	const [details, setDetails] = useState<Details[]>([]);

	useEffect(() => {
		// Fetch product details by slug once slug changes.
		(async () => {
			try {
				const data = await fetchDetailsBySlug(product.slug);
				setDetails(data);
			} catch (err) {
				console.error('Failed to fetch product details:', err);
			}
		})();
	}, [product.slug]);

	// Normalize Details[] into AccordionItem[] expected by <Accordion />
	const accordionItems: AccordionItem[] = useMemo(
		() =>
			details.map((d) => ({
				id: d.id ?? d.key,
				title: d.title || d.key,
				content: d.content,
			})),
		[details]
	);

	/* ------------------ UI handlers ------------------ */

	const modal = useModal();

	const handleImageClick = (image: string) => {
		modal.open('imageZoom', {
			src: image,
			alt: product.title,
			size: 'lg',
		});
	};

	const addFromProduct = useCartStore((s) => s.addFromProduct);
	const [selectedSize, setSelectedSize] = useState<string | null>(null);
	const [sizeError, setSizeError] = useState(false);

	const handleSizeSelect = (size: string) => {
		setSelectedSize(size);
		setSizeError(false);
	};

	const handleAddToBag = () => {
		if (!currentVariant) return;

		const hasSizes = (currentVariant.sizes?.length ?? 0) > 0;
		let sizeObj: SizeOption | null = null;

		if (hasSizes) {
			sizeObj =
				currentVariant.sizes.find(
					(s) => s.size === selectedSize || s.label === selectedSize
				) ?? null;

			if (
				!sizeObj ||
				sizeObj.inStock === false ||
				(typeof sizeObj.quantity === 'number' && sizeObj.quantity <= 0)
			) {
				setSizeError(true);
				return;
			}
		}

		addFromProduct({ product, variant: currentVariant, size: sizeObj, quantity: 1 });
		setSizeError(false);
		modal.open('cartModal', { type: 'right' });
	};

	/* ------------------ Render ------------------ */

	return (
		<div className={clsx(styles.product, className)} {...props}>
			{/* Gallery */}
			<div className={clsx(styles.list)}>
				{images.map((image) => (
					<div
						key={image}
						className={clsx(styles.imageWrapper)}
						onClick={() => handleImageClick(image)}
					>
						<Image src={image} fill alt={title} className={clsx(styles.image)} />
					</div>
				))}
			</div>

			{/* Right column: info */}
			<div className={clsx(styles.details)}>
				{label && <div className={clsx(styles.label)}>{label}</div>}

				<div className={clsx(styles.block, styles.row)}>
					<div className={clsx(styles.title)}>{title}</div>
					<div className={clsx(styles.price)}>
						${typeof discountPrice === 'number' ? discountPrice : basePrice}
					</div>
				</div>

				{/* Sizes */}
				<div className={clsx(styles.block)}>
					<div className={clsx(styles.row)}>
						<div>Size</div>
						<div>Size Guide</div>
					</div>

					<div className={clsx(styles.sizeList)}>
						{productSizes.map((sizeOption) => (
							<SizeItem
								key={sizeOption.size}
								className={clsx(styles.sizeItem)}
								sizeOption={sizeOption}
								selected={selectedSize === sizeOption.size}
								onSizeSelect={handleSizeSelect}
							/>
						))}
					</div>
					{sizeError && (
						<div className={styles.sizeError} role="alert">
							Please select a size
						</div>
					)}
				</div>

				{/* Add to bag */}
				<div className={clsx(styles.block, styles.row)}>
					<Button
						className={clsx('wFull')}
						size="md"
						color="neutral"
						onClick={handleAddToBag}
					>
						Add to bag
					</Button>
				</div>

				{/* Details accordion */}
				<div className={clsx(styles.block)}>
					<Accordion items={accordionItems} />
				</div>
			</div>
		</div>
	);
};
