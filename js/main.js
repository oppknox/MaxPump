/**
 * MaxPumpSport Main Application Module
 * Handles product display, search, filtering, and site functionality
 */

const App = (() => {
    // DOM Elements
    const _elements = {
        productContainer: document.getElementById('product-container'),
        productSearch: document.getElementById('product-search'),
        searchBtn: document.getElementById('search-btn'),
        categorySelect: document.getElementById('category-select'),
        menuToggle: document.getElementById('menu-toggle'),
        mainMenu: document.getElementById('main-menu')
    };

    // Private methods
    const _init = async () => {
        // Load data first
        await DataModule.loadData();
        
        // Populate categories
        _populateCategories();
        
        // Load all products
        _loadProducts();
        
        // Bind events
        _bindEvents();
        
        // Add notification styles dynamically
        _addNotificationStyles();
        
        // Create placeholder images for logo
        _createPlaceholderLogos();
    };

    const _bindEvents = () => {
        // Search functionality
        _elements.searchBtn.addEventListener('click', () => {
            const query = _elements.productSearch.value.trim();
            _handleSearch(query);
        });
        
        _elements.productSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = _elements.productSearch.value.trim();
                _handleSearch(query);
            }
        });
        
        // Category filter
        _elements.categorySelect.addEventListener('change', () => {
            const categoryId = _elements.categorySelect.value;
            _handleCategoryFilter(categoryId);
        });
        
        // Mobile menu toggle
        _elements.menuToggle.addEventListener('click', () => {
            _elements.mainMenu.classList.toggle('show');
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.main-menu') && !e.target.closest('.menu-toggle') && 
                _elements.mainMenu.classList.contains('show')) {
                _elements.mainMenu.classList.remove('show');
            }
        });
        
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80, // Accounting for header height
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu if open
                    if (_elements.mainMenu.classList.contains('show')) {
                        _elements.mainMenu.classList.remove('show');
                    }
                }
            });
        });
    };

    const _populateCategories = () => {
        const categories = DataModule.getCategories();
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            _elements.categorySelect.appendChild(option);
        });
    };

    const _loadProducts = (products = null) => {
        // Clear container
        _elements.productContainer.innerHTML = '';
        
        // If no products are provided, load all products
        if (!products) {
            products = DataModule.getAllProducts();
        }
        
        // If no products found, show message
        if (products.length === 0) {
            _elements.productContainer.innerHTML = '<p class="no-products">No products found matching your criteria.</p>';
            return;
        }
        
        // Get product card template
        const template = document.getElementById('product-card-template');
        
        // Render each product
        products.forEach(product => {
            const clone = document.importNode(template.content, true);
            const productCard = clone.querySelector('.product-card');
            
            // Set product ID
            productCard.dataset.productId = product.id;
            
            // Set image
            const img = clone.querySelector('.product-image img');
            
            // Use the correct image file path that works both locally and on GitHub Pages
            const basePath = window.location.hostname === 'oppknox.github.io' ? '/MaxPump' : '';
            img.src = `${basePath}/images/products/${product.images[0]}`;
            img.alt = product.name;
            
            // Set availability badge with enhanced stock information
            const badge = clone.querySelector('.availability-badge');
            if (product.inStock && product.locations.length > 0) {
                const totalQuantity = product.locations.reduce((sum, loc) => sum + loc.quantity, 0);
                badge.textContent = `In Stock (${totalQuantity})`;
                badge.classList.add('in-stock');
                
                // Add location tooltips for in-stock items
                const tooltip = document.createElement('div');
                tooltip.className = 'stock-tooltip';
                
                let tooltipContent = '<div class="tooltip-title">Available at:</div>';
                product.locations.forEach(loc => {
                    if (loc.quantity > 0) {
                        const location = DataModule.getLocations().find(l => l.name === loc.name);
                        tooltipContent += `
                            <div class="tooltip-location">
                                <span class="location-name">${loc.name}</span>
                                <span class="location-qty">${loc.quantity} units</span>
                            </div>
                        `;
                    }
                });
                
                tooltip.innerHTML = tooltipContent;
                clone.querySelector('.product-image').appendChild(tooltip);
                
                // Show tooltip on hover
                productCard.addEventListener('mouseenter', () => {
                    tooltip.classList.add('show');
                });
                
                productCard.addEventListener('mouseleave', () => {
                    tooltip.classList.remove('show');
                });
            } else {
                const buildTime = product.buildTime > 0 
                    ? ` (${product.buildTime} day build)` 
                    : '';
                badge.textContent = `Built to Order${buildTime}`;
                badge.classList.add('built-to-order');
            }
            
            // Set info
            clone.querySelector('.product-name').textContent = product.name;
            clone.querySelector('.product-id').textContent = product.id;
            clone.querySelector('.product-price').textContent = DataModule.formatPrice(product.price);
            
            // Append to container
            _elements.productContainer.appendChild(clone);
        });
        
        // Update compare buttons state
        if (ProductComparison) {
            ProductComparison.updateCompareButtons();
        }
    };

    const _handleSearch = (query) => {
        if (!query) {
            _loadProducts();
            return;
        }
        
        const filteredProducts = DataModule.searchProducts(query);
        _loadProducts(filteredProducts);
    };

    const _handleCategoryFilter = (categoryId) => {
        if (categoryId === 'all') {
            _loadProducts();
            return;
        }
        
        const filteredProducts = DataModule.getProductsByCategory(categoryId);
        _loadProducts(filteredProducts);
    };

    const _addNotificationStyles = () => {
        // Create style element
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: var(--success-color);
                color: white;
                padding: 12px 20px;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                z-index: 9999;
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.3s, transform 0.3s;
            }
            
            .notification.show {
                opacity: 1;
                transform: translateY(0);
            }
            
            .action-notification {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                background-color: var(--secondary-color);
                padding: 15px 20px;
            }
            
            .action-notification button {
                padding: 8px 15px;
                font-size: 14px;
                white-space: nowrap;
            }
        `;
        
        // Add to head
        document.head.appendChild(style);
    };

    const _createPlaceholderLogos = () => {
        const logoPlaceholder = document.getElementById('logo-placeholder');
        if (logoPlaceholder) {
            logoPlaceholder.textContent = 'MAXPUMP';
        }
        
        const footerLogoPlaceholder = document.getElementById('footer-logo-placeholder');
        if (footerLogoPlaceholder) {
            footerLogoPlaceholder.textContent = 'MAXPUMP';
        }
    };

    // Public methods
    return {
        init: _init
    };
})();

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
