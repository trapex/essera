import { DetailedHTMLProps, TextareaHTMLAttributes, ReactNode } from 'react';

export interface TextareaProps
	extends DetailedHTMLProps<TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement> {
	isInvalid?: boolean;
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
	className?: string;
	label?: string;
}
