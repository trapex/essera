'use client';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ModalProps } from './Modal.props';
import styles from './Modal.module.css';
import clsx from 'clsx';

export const Modal = ({ isOpen, onClose, size = 'md', type = 'center', children, className, ...props }: ModalProps) => {
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isOpen]);

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
		}
		return () => document.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const previousActiveElement = useRef<Element | null>(null);

	useEffect(() => {
		if (isOpen) {
			previousActiveElement.current = document.activeElement;
			const timer = setTimeout(() => {
				closeButtonRef.current?.focus();
			}, 0);
			return () => clearTimeout(timer);
		}
	}, [isOpen]);

	useEffect(() => {
		return () => {
			const el = previousActiveElement.current;
			if (el instanceof HTMLElement) {
				el.focus();
			}
		};
	}, []);

	if (!isOpen) return null;

	return createPortal(
		<div className={clsx(styles.overlay)} onClick={onClose} {...props}>
			<div
				className={clsx(styles.modal, styles[size], styles[type], className)}
				onClick={(e) => e.stopPropagation()}
			>
				<button
					ref={closeButtonRef}
					className={clsx('material-icons-outlined', styles.closeBtn)}
					onClick={onClose}
					aria-label="Close dialog"
					type="button"
				>
					close
				</button>
				{children}
			</div>
		</div>,
		document.body
	);
};
