import { useCartStore } from "./cartStore";
import { mockProduct } from "@/data/product";
import { MAX_CHECKOUT_LINES, MAX_LINE_QUANTITY } from "@/constants/checkout";

describe("cartStore", () => {
  const product = mockProduct;
  const variant = product.variants[0];
  const sizeS = variant.sizes.find((s) => s.size === "s")!;
  const sizeXs = variant.sizes.find((s) => s.size === "xs")!;

  beforeEach(() => {
    useCartStore.setState({ items: [] });
    localStorage.clear();
  });

  it("adds a product with the selected size", () => {
    useCartStore.getState().addFromProduct({ product, variant, size: sizeS });

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].product.title).toBe(product.title);
    expect(items[0].size).toBe("s");
    expect(items[0].color).toBe(variant.color);
    expect(items[0].quantity).toBe(1);
    expect(items[0].product.price).toBe(product.discountPrice);
  });

  it("increases quantity when the same product and size are added again", () => {
    useCartStore.getState().addFromProduct({ product, variant, size: sizeS });
    useCartStore.getState().addFromProduct({ product, variant, size: sizeS });

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it("treats different sizes as separate cart items", () => {
    useCartStore.getState().addFromProduct({ product, variant, size: sizeS });
    useCartStore.getState().addFromProduct({ product, variant, size: sizeXs });

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items[1].size).toBe("xs");
  });

  it("increases and decreases item quantity", () => {
    useCartStore.getState().addFromProduct({ product, variant, size: sizeS });
    const key = { productId: product.id, size: "s", color: variant.color };

    useCartStore.getState().setQuantity(key, 3);
    expect(useCartStore.getState().items[0].quantity).toBe(3);

    useCartStore.getState().setQuantity(key, 1);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it("never lets a line exceed the quantity checkout accepts", () => {
    useCartStore.getState().addFromProduct({ product, variant, size: sizeS });
    const key = { productId: product.id, size: "s", color: variant.color };

    useCartStore.getState().setQuantity(key, MAX_LINE_QUANTITY + 5);
    expect(useCartStore.getState().items[0].quantity).toBe(MAX_LINE_QUANTITY);

    useCartStore
      .getState()
      .addFromProduct({ product, variant, size: sizeS, quantity: 3 });
    expect(useCartStore.getState().items[0].quantity).toBe(MAX_LINE_QUANTITY);
  });

  it("never holds more distinct lines than checkout accepts", () => {
    for (let i = 0; i < MAX_CHECKOUT_LINES + 3; i++) {
      useCartStore.getState().addFromProduct({
        product: { ...product, id: product.id + i + 1 },
        variant,
        size: sizeS,
      });
    }

    expect(useCartStore.getState().items).toHaveLength(MAX_CHECKOUT_LINES);
  });

  it("removes an item when quantity is set to 0", () => {
    useCartStore.getState().addFromProduct({ product, variant, size: sizeS });
    const key = { productId: product.id, size: "s", color: variant.color };

    useCartStore.getState().setQuantity(key, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("removes an item", () => {
    useCartStore.getState().addFromProduct({ product, variant, size: sizeS });
    useCartStore
      .getState()
      .remove({ productId: product.id, size: "s", color: variant.color });
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("calculates the subtotal correctly", () => {
    useCartStore.getState().addFromProduct({ product, variant, size: sizeS });
    useCartStore.getState().addFromProduct({ product, variant, size: sizeS });
    useCartStore.getState().addFromProduct({ product, variant, size: sizeXs });

    const expected = product.discountPrice! * 2 + product.discountPrice!;
    expect(useCartStore.getState().subtotal()).toBe(expected);
  });

  it("calculates the total item count", () => {
    useCartStore.getState().addFromProduct({ product, variant, size: sizeS });
    useCartStore.getState().addFromProduct({ product, variant, size: sizeS });
    useCartStore.getState().addFromProduct({ product, variant, size: sizeXs });

    expect(useCartStore.getState().count()).toBe(3);
  });
});
