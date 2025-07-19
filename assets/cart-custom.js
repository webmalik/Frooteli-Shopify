document.addEventListener('DOMContentLoaded', () => {
    const cart = document.querySelector('[data-fls-cart]');
    const cartWrapper = document.documentElement;
    if (!cart) return;

    const CART_CLASS = 'cart--active';
    const SELECTORS = {
        open: '[data-cart-open]',
        close: '[data-cart-close]',
        itemsWrapper: '#fls-cart-items',
        subtotal: '.cart__subtotal-price',
    };

    const openCart = () => {
        cart.classList.add(CART_CLASS);
        cartWrapper.classList.add('cart-open');
        document.dispatchEvent(new CustomEvent('cart:open'));
    };

    const closeCart = () => {
        cart.classList.remove(CART_CLASS);
        cartWrapper.classList.remove('cart-open');
        document.dispatchEvent(new CustomEvent('cart:close'));
    };

    const toggleCart = () => {
        if (cart.classList.contains(CART_CLASS)) {
            closeCart();
        } else {
            openCart();
        }
    };

    window.flsCart = {
        open: openCart,
        close: closeCart,
        toggle: toggleCart,
        isOpen: () => cart.classList.contains(CART_CLASS),
    };

    // Прив’язка до кнопок
    document
        .querySelectorAll(SELECTORS.open)
        .forEach((btn) => btn.addEventListener('click', openCart));
    document
        .querySelectorAll(SELECTORS.close)
        .forEach((btn) => btn.addEventListener('click', closeCart));

    cart.addEventListener('click', (e) => {
        if (e.target === cart) closeCart();
    });

    // Івенти
    document.addEventListener('cart:open', refreshCart);

    // Дії по кліках
    cart.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('[data-cart-remove]');
        const minusBtn = e.target.closest('[data-cart-qty-minus]');
        const plusBtn = e.target.closest('[data-cart-qty-plus]');

        if (removeBtn) {
            const line = parseInt(removeBtn.dataset.cartRemove, 10);
            updateCart(line, 0);
        }

        if (minusBtn) {
            const line = parseInt(minusBtn.dataset.cartQtyMinus, 10);
            const input = cart.querySelector(`[data-line="${line}"] input`);
            const current = parseInt(input?.value || '1');
            if (current > 1) updateCart(line, current - 1);
        }

        if (plusBtn) {
            const line = parseInt(plusBtn.dataset.cartQtyPlus, 10);
            const input = cart.querySelector(`[data-line="${line}"] input`);
            const current = parseInt(input?.value || '1');
            updateCart(line, current + 1);
        }
    });

    // Оновлення корзини
    function refreshCart() {
        fetch(`${window.location.pathname}?section_id=cart`)
            .then((res) => res.text())
            .then((html) => {
                const temp = document.createElement('div');
                temp.innerHTML = html;

                const newItems = temp.querySelector(SELECTORS.itemsWrapper);
                const newSubtotal = temp.querySelector(SELECTORS.subtotal);

                if (newItems) {
                    document.querySelector(SELECTORS.itemsWrapper)?.replaceWith(newItems);
                }
                if (newSubtotal) {
                    document.querySelector(SELECTORS.subtotal)?.replaceWith(newSubtotal);
                }
            })
            .then(() => initCartInputs());
    }

    // Оновлення кількості/видалення
    function updateCart(line, quantity) {
        fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ line, quantity }),
        }).then(refreshCart);
    }

    // Ініціалізація кнопок +/-
    function initCartInputs() {
        cart.querySelectorAll('.cart__item').forEach((item) => {
            const input = item.querySelector('.cart__item-count input');
            const minus = item.querySelector('.cart__item-minus');

            if (!input) return;

            const val = parseInt(input.value || '1');
            input.value = val;
            minus?.classList.toggle('disabled', val <= 1);
        });
    }

    // Первинна ініціалізація
    initCartInputs();
});
