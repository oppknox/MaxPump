/**
 * MaxPumpSport Product Comparison Module
 * Handles product comparison functionality
 */

const ProductComparison = (() => {
    // Private variables
    let _comparisonProducts = [];
    const MAX_COMPARISON_PRODUCTS = 2;

    // DOM Elements
    const _elements = {
        comparisonModal: document.getElementById('comparison-modal'),
        comparisonContainer: document.getElementById('comparison-container'),
        closeComparisonBtn: document.getElementById('close-comparison')
    };

    // Local storage key
    const STORAGE_KEY = 'maxpump_comparison_products';

    // Private methods
    const _init = () => {
        _loadFromStorage();
        _bindEvents();
    };

    const _bindEvents = () => {
        // Close comparison modal
        _elements.closeComparisonBtn.addEventListener('click', () => {
            _elements.comparisonModal.style.display = 'none';
        });

        // Listen for compare buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-compare-btn') || 
                e.target.closest('.add-to-compare-btn')) {
                const productCard = e.target.closest('.product-card');
                if (productCard) {
                    const productId = productCard.dataset.productId;
                    _toggleComparisonProduct(productId);
                }
            }
        });
    };

    const _loadFromStorage = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                _comparisonProducts = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading comparison products from storage:', error);
            _comparisonProducts = [];
        }
    };

    const _saveToStorage = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(_comparisonProducts));
        } catch (error) {
            console.error('Error saving comparison products to storage:', error);
        }
    };

    const _toggleComparisonProduct = (productId) => {
        const product = DataModule.getProductById(productId);
        if (!product) return;

        const index = _comparisonProducts.indexOf(productId);
        
        if (index > -1) {
            // Product is already in comparison, remove it
            _comparisonProducts.splice(index, 1);
            _saveToStorage();
            _showNotification(`${product.name} removed from comparison`);
            _updateCompareButtons();
        } else {
            // Add product to comparison
            if (_comparisonProducts.length >= MAX_COMPARISON_PRODUCTS) {
                _showNotification(`You can only compare ${MAX_COMPARISON_PRODUCTS} products at a time. Please remove a product first.`);
                return;
            }
            
            _comparisonProducts.push(productId);
            _saveToStorage();
            _showNotification(`${product.name} added to comparison`);
            _updateCompareButtons();
            
            // If we now have 2 or more products, offer to show comparison
            if (_comparisonProducts.length >= 2) {
                const viewComparisonNotification = document.createElement('div');
                viewComparisonNotification.className = 'notification action-notification';
                viewComparisonNotification.innerHTML = `
                    <span>${_comparisonProducts.length} products in comparison</span>
                    <button id="view-comparison-btn" class="btn-primary">View Comparison</button>
                `;
                
                document.body.appendChild(viewComparisonNotification);
                
                // Add event listener to the button
                document.getElementById('view-comparison-btn').addEventListener('click', () => {
                    _openComparisonModal();
                    document.body.removeChild(viewComparisonNotification);
                });
                
                // Show notification
                setTimeout(() => {
                    viewComparisonNotification.classList.add('show');
                }, 10);
                
                // Auto hide after some time
                setTimeout(() => {
                    viewComparisonNotification.classList.remove('show');
                    setTimeout(() => {
                        if (document.body.contains(viewComparisonNotification)) {
                            document.body.removeChild(viewComparisonNotification);
                        }
                    }, 500);
                }, 5000);
            }
        }
    };

    const _updateCompareButtons = () => {
        // Update all compare buttons to show active state
        const compareButtons = document.querySelectorAll('.add-to-compare-btn');
        
        compareButtons.forEach(button => {
            const productCard = button.closest('.product-card');
            if (productCard) {
                const productId = productCard.dataset.productId;
                const isComparing = _comparisonProducts.includes(productId);
                
                if (isComparing) {
                    button.classList.add('comparing');
                    button.innerHTML = '<i class="fas fa-check"></i> Comparing <i class="fas fa-times remove-icon"></i>';
                    button.title = 'Click to remove from comparison';
                } else {
                    button.classList.remove('comparing');
                    button.innerHTML = '<i class="fas fa-exchange-alt"></i> Compare';
                    button.title = 'Click to add to comparison';
                }
            }
        });
    };

    const _openComparisonModal = () => {
        if (_comparisonProducts.length < 2) {
            _showNotification('Please select at least 2 products to compare');
            return;
        }
        
        _renderComparisonTable();
        _elements.comparisonModal.style.display = 'block';
    };

    const _renderComparisonTable = () => {
        if (_comparisonProducts.length === 0) {
            _elements.comparisonContainer.innerHTML = '<p class="empty-comparison">Select products to compare.</p>';
            return;
        }

        // Get products
        const products = _comparisonProducts.map(id => DataModule.getProductById(id)).filter(p => p !== null);
        
        // Create table
        let tableHTML = '<table class="comparison-table">';
        
        // Table header
        tableHTML += '<thead><tr><th>Feature</th>';
        products.forEach(product => {
            tableHTML += `<th>
                <div>${product.name}</div>
                <div>${product.id}</div>
                <button class="remove-from-comparison" data-product-id="${product.id}">
                    <i class="fas fa-times"></i>
                </button>
            </th>`;
        });
        tableHTML += '</tr></thead>';
        
        // Table body
        tableHTML += '<tbody>';
        
        // Image row
        tableHTML += '<tr><td>Image</td>';
        products.forEach(product => {
            const basePath = window.location.hostname === 'oppknox.github.io' ? '/MaxPump' : '';
            tableHTML += `<td>
                <div class="comparison-image">
                    <img src="${basePath}/images/products/${product.images[0]}" alt="${product.name}">
                </div>
            </td>`;
        });
        tableHTML += '</tr>';
        
        // Price row
        tableHTML += '<tr><td>Price</td>';
        products.forEach(product => {
            tableHTML += `<td>${DataModule.formatPrice(product.price)}</td>`;
        });
        tableHTML += '</tr>';
        
        // Availability row with enhanced information
        tableHTML += '<tr><td>Availability</td>';
        products.forEach(product => {
            const availability = DataModule.getAvailabilityText(product.id);
            const statusClass = product.inStock ? 'status-in-stock' : 'status-built-to-order';
            
            tableHTML += `<td>
                <div class="comparison-availability ${statusClass}">${availability}</div>
                ${product.buildTime > 0 ? `<div class="comparison-build-time">Build Time: ${product.buildTime} days</div>` : ''}
            </td>`;
        });
        tableHTML += '</tr>';
        
        // Inventory Locations row (new)
        tableHTML += '<tr><td>Inventory Locations</td>';
        products.forEach(product => {
            if (product.inStock && product.locations.length > 0) {
                tableHTML += `<td>
                    <div class="comparison-inventory">
                        ${product.locations.map(loc => {
                            if (loc.quantity > 0) {
                                return `<div class="inventory-location">
                                    <span class="location-name">${loc.name}</span>
                                    <span class="location-qty">${loc.quantity} units</span>
                                </div>`;
                            }
                            return '';
                        }).join('')}
                    </div>
                </td>`;
            } else {
                tableHTML += `<td>
                    <div class="comparison-no-inventory">No inventory - Built to order</div>
                </td>`;
            }
        });
        tableHTML += '</tr>';
        
        // Dimensions row
        tableHTML += '<tr><td>Dimensions</td>';
        products.forEach(product => {
            tableHTML += `<td>${product.dimensions}</td>`;
        });
        tableHTML += '</tr>';
        
        // Height row
        tableHTML += '<tr><td>Height (Ft)</td>';
        products.forEach(product => {
            tableHTML += `<td>${product.heightFt}'</td>`;
        });
        tableHTML += '</tr>';
        
        // Features row
        tableHTML += '<tr><td>Features</td>';
        products.forEach(product => {
            tableHTML += '<td><ul>';
            product.features.forEach(feature => {
                tableHTML += `<li>${feature}</li>`;
            });
            tableHTML += '</ul></td>';
        });
        tableHTML += '</tr>';
        
        // Category row
        tableHTML += '<tr><td>Category</td>';
        products.forEach(product => {
            tableHTML += `<td>${product.category.join(', ')}</td>`;
        });
        tableHTML += '</tr>';
        
        // Actions row
        tableHTML += '<tr><td>Actions</td>';
        products.forEach(product => {
            tableHTML += `<td>
                <button class="btn-primary add-to-quote-from-comparison" data-product-id="${product.id}">
                    Add to Quote
                </button>
                <button class="btn-secondary view-details-from-comparison" data-product-id="${product.id}">
                    View Details
                </button>
            </td>`;
        });
        tableHTML += '</tr>';
        
        tableHTML += '</tbody></table>';
        
        // Set HTML
        _elements.comparisonContainer.innerHTML = tableHTML;
        
        // Add event listeners for the remove buttons
        const removeButtons = _elements.comparisonContainer.querySelectorAll('.remove-from-comparison');
        removeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const productId = button.dataset.productId;
                _toggleComparisonProduct(productId);
                
                // If we have less than 2 products now, close the modal
                if (_comparisonProducts.length < 2) {
                    _elements.comparisonModal.style.display = 'none';
                } else {
                    _renderComparisonTable();
                }
            });
        });
        
        // Add event listeners for action buttons
        const addToQuoteButtons = _elements.comparisonContainer.querySelectorAll('.add-to-quote-from-comparison');
        addToQuoteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const productId = button.dataset.productId;
                QuoteBuilder.addToQuote(productId, 1);
            });
        });
        
        const viewDetailsButtons = _elements.comparisonContainer.querySelectorAll('.view-details-from-comparison');
        viewDetailsButtons.forEach(button => {
            button.addEventListener('click', () => {
                const productId = button.dataset.productId;
                _elements.comparisonModal.style.display = 'none';
                ProductDetail.openDetailModal(productId);
            });
        });
    };

    const _showNotification = (message) => {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after animation
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    };

    // Public methods
    return {
        init: _init,
        getComparisonProducts: () => [..._comparisonProducts],
        toggleComparisonProduct: _toggleComparisonProduct,
        openComparisonModal: _openComparisonModal,
        updateCompareButtons: _updateCompareButtons
    };
})();

