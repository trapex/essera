import { InputProps } from '@/components/Input/Input.props';
import { ParsedAddress } from '@/hooks/useAddressAutocomplete';

export interface AddressAutocompleteInputProps extends InputProps {
	onAddressSelect: (parsed: ParsedAddress, fullAddress: string) => void;
}
