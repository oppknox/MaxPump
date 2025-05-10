/**
 * MaxPumpSport Data Module
 * Handles loading and processing of product data
 */

const DataModule = (() => {
    // Private variables
    let _products = [];
    let _locations = [];
    let _categories = [];
    let _isDataLoaded = false;

    // Private methods
    const _formatPrice = (price) => {
        return price.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        });
    };

    // Public methods
    return {
        /**
         * Load product data from JSON file
         * @returns {Promise} Promise resolving when data is loaded
         */
        loadData: async () => {
            if (_isDataLoaded) {
                return Promise.resolve({
                    products: _products,
                    locations: _locations,
                    categories: _categories
                });
            }

            try {
                // Use a path that works both locally and on GitHub Pages
                const basePath = window.location.hostname === 'oppknox.github.io' ? '/MaxPump' : '';
                const response = await fetch(`${basePath}/data/products.json`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                _products = data.products;
                _locations = data.locations;
                _categories = data.categories;
                _isDataLoaded = true;
                
                console.log('Data loaded successfully:', {
                    products: _products.length,
                    locations: _locations.length,
                    categories: _categories.length
                });
                
                return {
                    products: _products,
                    locations: _locations,
                    categories: _categories
                };
            } catch (error) {
                console.error('Error loading data:', error);
                return {
                    products: [],
                    locations: [],
                    categories: []
                };
            }
        },

        /**
         * Get all products
         * @returns {Array} Array of product objects
         */
        getAllProducts: () => {
            return [..._products];
        },

        /**
         * Get product by ID
         * @param {String} id Product ID
         * @returns {Object|null} Product object or null if not found
         */
        getProductById: (id) => {
            return _products.find(product => product.id === id) || null;
        },

        /**
         * Filter products by category
         * @param {String} categoryId Category ID
         * @returns {Array} Filtered array of product objects
         */
        getProductsByCategory: (categoryId) => {
            if (categoryId === 'all') {
                return [..._products];
            }
            
            const categoryName = _categories.find(cat => cat.id === categoryId)?.name;
            if (!categoryName) return [];
            
            return _products.filter(product => 
                product.category.includes(categoryName)
            );
        },

        /**
         * Search products by text query
         * @param {String} query Search query
         * @returns {Array} Filtered array of product objects
         */
        searchProducts: (query) => {
            if (!query) return [..._products];
            
            const lowerQuery = query.toLowerCase();
            return _products.filter(product => 
                product.name.toLowerCase().includes(lowerQuery) ||
                product.id.toLowerCase().includes(lowerQuery) ||
                product.description.toLowerCase().includes(lowerQuery)
            );
        },

        /**
         * Get all categories
         * @returns {Array} Array of category objects
         */
        getCategories: () => {
            return [..._categories];
        },

        /**
         * Get all locations
         * @returns {Array} Array of location objects
         */
        getLocations: () => {
            return [..._locations];
        },

        /**
         * Format price as currency
         * @param {Number} price Price to format
         * @returns {String} Formatted price string
         */
        formatPrice: _formatPrice,

        /**
         * Get related products for a given product
         * @param {String} productId ID of the product to get related products for
         * @returns {Array} Array of related product objects
         */
        getRelatedProducts: (productId) => {
            const product = DataModule.getProductById(productId);
            if (!product || !product.relatedProducts || product.relatedProducts.length === 0) {
                return [];
            }
            
            return product.relatedProducts
                .map(id => DataModule.getProductById(id))
                .filter(p => p !== null);
        },

        /**
         * Check if a product is in stock
         * @param {String} productId ID of the product to check
         * @returns {Boolean} True if product is in stock, false otherwise
         */
        isProductInStock: (productId) => {
            const product = DataModule.getProductById(productId);
            if (!product) return false;
            
            return product.inStock && product.locations.length > 0;
        },

        /**
         * Get availability text for a product
         * @param {String} productId ID of the product to check
         * @returns {String} Availability text
         */
        getAvailabilityText: (productId) => {
            const product = DataModule.getProductById(productId);
            if (!product) return 'Unknown availability';
            
            if (product.inStock && product.locations.length > 0) {
                const totalQuantity = product.locations.reduce((sum, loc) => sum + loc.quantity, 0);
                return `In Stock (${totalQuantity} available)`;
            } else {
                return product.buildTime > 0 
                    ? `Built to order (${product.buildTime} day build time)` 
                    : 'Built to order';
            }
        },

        /**
         * Calculate total quantity of a product across all locations
         * @param {String} productId ID of the product to check
         * @returns {Number} Total quantity available
         */
        getTotalQuantity: (productId) => {
            const product = DataModule.getProductById(productId);
            if (!product || !product.locations) return 0;
            
            return product.locations.reduce((sum, loc) => sum + loc.quantity, 0);
        }
    };
})();

// Export for use in other modules
window.DataModule = DataModule;
