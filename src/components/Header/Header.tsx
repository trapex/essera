'use client';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useScrollY } from '@/hooks/useScrollY';
import { useModal } from '@/contexts/ModalContext';
import { useCartStore } from '@/stores/cartStore';
import { HeaderProps } from './Header.props';
import styles from './Header.module.css';
import clsx from 'clsx';
import Link from 'next/link';
import { Input } from '@/components/Input/Input';

export const Header = ({ children: _children, className, ...props }: HeaderProps) => {
	void _children;
	const pathname = usePathname();
	const isHome = pathname === '/';

	const scrollY = useScrollY()
	const isScrolled = scrollY > 50

	const [isSearchOpen, setIsSearchOpen] = useState(false);

	const totalItems = useCartStore((s) => s.items.reduce((acc, it) => acc + it.quantity, 0));
	const modal = useModal();

	const handleBagClick = () => {
		modal.open('cartModal', {
			type: 'right',
		});
	};

	return (
		<header className={clsx(styles.header, { [styles.transparent]: isHome }, { [styles.scrolled]: isScrolled }, className)} {...props}>
			<nav className={clsx(styles.nav)}>
				<ul className={clsx(styles.list)}>
					<li><Link href='/new-arrivals'>new</Link></li>
					<li><Link href='/shop'>shop</Link></li>
				</ul>
			</nav>
			<div className={clsx(styles.logo)}>
				<Link href="/">
					<div className={clsx(styles.logoImg)}></div>
				</Link>
			</div>
			<div className={clsx(styles.profile)}>
				<span
					className={clsx('material-icons-outlined', styles.icon)}
					onClick={() => setIsSearchOpen((v) => !v)}
					tabIndex={0}
					role="button"
					aria-label="Open search"
					style={{ cursor: 'pointer' }}
				>
					search
				</span>
				<button
					className={clsx('material-icons-outlined', styles.icon, styles.cart)}
					onClick={handleBagClick}
					aria-label={`Open shopping bag (${totalItems} ${totalItems === 1 ? 'item' : 'items'})`}
					type="button"
				>
					shopping_bag
					{totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
				</button>
			</div>
			{isSearchOpen && (
				<div className={styles.searchBlock}>
					<div className={styles.searchInput}>
						<Input
							label="Search"
							type="text"
							id="search"
							name="search"
							autoComplete="off"
							autoFocus
							className={styles.searchControl}
						/>
					</div>
					<button
						className={styles.closeSearch}
						onClick={() => setIsSearchOpen(false)}
						aria-label="Close search"
						type="button"
					>
						<span className="material-icons-outlined">close</span>
					</button>
				</div>
			)}
		</header>
	);
};
