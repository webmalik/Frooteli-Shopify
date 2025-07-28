document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('[data-edit-form]');
    if (!form || !window.customer) return;

    const SERVER_URL = 'https://wishlistapp-frooteli.onrender.com';
    const SHOP = 'frooteli-dev.myshopify.com';
    const CUSTOMER_ID = window.customer;

    const log = (...args) => console.log('[account-edit]', ...args);

    const fillFormFields = (data) => {
        const inputs = form.querySelectorAll('input[name], select[name], textarea[name]');
        inputs.forEach((input) => {
            const name = input.name;
            if (name && data[name] !== undefined && data[name] !== null) {
                input.value = data[name];
            }
        });
    };

    const getUserData = async () => {
        try {
            const res = await fetch(
                `${SERVER_URL}/user-update?shop=${SHOP}&customerId=${CUSTOMER_ID}`,
                {
                    credentials: 'include',
                },
            );

            const json = await res.json();
            log('GET response', json);

            if (json?.customer) fillFormFields(json.customer);
        } catch (err) {
            console.error('[account-edit] Fetch error:', err);
        }
    };

    const collectFormData = () => {
        const data = {
            shop: SHOP,
            customerId: CUSTOMER_ID,
        };

        const inputs = form.querySelectorAll('input[name], select[name], textarea[name]');
        inputs.forEach((input) => {
            if (input.name) {
                data[input.name] = input.value.trim();
            }
        });

        return data;
    };

    const sendUserData = async () => {
        const data = collectFormData();
        log('Sending data:', data);

        try {
            const res = await fetch(`${SERVER_URL}/user-update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data),
            });

            const json = await res.json();
            log('POST response', json);
        } catch (err) {
            console.error('[account-edit] Submit error:', err);
        }
    };

    const submitBtn = document.querySelector('[data-account-submit]');
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sendUserData();
        });
    }

    getUserData();
});
