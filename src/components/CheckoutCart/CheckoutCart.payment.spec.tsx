import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutCart } from "./CheckoutCart";
import { DeliveryForm } from "@/components/DeliveryForm/DeliveryForm";
import { useCartStore } from "@/stores/cartStore";
import { initialDelivery, useCheckoutStore } from "@/stores/checkoutStore";
import { ApiError } from "@/api/apiClient";
import { createCheckoutPayment } from "@/api/checkout";
import { redirectTo } from "@/utils/redirect";

jest.mock("next/image");
jest.mock("next/link");
jest.mock("@/components/UserInitializer/UserInitializer", () => ({
  __esModule: true,
  UserInitializer: () => null,
}));
jest.mock("@/api/checkout", () => ({
  ...jest.requireActual("@/api/checkout"),
  createCheckoutPayment: jest.fn(),
}));
jest.mock("@/utils/redirect", () => ({ redirectTo: jest.fn() }));

const createPayment = createCheckoutPayment as jest.MockedFunction<
  typeof createCheckoutPayment
>;
const redirect = redirectTo as jest.MockedFunction<typeof redirectTo>;

const session = {
  orderId: "order-1",
  sessionId: "cs_test_1",
  url: "https://checkout.stripe.com/c/pay/cs_test_1",
  amount: 10000,
  currency: "usd",
};

const mockEntry = {
  product: {
    id: 1,
    images: [],
    slug: "white-bra",
    title: "White Bra",
    price: 50,
  },
  size: "S",
  color: "black",
  quantity: 2,
};

const delivery = {
  country: "United States",
  firstName: "Ada",
  lastName: "Lovelace",
  address: "1 Infinite Loop",
  apartments: "Apt 4",
  city: "Cupertino",
  state: "CA",
  zip: "95014",
  phone: "+1 (555) 010-1234",
  email: "buyer@example.com",
};

const payButton = () =>
  screen.getByRole("button", {
    name: /continue to payment|redirecting to payment/i,
  });

/** The checkout page: the delivery form owns the submit, the summary owns the button. */
const renderCheckout = () =>
  render(
    <>
      <DeliveryForm />
      <CheckoutCart />
    </>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  useCartStore.setState({ items: [mockEntry] });
  useCheckoutStore.setState({ delivery, error: "" });
  useCheckoutStore.getState().resetPaying();
});

describe("<CheckoutCart /> payment", () => {
  it("sends the cart lines and the delivery details — and no prices — then hands over to Stripe", async () => {
    const user = userEvent.setup();
    createPayment.mockResolvedValue(session);

    renderCheckout();
    await user.click(payButton());

    await waitFor(() => expect(redirect).toHaveBeenCalledWith(session.url));
    expect(createPayment).toHaveBeenCalledWith({
      items: [{ productId: 1, variant: "black", size: "S", quantity: 2 }],
      email: "buyer@example.com",
      shipping: {
        country: "United States",
        firstName: "Ada",
        lastName: "Lovelace",
        address: "1 Infinite Loop",
        apartments: "Apt 4",
        city: "Cupertino",
        state: "CA",
        zip: "95014",
        phone: "+1 (555) 010-1234",
      },
    });
  });

  it("keeps the cart until the payment is confirmed", async () => {
    const user = userEvent.setup();
    createPayment.mockResolvedValue(session);

    renderCheckout();
    await user.click(payButton());

    await waitFor(() => expect(redirect).toHaveBeenCalled());
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it("disables the button and shows the loading state while the session is created", async () => {
    const user = userEvent.setup();
    let resolve: (value: typeof session) => void = () => {};
    createPayment.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );

    renderCheckout();
    await user.click(payButton());

    const button = payButton();
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveTextContent(/redirecting to payment/i);

    resolve(session);
    await waitFor(() => expect(redirect).toHaveBeenCalled());
  });

  it("never creates two sessions, however fast the button is clicked twice", async () => {
    const user = userEvent.setup();
    createPayment.mockReturnValue(new Promise(() => {}));

    renderCheckout();
    const button = payButton();
    await user.click(button);
    await user.click(button);

    expect(createPayment).toHaveBeenCalledTimes(1);
  });

  it("re-enables the button when the page is restored from the back/forward cache", async () => {
    const user = userEvent.setup();
    createPayment.mockReturnValue(new Promise(() => {}));

    renderCheckout();
    await user.click(payButton());
    expect(payButton()).toBeDisabled();

    // Coming back from Stripe with the browser Back button.
    act(() => {
      window.dispatchEvent(
        new PageTransitionEvent("pageshow", { persisted: true }),
      );
    });

    await waitFor(() => expect(payButton()).toBeEnabled());

    await user.click(payButton());
    expect(createPayment).toHaveBeenCalledTimes(2);
  });

  it("shows the backend message for a cart the backend rejects, and allows a retry", async () => {
    const user = userEvent.setup();
    createPayment.mockRejectedValue(
      new ApiError(409, '"White Bra" (black / S) has only 1 left'),
    );

    renderCheckout();
    await user.click(payButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      '"White Bra" (black / S) has only 1 left',
    );
    expect(redirect).not.toHaveBeenCalled();
    expect(payButton()).toBeEnabled();
  });

  it("never leaks a transport failure to the buyer", async () => {
    const user = userEvent.setup();
    createPayment.mockRejectedValue(new TypeError("Failed to fetch"));

    renderCheckout();
    await user.click(payButton());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/check your connection/i);
    expect(alert).not.toHaveTextContent(/fetch/i);
  });

  it("reports a Stripe failure without naming the provider", async () => {
    const user = userEvent.setup();
    createPayment.mockRejectedValue(
      new ApiError(503, "Could not start the payment"),
    );

    renderCheckout();
    await user.click(payButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /could not start the payment/i,
    );
  });

  it("does not pay while the delivery form is incomplete", async () => {
    const user = userEvent.setup();
    useCheckoutStore.setState({ delivery: initialDelivery });

    renderCheckout();
    await user.click(payButton());

    expect(createPayment).not.toHaveBeenCalled();
  });

  it("cannot pay at all when the delivery form is not on the page", async () => {
    const user = userEvent.setup();

    render(<CheckoutCart />);
    await user.click(payButton());

    expect(createPayment).not.toHaveBeenCalled();
  });

  it("refuses a line above the quantity the backend accepts", async () => {
    const user = userEvent.setup();
    useCartStore.setState({ items: [{ ...mockEntry, quantity: 21 }] });

    renderCheckout();
    await user.click(payButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /at most 20 units/i,
    );
    expect(createPayment).not.toHaveBeenCalled();
  });

  it("refuses more distinct items than the backend accepts", async () => {
    const user = userEvent.setup();
    useCartStore.setState({
      items: Array.from({ length: 51 }, (_, i) => ({
        ...mockEntry,
        product: { ...mockEntry.product, id: i + 1 },
      })),
    });

    renderCheckout();
    await user.click(payButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /at most 50 different items/i,
    );
    expect(createPayment).not.toHaveBeenCalled();
  });

  it("cannot be started with an empty cart", () => {
    useCartStore.setState({ items: [] });
    renderCheckout();

    expect(payButton()).toBeDisabled();
  });
});
