document.addEventListener('DOMContentLoaded', () => {
    let isRequestInProgress = false;
    const DEBOUNCE_DELAY = 500;

    const addToCart = async (variantId, button) => {
        if (isRequestInProgress) return;
        isRequestInProgress = true;

        button.disabled = true;
        button.classList.add('loading');

        try {
            const res = await fetch('/cart/add.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ id: variantId, quantity: 1 }),
            });

            if (!res.ok) {
                console.warn('Request failed with status', res.status);
                throw new Error('Add to cart error');
            }

            const data = await res.json();

            // Відкрити міні-корзину
            window.flsCart?.open?.();

            document.dispatchEvent(new CustomEvent('cart:added', { detail: { product: data } }));
        } catch (err) {
            console.error('Add to cart failed:', err.message);
        } finally {
            button.disabled = false;
            button.classList.remove('loading');
            setTimeout(() => {
                isRequestInProgress = false;
            }, DEBOUNCE_DELAY);
        }
    };

    document.body.addEventListener('click', (e) => {
        const button = e.target.closest('.card__button');
        if (!button) return;

        const form = button.closest('form');
        if (!form) return;

        const variantInput = form.querySelector('input[name="id"]');
        if (!variantInput) return;

        const variantId = variantInput.value;
        if (!variantId) return;

        e.preventDefault();
        addToCart(variantId, button);
    });
});
