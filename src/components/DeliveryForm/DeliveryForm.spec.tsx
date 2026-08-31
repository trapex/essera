import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeliveryForm } from "./DeliveryForm";
import { initialDelivery, useCheckoutStore } from "@/stores/checkoutStore";

beforeEach(() => {
  useCheckoutStore.setState({ delivery: initialDelivery, error: "" });
});

describe("DeliveryForm", () => {
  it("renders all checkout fields with connected floating labels", () => {
    render(<DeliveryForm />);

    const fields = [
      "Email *",
      "Country/Region *",
      "First Name *",
      "Last Name *",
      "Address *",
      "Apartment, suite, etc.",
      "City *",
      "State *",
      "ZIP Code *",
      "Phone *",
    ];

    fields.forEach((labelText) => {
      expect(screen.getByLabelText(labelText)).toBeInTheDocument();
    });
  });

  it("keeps what the buyer typed in the checkout store, ready to be paid with", async () => {
    const user = userEvent.setup();
    render(<DeliveryForm />);

    await user.type(screen.getByLabelText("Email *"), "buyer@example.com");
    await user.type(screen.getByLabelText("First Name *"), "Ada");
    await user.type(screen.getByLabelText("ZIP Code *"), "95014");

    expect(useCheckoutStore.getState().delivery).toMatchObject({
      email: "buyer@example.com",
      firstName: "Ada",
      zip: "95014",
    });
  });
});
