// Імʼя ключа в localStorage
const LOCAL_KEY = 'wm_wishlist_ids';

function getLocalWishlist() {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
    } catch {
        return [];
    }
}

function setLocalWishlist(ids = []) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
}

function addToWishlist(productId) {
    const list = getLocalWishlist();
    if (!list.includes(productId)) {
        list.push(productId);
        setLocalWishlist(list);
    }
}

function removeFromWishlist(productId) {
    const list = getLocalWishlist().filter((id) => id !== productId);
    setLocalWishlist(list);
    syncWishlistAction(productId, 'remove');
}

function isInWishlist(productId) {
    return getLocalWishlist().includes(productId);
}

async function toggleWishlist(productId, el = null) {
    const isWishlisted = isInWishlist(productId);

    if (isWishlisted) {
        removeFromWishlist(productId);
        syncWishlistAction(productId, 'remove');
    } else {
        addToWishlist(productId);
        syncWishlistAction(productId, 'add');
    }

    // Оновити клас кнопки, якщо елемент передано
    if (el) {
        el.classList.toggle('active', !isWishlisted);
    }

    // Якщо ми на сторінці wishlist — перерендерити
    if (document.querySelector('.wishlistpanel__content')) {
        renderWishlist();
    }
}

function updateWishlistState() {
    const current = getLocalWishlist();
    document.querySelectorAll('.wishlist-button[data-id]').forEach((el) => {
        const id = parseInt(el.dataset.id, 10);
        el.classList.toggle('active', current.includes(id));
    });
}

async function fullWishlistSyncAfterLogin() {
    const customer = getLoggedInCustomerId();
    if (!customer) return;

    // 1. Отримати локальний вішліст
    const localList = getLocalWishlist();

    // 2. Отримати серверний вішліст
    let serverList = [];
    try {
        const res = await fetch(`/apps/wishlist-update/get?customerId=${customer}`);
        const data = await res.json();
        if (data?.success && Array.isArray(data.wishlist)) {
            serverList = data.wishlist;
        }
    } catch (err) {
        console.error('Failed to fetch server wishlist:', err);
    }

    // 3. Об’єднати без дублів
    const combined = Array.from(new Set([...localList, ...serverList]));

    // 4. Зберегти об'єднаний список локально
    setLocalWishlist(combined);
    updateWishlistState();

    // 5. Відправити всі ID на сервер
    for (const id of combined) {
        await syncWishlistAction(id, 'add');
    }

    console.log('✅ Wishlist повністю синхронізовано');
}

function bindWishlistClickEvents() {
    document.querySelectorAll('.wishlist-button[data-id]').forEach((el) => {
        if (!el.dataset.wishlistBound) {
            el.dataset.wishlistBound = 'true';
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const id = parseInt(el.dataset.id, 10);
                toggleWishlist(id, el);
            });
        }
    });
}

