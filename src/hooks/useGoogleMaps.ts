'use client';

import { useEffect, useState } from 'react';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const CALLBACK_NAME = '__esseraGoogleMapsOnLoad';
const SCRIPT_ID = '__essera-google-maps-script';

export interface SessionToken {
	readonly __tag: 'AutocompleteSessionToken';
}

export interface StringRange {
	readonly startOffset: number;
	readonly endOffset: number;
}

export interface FormattableText {
	readonly text: string;
	readonly matches?: StringRange[];
	toString(): string;
}

export interface PlacePrediction {
	readonly placeId: string;
	readonly text: FormattableText;
	readonly mainText?: FormattableText;
	readonly secondaryText?: FormattableText;
	readonly types?: string[];
	readonly toPlace: () => Place;
}

export interface AutocompleteSuggestion {
	readonly placePrediction?: PlacePrediction;
}

export interface AutocompleteRequest {
	readonly input: string;
	readonly includedRegionCodes?: string[];
	readonly includedPrimaryTypes?: string[];
	readonly sessionToken?: SessionToken;
	readonly language?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly locationBias?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly locationRestriction?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly origin?: any;
}

export interface AddressComponent {
	readonly longText: string;
	readonly shortText: string;
	readonly types: string[];
}

export interface Place {
	readonly id?: string;
	readonly addressComponents?: AddressComponent[];
	readonly formattedAddress?: string;
	readonly displayName?: string;
	fetchFields: (options: { fields: string[] }) => Promise<{ place: Place }>;
}

export interface PlaceConstructor {
	new(options: { id: string }): Place;
}

export interface AutocompleteSuggestionStatic {
	fetchAutocompleteSuggestions(request: AutocompleteRequest): Promise<{ suggestions: AutocompleteSuggestion[] }>;
}

export interface AutocompleteSessionTokenConstructor {
	new(): SessionToken;
}

export interface GoogleMaps {
	readonly maps: {
		readonly places: {
			readonly AutocompleteSessionToken: AutocompleteSessionTokenConstructor;
			readonly AutocompleteSuggestion: AutocompleteSuggestionStatic;
			readonly Place: PlaceConstructor;
		};
	};
}

let loadPromise: Promise<GoogleMaps | null> | null = null;

const getWindow = () =>
	typeof window !== 'undefined'
		? (window as unknown as { google?: GoogleMaps;[CALLBACK_NAME]?: (() => void) | undefined })
		: null;

const loadGoogleMaps = (): Promise<GoogleMaps | null> => {
	if (loadPromise) return loadPromise;

	loadPromise = new Promise((resolve) => {
		const win = getWindow();
		if (!win) {
			resolve(null);
			return;
		}

		if (win.google) {
			resolve(win.google);
			return;
		}

		if (!API_KEY) {
			if (process.env.NODE_ENV === 'development') {
				console.warn('[Google Maps] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set');
			}
			resolve(null);
			return;
		}

		if (document.getElementById(SCRIPT_ID)) {
			const interval = window.setInterval(() => {
				if (win.google) {
					resolve(win.google);
					window.clearInterval(interval);
				}
			}, 50);
			return;
		}

		win[CALLBACK_NAME] = () => {
			resolve(win.google ?? null);
		};

		const script = document.createElement('script');
		script.id = SCRIPT_ID;
		script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(API_KEY)}&libraries=places&callback=${CALLBACK_NAME}`;
		script.async = true;
		script.defer = true;
		script.onerror = () => {
			if (process.env.NODE_ENV === 'development') {
				console.error('[Google Maps] Failed to load the Google Maps script');
			}
			resolve(null);
		};
		document.head.appendChild(script);
	});

	return loadPromise;
};

export const useGoogleMaps = () => {
	const [google, setGoogle] = useState<GoogleMaps | null>(() => getWindow()?.google ?? null);

	useEffect(() => {
		const win = getWindow();
		if (win?.google) {
			setGoogle(win.google);
			return;
		}

		let mounted = true;
		loadGoogleMaps().then((g) => {
			if (mounted && g) setGoogle(g);
		});
		return () => {
			mounted = false;
		};
	}, []);

	return { google, isReady: !!google };
};
