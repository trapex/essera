const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

type ApiOptions = RequestInit & { accessToken?: string };

/** A non-2xx response, carrying the status and the message the API sent with it. */
export class ApiError extends Error {
	constructor(
		public readonly status: number,
		/** `message` from the API body, when it sent one. */
		public readonly serverMessage?: string,
		message?: string,
	) {
		super(message ?? serverMessage ?? `API error: ${status}`);
		this.name = 'ApiError';
	}
}

async function readErrorMessage(res: Response): Promise<string | undefined> {
	try {
		const body: unknown = await res.json();
		if (body && typeof body === 'object' && 'message' in body) {
			const { message } = body as { message?: unknown };
			if (typeof message === 'string') return message;
			if (Array.isArray(message)) return message.filter((m) => typeof m === 'string').join(', ');
		}
	} catch {
		// A body that is not JSON tells us nothing useful; the status alone will do.
	}
	return undefined;
}

export async function apiClient<T>(path: string, options: ApiOptions = {}): Promise<T> {
	const { accessToken, headers, ...rest } = options;

	const res = await fetch(`${API_URL}${path}`, {
		credentials: rest.credentials ?? 'same-origin',
		...rest,
		headers: {
			...(rest.body ? { 'Content-Type': 'application/json' } : {}),
			...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
			...(headers || {}),
		},
	});

	if (!res.ok) {
		throw new ApiError(
			res.status,
			await readErrorMessage(res),
			`API error: ${res.status} ${res.statusText}`,
		);
	}
	return res.json();
}

export async function apiClientAuth<T>(path: string, options: RequestInit = {}) {
	const { useUserStore } = await import('@/stores/userStore');
	const token = useUserStore.getState().accessToken;
	return apiClient<T>(path, { ...options, accessToken: token ?? undefined });
}
