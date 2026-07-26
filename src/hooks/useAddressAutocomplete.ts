'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AddressComponent, Place, SessionToken, useGoogleMaps } from './useGoogleMaps';

export interface ParsedAddress {
	address: string;
	city: string;
	state: string;
	zip: string;
	country: string;
}

export interface AddressPrediction {
	placeId: string;
	description: string;
	mainText: string;
	secondaryText: string;
}

export interface UseAddressAutocompleteReturn {
	isReady: boolean;
	predictions: AddressPrediction[];
	isLoading: boolean;
	error: string | null;
	fetchPredictions: (input: string) => void;
	selectPrediction: (placeId: string) => Promise<ParsedAddress | null>;
	resetSession: () => void;
}

const DEBOUNCE_MS = 250;

const isDevelopment = process.env.NODE_ENV === 'development';

const parseAddressComponents = (components: AddressComponent[]): ParsedAddress => {
	const find = (needleTypes: string[], name: 'longText' | 'shortText'): string => {
		for (const component of components) {
			for (const type of needleTypes) {
				if (component.types.includes(type)) {
					return component[name];
				}
			}
		}
		return '';
	};

	const streetNumber = find(['street_number'], 'longText');
	const route = find(['route'], 'longText');
	const address = [streetNumber, route].filter(Boolean).join(' ');

	const city =
		find(['locality'], 'longText') ||
		find(['postal_town'], 'longText') ||
		find(['sublocality'], 'longText') ||
		find(['sublocality_level_1'], 'longText') ||
		find(['administrative_area_level_2'], 'longText') ||
		find(['administrative_area_level_3'], 'longText');

	const state = find(['administrative_area_level_1'], 'shortText');
	const postalCode = find(['postal_code'], 'longText');
	const postalSuffix = find(['postal_code_suffix'], 'longText');
	const zip = postalCode + (postalSuffix ? `-${postalSuffix}` : '');
	const country = find(['country'], 'longText');

	return { address, city, state, zip, country };
};

export const useAddressAutocomplete = (): UseAddressAutocompleteReturn => {
	const { google } = useGoogleMaps();
	const [predictions, setPredictions] = useState<AddressPrediction[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const sessionTokenRef = useRef<SessionToken | undefined>(undefined);
	const debounceTimerRef = useRef<number | null>(null);
	const isMountedRef = useRef(true);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	const getSessionToken = useCallback((): SessionToken | undefined => {
		if (!google) return undefined;
		if (!sessionTokenRef.current) {
			sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
		}
		return sessionTokenRef.current;
	}, [google]);

	const resetSession = useCallback(() => {
		sessionTokenRef.current = undefined;
	}, []);

	const fetchPredictions = useCallback(
		(input: string) => {
			if (debounceTimerRef.current) {
				window.clearTimeout(debounceTimerRef.current);
			}

			if (!google) {
				setPredictions([]);
				return;
			}

			const trimmed = input.trim();
			if (trimmed.length < 3) {
				setPredictions([]);
				return;
			}

			debounceTimerRef.current = window.setTimeout(async () => {
				const token = getSessionToken();
				if (!token) return;

				setIsLoading(true);
				setError(null);

				try {
					const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
						input: trimmed,
						includedRegionCodes: ['us'],
						sessionToken: token,
					});

					if (!isMountedRef.current) return;
					setIsLoading(false);

					const mapped = suggestions
						.filter((suggestion) => suggestion.placePrediction)
						.map((suggestion) => {
							const prediction = suggestion.placePrediction!;
							return {
								placeId: prediction.placeId,
								description: prediction.text.text,
								mainText: prediction.mainText?.text ?? prediction.text.text,
								secondaryText: prediction.secondaryText?.text ?? '',
							};
						});

					setPredictions(mapped);
				} catch (err) {
					if (!isMountedRef.current) return;
					setIsLoading(false);
					setError('Unable to load address suggestions');
					setPredictions([]);
					if (isDevelopment) {
						console.error('[Google Places Autocomplete]', err);
					}
				}
			}, DEBOUNCE_MS);
		},
		[google, getSessionToken]
	);

	const selectPrediction = useCallback(
		async (placeId: string): Promise<ParsedAddress | null> => {
			if (!google) return null;

			const token = sessionTokenRef.current;
			if (!token) return null;

			try {
				const place: Place = new google.maps.places.Place({ id: placeId });
				await place.fetchFields({ fields: ['addressComponents'] });

				const components = place.addressComponents ?? [];
				const hasStreetNumber = components.some((component) => component.types.includes('street_number'));
				const hasRoute = components.some((component) => component.types.includes('route'));
				if (!hasStreetNumber || !hasRoute) {
					return null;
				}

				const parsed = parseAddressComponents(components);
				sessionTokenRef.current = undefined;
				return parsed;
			} catch (err) {
				if (isDevelopment) {
					console.error('[AddressAutocomplete]', err);
				}
				return null;
			}
		},
		[google]
	);

	return { isReady: !!google, predictions, isLoading, error, fetchPredictions, selectPrediction, resetSession };
};