function observeWishlistElements() {
    const observer = new MutationObserver(() => {
        bindWishlistClickEvents();
        updateWishlistState();
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function getLoggedInCustomerId() {
    try {
        return window?.customer || null;
    } catch {
        return null;
    }
}

async function syncWishlistAction(productId, action = 'add') {
    const customerId = getLoggedInCustomerId();
    if (!customerId) return;

    try {
        await fetch(
            `/apps/wishlist-update?customerId=${customerId}&productId=${productId}&action=${action}`,
        );
    } catch (e) {
        console.error('Wishlist sync error:', e);
    }
}

async function loadServerWishlistIfNeeded() {
    const customerId = getLoggedInCustomerId();
    console.log('customerId:', customerId);
    if (!customerId) return;

    const localList = getLocalWishlist();
    console.log('Local list (before server):', localList);
    if (localList.length > 0) {
        console.log('Local list already has items, skipping server load.');
        return;
    }

    const res = await fetch(`/apps/wishlist-update/get?customerId=${customerId}`);
    const data = await res.json();
    console.log('Response from server:', data);

    if (data?.success && Array.isArray(data.wishlist)) {
        setLocalWishlist(data.wishlist);
        updateWishlistState();
        console.log('Server wishlist saved locally:', data.wishlist);
        return data.wishlist;
    } else {
        console.warn('No valid wishlist returned from server');
        return [];
    }
}

async function loadServerWishlistIfNeeded() {
    const customerId = getLoggedInCustomerId();
    if (!customerId) return;

    const localList = getLocalWishlist();
    if (localList.length > 0) return;

    const res = await fetch(`/apps/wishlist-update/get?customerId=${customerId}`);
    const data = await res.json();
    if (data?.success && Array.isArray(data.wishlist)) {
        setLocalWishlist(data.wishlist);
        updateWishlistState();
    }
}

function initWishlist() {
    bindWishlistClickEvents();
    observeWishlistElements();
    updateWishlistState();

    if (window.customer) {
        fullWishlistSyncAfterLogin();
        loadServerWishlistIfNeeded();
    }
}

function formatPrice(amount) {
    const currency = window.Shopify?.currency?.active || window.shopCurrency || 'USD';
    const shopLocale = document.documentElement.lang || 'en-US';
    return new Intl.NumberFormat(shopLocale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(+amount);
}

function renderWishlistCard(product) {
    const price = formatPrice(product.variants[0].price);
    const compareAt = product.variants[0].compare_at_price;
    const comparePrice = compareAt
        ? `<div class="productcard__price-old c-twelve">${formatPrice(compareAt)}</div>`
        : '';

    return `
    <div class="wishlistpanel__item">
      <div class="productcard productcard--wishlist bg-fourteen" data-id="${product.id}">
        <div class="productcard__link-block">
          <a href="#" class="productcard__save wishlist-button" data-id="${product.id}"></a>
          <div data-gallery class="productcard__gallery">
            <a href="${product.images[0].src}" class="productcard__link">
              <div class="productcard__round bg-ten"></div>
              <img class="productcard__image-above ibg" src="${product.images[0].src}" alt="${
        product.title
    }" />
              <img class="productcard__image-under ibg" src="${
                  product.images[1]?.src || product.images[0].src
              }" alt="${product.title}" />
            </a>
          </div>
        </div>
        <div class="productcard__block">
          <div class="productcard__title-block">
            <div class="productcard__table-block">
              <div class="productcard__tables">
                ${
                    product.tags?.length
                        ? product.tags
                              .map(
                                  (tag) =>
                                      `<div class="productcard__table bg-twentyfive"><span>${tag}</span></div>`,
                              )
                              .join('')
                        : ''
                }
              </div>
            </div>
            <a href="${product.url}" class="productcard__headline productcard__headline--home">${
        product.title
    }</a>
          </div>
          <div class="productcard__price-block">
            ${comparePrice}
            <div class="productcard__price">${price}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function fetchAllProducts() {
    let allProducts = [];
    let page = 1;
    let keepFetching = true;

    while (keepFetching) {
        const locale = document.documentElement.lang || 'en';
        const url =
            locale === 'en'
                ? `/products.json?limit=50&page=${page}`
                : `/${locale}/products.json?limit=50&page=${page}`;

        const res = await fetch(url);
        const data = await res.json();

        if (Array.isArray(data.products) && data.products.length) {
            allProducts = allProducts.concat(data.products);
            page++;
        } else {
            keepFetching = false;
        }
    }

    return allProducts;
}

async function renderWishlist() {
    const container = document.querySelector('.wishlistpanel__content');
    if (!container) return;

    const ids = getLocalWishlist().map(Number);
    if (!ids.length) {
        container.innerHTML = '<p class="empty-message">Your wishlist is empty</p>';
        return;
    }

    try {
        const allProducts = await fetchAllProducts();
        const wishlistProducts = allProducts.filter((p) => ids.includes(p.id));

        if (!wishlistProducts.length) {
            container.innerHTML = '<p class="empty-message">Your wishlist is empty</p>';
            return;
        }

        const html = wishlistProducts.map(renderWishlistCard).join('');
        container.innerHTML = html;

        updateWishlistState();
        bindWishlistClickEvents();
    } catch (error) {
        console.error('Wishlist load error:', error);
        container.innerHTML = '<p class="error-message">Failed to load wishlist items.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initWishlist();

    // Якщо є контейнер — рендеримо повний список
    if (document.querySelector('.wishlistpanel__content')) {
        renderWishlist();
    }
});
