// week08/frontend/main.js

document.addEventListener('DOMContentLoaded', () => {
    // API endpoints for the Product and Order services.
    // These ports (8000 for Product, 8001 for Order) are exposed externally by your AKS LoadBalancer.
    // Hardcoded external IPs with HTTP protocol
    const PRODUCT_API_BASE_URL = 'http://20.167.19.157:8000';
    const ORDER_API_BASE_URL = 'http://4.254.44.158:8001';

    // Product Service is named 'product-service-w04e2' and exposes port 8000 internally.
    //const PRODUCT_API_BASE_URL = 'http://product-service-w04e2:8000';
    // Order Service is named 'order-service-w04e2' and exposes port 8001 internally.
    //const ORDER_API_BASE_URL = 'http://order-service-w04e2:8001';

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
    let productsCache = {}; // Cache products fetched to easily get details for cart items

    // --- Utility Functions ---

    // Function to display messages to the user (success, error, info)
    function showMessage(message, type = 'info') {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = 'block';
        // Hide after 5 seconds
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    }

    // Function to format currency
    function formatCurrency(amount) {
        return `$${parseFloat(amount).toFixed(2)}`;
    }

    // --- Product Service Interactions ---

    // Fetch and display products
    async function fetchProducts() {
        productListDiv.innerHTML = '<p>Loading products...</p>';
        const url = `${PRODUCT_API_BASE_URL}/products/`;
        console.log("Attempting to fetch products from URL:", url); // DEBUG LOG
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            const products = await response.json();
            
            productListDiv.innerHTML = ''; // Clear previous content
            productsCache = {}; // Clear existing cache

            if (products.length === 0) {
                productListDiv.innerHTML = '<p>No products available yet. Add some above!</p>';
                return;
            }

            products.forEach(product => {
                productsCache[product.product_id] = product; // Cache product details
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                
                // console.log(`Product ID: ${product.product_id}, Image URL received:`, product.image_url); // Diagnostic log from previous iteration

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

    // Rest of your code (productForm submission, add to cart, upload image, order service, etc.) stays exactly the same
    // ...

    // Initial data fetch on page load
    fetchProducts();
    fetchOrders();
});
