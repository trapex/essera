import { DetailedHTMLProps, ButtonHTMLAttributes } from 'react';
import { SizeOption } from '@/interfaces/size.interface';

export interface SizeItemProps extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
	sizeOption: SizeOption;
	selected?: boolean;
	onSizeSelect?: (value: string) => void;
}
