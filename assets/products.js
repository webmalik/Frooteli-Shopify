document.addEventListener('DOMContentLoaded', () => {
    const initAddToCart = () => {
        document.querySelectorAll('.card__button').forEach((button) => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();

                const form = button.closest('form');
                if (!form) return;

                const variantInput = form.querySelector('input[name="id"]');
                if (!variantInput) return;

                const variantId = variantInput.value;

                button.disabled = true;
                button.classList.add('loading');

                try {
                    const res = await fetch('/cart/add.js', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                        },
                        body: JSON.stringify({
                            id: variantId,
                            quantity: 1,
                        }),
                    });

                    if (!res.ok) throw new Error('Add to cart error');

                    const data = await res.json();

                    // Відкрити міні-корзину
                    if (window.flsCart && typeof window.flsCart.open === 'function') {
                        window.flsCart.open();
                    }

                    document.dispatchEvent(
                        new CustomEvent('cart:added', {
                            detail: { product: data },
                        }),
                    );
                } catch (err) {
                    console.error('Failed to add to cart', err);
                } finally {
                    button.disabled = false;
                    button.classList.remove('loading');
                }
            });
        });
    };

    initAddToCart();

    window.flsCartInitAdd = initAddToCart;
});
