/** Full-page navigation, e.g. handing the buyer over to Stripe's hosted checkout. */
export const redirectTo = (url: string) => {
	window.location.assign(url);
};