// Initialize after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize after data is loaded
    DataModule.loadData().then(() => {
        ProductComparison.init();
    });
});

// Product Detail Module - For handling product details modal
const ProductDetail = (() => {
    // DOM Elements
    const _elements = {
        detailModal: document.getElementById('product-detail-modal'),
        detailProductName: document.getElementById('detail-product-name'),
        detailProductContent: document.getElementById('detail-product-content'),
        detailProductQty: document.getElementById('detail-product-qty'),
        detailDecreaseQty: document.getElementById('detail-decrease-qty'),
        detailIncreaseQty: document.getElementById('detail-increase-qty'),
        detailAddToQuote: document.getElementById('detail-add-to-quote'),
        detailCloseBtn: document.getElementById('detail-close')
    };

    // Private methods
    const _init = () => {
        _bindEvents();
    };

    const _bindEvents = () => {
        // Quantity controls
        _elements.detailDecreaseQty.addEventListener('click', () => {
            const currentQty = parseInt(_elements.detailProductQty.value, 10);
            _elements.detailProductQty.value = Math.max(1, currentQty - 1);
        });
        
        _elements.detailIncreaseQty.addEventListener('click', () => {
            const currentQty = parseInt(_elements.detailProductQty.value, 10);
            _elements.detailProductQty.value = currentQty + 1;
        });
        
        // Close button
        _elements.detailCloseBtn.addEventListener('click', () => {
            _elements.detailModal.style.display = 'none';
        });
        
        // Listen for view details buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-details-btn') || 
                e.target.closest('.view-details-btn')) {
                const productCard = e.target.closest('.product-card');
                if (productCard) {
                    const productId = productCard.dataset.productId;
                    _openDetailModal(productId);
                }
            }
        });
    };

    const _openDetailModal = (productId) => {
        const product = DataModule.getProductById(productId);
        if (!product) return;
        
        // Set product name
        _elements.detailProductName.textContent = product.name;
        
        // Reset quantity
        _elements.detailProductQty.value = 1;
        
        // Set product ID for add to quote button
        _elements.detailAddToQuote.dataset.productId = productId;
        
        // Render product content
        _renderProductDetail(product);
        
        // Show modal
        _elements.detailModal.style.display = 'block';
    };

    const _renderProductDetail = (product) => {
        // Create images section
        const basePath = window.location.hostname === 'oppknox.github.io' ? '/MaxPump' : '';
        const imagesHTML = `
            <div class="detail-product-images">
                <div class="detail-main-image">
                    <img src="${basePath}/images/products/${product.images[0]}" alt="${product.name}">
                </div>
                <div class="detail-image-thumbnails">
                    ${product.images.map((img, index) => `
                        <div class="detail-thumbnail ${index === 0 ? 'active' : ''}" data-image="${img}">
                            <img src="${basePath}/images/products/${img}" alt="${product.name} thumbnail ${index + 1}">
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Create inventory section with detailed location information
        const inventoryHTML = product.inStock && product.locations.length > 0 
            ? `<div class="detail-product-inventory">
                <h3>Inventory Availability</h3>
                ${product.locations.map(loc => {
                    if (loc.quantity > 0) {
                        return `<div class="inventory-location-detail">
                            <strong>${loc.name}:</strong> ${loc.quantity} units
                            ${loc.readyToShip ? '<span class="ready-to-ship">Ready to Ship</span>' : ''}
                        </div>`;
                    }
                    return '';
                }).join('')}
              </div>`
            : '';
        
        // Create info section
        const infoHTML = `
            <div class="detail-product-info">
                <p class="detail-product-id">${product.id}</p>
                <p class="detail-product-price">${DataModule.formatPrice(product.price)}</p>
                
                <div class="detail-product-status ${product.inStock ? 'status-in-stock' : 'status-built-to-order'}">
                    ${DataModule.getAvailabilityText(product.id)}
                </div>
                
                ${inventoryHTML}
                
                <div class="detail-product-description">
                    ${product.description}
                </div>
                
                <div class="detail-product-specs">
                    <h3>Specifications</h3>
                    <div class="spec-item">
                        <span class="spec-label">Dimensions:</span>
                        <span>${product.dimensions}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Height:</span>
                        <span>${product.heightFt}'</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Category:</span>
                        <span>${product.category.join(', ')}</span>
                    </div>
                    ${product.buildTime > 0 ? `
                    <div class="spec-item">
                        <span class="spec-label">Build Time:</span>
                        <span>${product.buildTime} days</span>
                    </div>` : ''}
                </div>
                
                <div class="detail-product-features">
                    <h3>Features</h3>
                    <ul>
                        ${product.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        
        // Set content
        _elements.detailProductContent.innerHTML = imagesHTML + infoHTML;
        
        // Add thumbnail click handlers
        const thumbnails = _elements.detailProductContent.querySelectorAll('.detail-thumbnail');
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', () => {
                // Update active thumbnail
                thumbnails.forEach(t => t.classList.remove('active'));
                thumbnail.classList.add('active');
                
                // Update main image with correct path for GitHub Pages
                const mainImg = _elements.detailProductContent.querySelector('.detail-main-image img');
                const basePath = window.location.hostname === 'oppknox.github.io' ? '/MaxPump' : '';
                mainImg.src = `${basePath}/images/products/${thumbnail.dataset.image}`;
            });
        });
    };

    // Public methods
    return {
        init: _init,
        openDetailModal: _openDetailModal
    };
})();

// Initialize after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize after data is loaded
    DataModule.loadData().then(() => {
        ProductDetail.init();
    });
});

// Export for use in other modules
window.ProductComparison = ProductComparison;
window.ProductDetail = ProductDetail;
