// week08/frontend/main.js

document.addEventListener('DOMContentLoaded', () => {
    // API endpoints for the Product and Order services.
    const PRODUCT_API_BASE_URL = 'http://20.167.19.157:8000';
    const ORDER_API_BASE_URL = 'http://4.254.44.158:8001';

    // DOM Elements
    const messageBox = document.getElementById('message-box');
    const productForm = document.getElementById('product-form');
    const productListDiv = document.getElementById('product-list');
    const cartItemsList = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    const placeOrderForm = document.getElementById('place-order-form');
    const orderListDiv = document.getElementById('order-list');

    // Shopping Cart State
    let cart = [];
    let productsCache = {};

    // --- Utility Functions ---
    function showMessage(message, type = 'info') {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = 'block';
        setTimeout(() => { messageBox.style.display = 'none'; }, 5000);
    }

    function formatCurrency(amount) {
        return `$${parseFloat(amount).toFixed(2)}`;
    }

    // --- Product Service Interactions ---
    async function fetchProducts() {
        productListDiv.innerHTML = '<p>Loading products...</p>';
        try {
            const response = await fetch(`${PRODUCT_API_BASE_URL}/products/`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const products = await response.json();

            productListDiv.innerHTML = '';
            productsCache = {};

            if (products.length === 0) {
                productListDiv.innerHTML = '<p>No products available yet. Add some above!</p>';
                return;
            }

            products.forEach(product => {
                productsCache[product.product_id] = product;
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <img src="${product.image_url || 'https://placehold.co/300x200/cccccc/333333?text=No+Image'}" alt="${product.name}" onerror="this.onerror=null;this.src='https://placehold.co/300x200/cccccc/333333?text=Image+Error';" />
                    <h3>${product.name} (ID: ${product.product_id})</h3>
                    <p>${product.description || 'No description available.'}</p>
                    <p class="price">${formatCurrency(product.price)}</p>
                    <p class="stock">Stock: ${product.stock_quantity}</p>
                    <p><small>Created: ${new Date(product.created_at).toLocaleString()}</small></p>
                    <p><small>Last Updated: ${new Date(product.updated_at).toLocaleString()}</small></p>
                    <div class="upload-image-group">
                        <label for="image-upload-${product.product_id}">Upload Image:</label>
                        <input type="file" id="image-upload-${product.product_id}" accept="image/*" data-product-id="${product.product_id}">
                        <button class="upload-btn" data-id="${product.product_id}">Upload Photo</button>
                    </div>
                    <div class="card-actions">
                        <button class="add-to-cart-btn" data-id="${product.product_id}" data-name="${product.name}" data-price="${product.price}">Add to Cart</button>
                        <button class="delete-btn" data-id="${product.product_id}">Delete</button>
                    </div>
                `;
                productListDiv.appendChild(productCard);
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            showMessage(`Failed to load products: ${error.message}`, 'error');
            productListDiv.innerHTML = '<p>Could not load products. Please check the Product Service.</p>';
        }
    }

    // --- Order Service Interactions ---
    async function fetchOrders() {
        orderListDiv.innerHTML = '<p>Loading orders...</p>';
        try {
            const response = await fetch(`${ORDER_API_BASE_URL}/orders/`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const orders = await response.json();
            orderListDiv.innerHTML = '';

            if (orders.length === 0) {
                orderListDiv.innerHTML = '<p>No orders yet.</p>';
                return;
            }

            orders.forEach(order => {
                const orderCard = document.createElement('div');
                orderCard.className = 'order-card';
                orderCard.innerHTML = `
                    <h3>Order ID: ${order.order_id}</h3>
                    <p>User ID: ${order.user_id}</p>
                    <p>Total Amount: ${formatCurrency(order.total_amount)}</p>
                    <p>Status: ${order.status}</p>
                `;
                orderListDiv.appendChild(orderCard);
            });
        } catch (err) {
            console.error('Error fetching orders:', err);
            showMessage(`Failed to load orders: ${err.message}`, 'error');
            orderListDiv.innerHTML = '<p>Could not load orders. Check Order Service.</p>';
        }
    }

    // --- Shopping Cart Functions ---
    function addToCart(productId, productName, productPrice) {
        const existingItemIndex = cart.findIndex(item => item.product_id === productId);
        if (existingItemIndex !== -1) {
            cart[existingItemIndex].quantity += 1;
        } else {
            cart.push({ product_id: productId, name: productName, price: productPrice, quantity: 1 });
        }
        updateCartDisplay();
        showMessage(`Added "${productName}" to cart!`);
    }

    function updateCartDisplay() {
        cartItemsList.innerHTML = '';
        let totalCartAmount = 0;

        if (cart.length === 0) {
            cartItemsList.innerHTML = '<li>Your cart is empty.</li>';
        } else {
            cart.forEach(item => {
                const li = document.createElement('li');
                const itemTotal = item.quantity * item.price;
                totalCartAmount += itemTotal;
                li.innerHTML = `<span>${item.name} (x${item.quantity})</span> - <span>${formatCurrency(item.price)} each, Total: ${formatCurrency(itemTotal)}</span>`;
                cartItemsList.appendChild(li);
            });
        }
        cartTotalSpan.textContent = `Total: ${formatCurrency(totalCartAmount)}`;
    }

    // --- Event Listeners ---

    // Product Form Submission
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('product-name').value;
        const description = document.getElementById('product-description').value;
        const price = parseFloat(document.getElementById('product-price').value);
        const stock_quantity = parseInt(document.getElementById('product-stock').value);

        const productData = { name, description, price, stock_quantity };

        try {
            const response = await fetch(`${PRODUCT_API_BASE_URL}/products/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to add product');
            }

            showMessage('Product added successfully!', 'success');
            productForm.reset();
            fetchProducts();

        } catch (err) {
            console.error(err);
            showMessage(err.message, 'error');
        }
    });

    // Add to Cart
    productListDiv.addEventListener('click', e => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const id = e.target.dataset.id;
            const name = e.target.dataset.name;
            const price = parseFloat(e.target.dataset.price);
            addToCart(id, name, price);
        }
    });

    // Upload Product Image
    productListDiv.addEventListener('click', async e => {
        if (e.target.classList.contains('upload-btn')) {
            const productId = e.target.dataset.id;
            const fileInput = document.getElementById(`image-upload-${productId}`);
            if (!fileInput.files.length) return showMessage('Select an image first!', 'error');

            const formData = new FormData();
            formData.append('image', fileInput.files[0]);

            try {
                const response = await fetch(`${PRODUCT_API_BASE_URL}/products/${productId}/upload-image/`, {
                    method: 'POST',
                    body: formData
                });
                if (!response.ok) throw new Error('Image upload failed');
                showMessage('Image uploaded successfully!', 'success');
                fetchProducts();
            } catch (err) {
                console.error(err);
                showMessage(err.message, 'error');
            }
        }
    });

    // Place Order
    placeOrderForm.addEventListener('submit', async e => {
        e.preventDefault();
        if (!cart.length) return showMessage('Cart is empty!', 'error');

        const orderData = { items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity })) };
        try {
            const response = await fetch(`${ORDER_API_BASE_URL}/orders/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            if (!response.ok) throw new Error('Order placement failed');
            showMessage('Order placed successfully!', 'success');
            cart = [];
            updateCartDisplay();
            fetchOrders();
        } catch (err) {
            console.error(err);
            showMessage(err.message, 'error');
        }
    });

    // --- Initial Data Fetch ---
    fetchProducts();
    fetchOrders();
});
