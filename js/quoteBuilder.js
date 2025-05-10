/**
 * MaxPumpSport Quote Builder Module
 * Handles all quote building functionality including adding products,
 * managing quantities, and location assignments
 */

const QuoteBuilder = (() => {
    // Private variables
    let _quoteItems = [];
    let _locationAssignments = {};
    let _customLocations = [];

    // DOM Elements
    const _elements = {
        quoteBtn: document.getElementById('quote-btn'),
        quoteCount: document.getElementById('quote-count'),
        quoteModal: document.getElementById('quote-modal'),
        quoteItems: document.getElementById('quote-items'),
        quoteSubtotal: document.getElementById('quote-subtotal'),
        quoteTax: document.getElementById('quote-tax'),
        quoteTotal: document.getElementById('quote-total'),
        continueShoppingBtn: document.getElementById('continue-shopping'),
        requestQuoteBtn: document.getElementById('request-quote'),
        locationModal: document.getElementById('location-modal'),
        locationProductInfo: document.getElementById('location-product-info'),
        locationAssignments: document.getElementById('location-assignments'),
        saveLocationsBtn: document.getElementById('save-locations'),
        cancelLocationsBtn: document.getElementById('cancel-locations'),
        closeModalBtns: document.querySelectorAll('.close-modal')
    };

    // Local storage keys
    const STORAGE_KEYS = {
        QUOTE_ITEMS: 'maxpump_quote_items',
        LOCATION_ASSIGNMENTS: 'maxpump_location_assignments',
        CUSTOM_LOCATIONS: 'maxpump_custom_locations'
    };

    // Private methods
    const _init = () => {
        _loadFromStorage();
        _bindEvents();
        _updateQuoteCount();
    };

    const _bindEvents = () => {
        // Quote button click
        _elements.quoteBtn.addEventListener('click', _openQuoteModal);

        // Continue shopping button
        _elements.continueShoppingBtn.addEventListener('click', _closeQuoteModal);

        // Request quote button
        _elements.requestQuoteBtn.addEventListener('click', _handleRequestQuote);

        // Close modal buttons
        _elements.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                modal.style.display = 'none';
            });
        });

        // Location modal events
        _elements.saveLocationsBtn.addEventListener('click', _saveLocationAssignments);
        _elements.cancelLocationsBtn.addEventListener('click', () => {
            _elements.locationModal.style.display = 'none';
        });

        // Add location button
        document.getElementById('add-location-btn').addEventListener('click', _addNewLocation);

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Listen for add to quote buttons
        document.addEventListener('click', (e) => {
            // Handle add to quote from product card
            if (e.target.classList.contains('add-to-quote-btn')) {
                const productCard = e.target.closest('.product-card');
                if (productCard) {
                    const productId = productCard.dataset.productId;
                    _addToQuote(productId, 1);
                }
            }
            
            // Handle add to quote from detail modal
            if (e.target.id === 'detail-add-to-quote') {
                const productId = e.target.dataset.productId;
                const quantity = parseInt(document.getElementById('detail-product-qty').value, 10);
                _addToQuote(productId, quantity);
                document.getElementById('product-detail-modal').style.display = 'none';
            }
            
            // Handle quantity adjustments in quote
            if (e.target.classList.contains('increase-qty')) {
                const item = e.target.closest('.quote-item');
                if (item) {
                    const productId = item.dataset.productId;
                    const qtyInput = item.querySelector('.item-qty');
                    qtyInput.value = parseInt(qtyInput.value, 10) + 1;
                    _updateItemQuantity(productId, parseInt(qtyInput.value, 10));
                }
            }
            
            if (e.target.classList.contains('decrease-qty')) {
                const item = e.target.closest('.quote-item');
                if (item) {
                    const productId = item.dataset.productId;
                    const qtyInput = item.querySelector('.item-qty');
                    const newQty = Math.max(1, parseInt(qtyInput.value, 10) - 1);
                    qtyInput.value = newQty;
                    _updateItemQuantity(productId, newQty);
                }
            }
            
            // Handle quantity input changes
            if (e.target.classList.contains('item-qty')) {
                e.target.addEventListener('change', () => {
                    const item = e.target.closest('.quote-item');
                    if (item) {
                        const productId = item.dataset.productId;
                        const qty = Math.max(1, parseInt(e.target.value, 10));
                        e.target.value = qty; // Ensure value is at least 1
                        _updateItemQuantity(productId, qty);
                    }
                });
            }
            
            // Handle assign locations button
            if (e.target.classList.contains('assign-locations-btn') || 
                e.target.closest('.assign-locations-btn')) {
                const item = e.target.closest('.quote-item');
                if (item) {
                    const productId = item.dataset.productId;
                    _openLocationModal(productId);
                }
            }
            
            // Handle remove item button
            if (e.target.classList.contains('remove-item-btn') || 
                e.target.closest('.remove-item-btn')) {
                const item = e.target.closest('.quote-item');
                if (item) {
                    const productId = item.dataset.productId;
                    _removeFromQuote(productId);
                }
            }
        });
    };

    const _loadFromStorage = () => {
        try {
            const storedItems = localStorage.getItem(STORAGE_KEYS.QUOTE_ITEMS);
            const storedAssignments = localStorage.getItem(STORAGE_KEYS.LOCATION_ASSIGNMENTS);
            const storedLocations = localStorage.getItem(STORAGE_KEYS.CUSTOM_LOCATIONS);
            
            if (storedItems) {
                _quoteItems = JSON.parse(storedItems);
            }
            
            if (storedAssignments) {
                _locationAssignments = JSON.parse(storedAssignments);
            }
            
            if (storedLocations) {
                _customLocations = JSON.parse(storedLocations);
            } else {
                // Initialize with a default location if none exist
                _customLocations = [{
                    id: 'location_' + Date.now(),
                    name: 'My Primary Location',
                    address: 'Enter your location address'
                }];
                _saveCustomLocationsToStorage();
            }
        } catch (error) {
            console.error('Error loading quote from storage:', error);
            _quoteItems = [];
            _locationAssignments = {};
            _customLocations = [{
                id: 'location_' + Date.now(),
                name: 'My Primary Location',
                address: 'Enter your location address'
            }];
            _saveCustomLocationsToStorage();
        }
    };

    const _saveToStorage = () => {
        try {
            localStorage.setItem(STORAGE_KEYS.QUOTE_ITEMS, JSON.stringify(_quoteItems));
            localStorage.setItem(STORAGE_KEYS.LOCATION_ASSIGNMENTS, JSON.stringify(_locationAssignments));
        } catch (error) {
            console.error('Error saving quote to storage:', error);
        }
    };
    
    const _saveCustomLocationsToStorage = () => {
        try {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_LOCATIONS, JSON.stringify(_customLocations));
        } catch (error) {
            console.error('Error saving custom locations to storage:', error);
        }
    };

    const _openQuoteModal = () => {
        _renderQuoteItems();
        _elements.quoteModal.style.display = 'block';
    };

    const _closeQuoteModal = () => {
        _elements.quoteModal.style.display = 'none';
    };

    const _renderQuoteItems = () => {
        if (_quoteItems.length === 0) {
            _elements.quoteItems.innerHTML = '<p class="empty-quote">Your quote is empty. Add products to build your quote.</p>';
            return;
        }

        _elements.quoteItems.innerHTML = '';
        
        // Get quote item template
        const template = document.getElementById('quote-item-template');
        
        // Render each quote item
        _quoteItems.forEach(item => {
            const product = DataModule.getProductById(item.productId);
            if (!product) return;
            
            const clone = document.importNode(template.content, true);
            const quoteItem = clone.querySelector('.quote-item');
            
            // Set product ID
            quoteItem.dataset.productId = product.id;
            
            // Set image
            const img = clone.querySelector('.quote-item-image img');
            img.src = `images/products/${product.images[0]}`;
            img.alt = product.name;
            
            // Set info
            clone.querySelector('.quote-item-name').textContent = product.name;
            clone.querySelector('.quote-item-id').textContent = product.id;
            clone.querySelector('.quote-item-price').textContent = DataModule.formatPrice(product.price);
            
            // Set quantity
            clone.querySelector('.item-qty').value = item.quantity;
            
            // Set total
            clone.querySelector('.quote-item-total').textContent = DataModule.formatPrice(product.price * item.quantity);
            
            // Set status with enhanced inventory information
            const statusEl = clone.querySelector('.quote-item-status');
            if (product.inStock && product.locations.length > 0) {
                const totalQuantity = product.locations.reduce((sum, loc) => sum + loc.quantity, 0);
                statusEl.textContent = `In Stock (${totalQuantity} units)`;
                statusEl.classList.add('status-in-stock');
                
                // Add location tooltip if there are multiple locations
                if (product.locations.length > 1) {
                    statusEl.title = product.locations.map(loc => 
                        `${loc.name}: ${loc.quantity} units`
                    ).join('\n');
                    statusEl.style.cursor = 'help';
                }
            } else {
                const buildTime = product.buildTime > 0 
                    ? ` (${product.buildTime} day build)` 
                    : '';
                statusEl.textContent = `Built to Order${buildTime}`;
                statusEl.classList.add('status-built-to-order');
            }
            
            // Add location assignments info if any exists
            if (_locationAssignments[product.id]) {
                const hasAssignments = Object.keys(_locationAssignments[product.id]).length > 0;
                const totalAssigned = hasAssignments ? 
                    Object.values(_locationAssignments[product.id]).reduce((sum, qty) => sum + parseInt(qty, 10), 0) : 0;
                
                if (totalAssigned > 0) {
                    const locationInfoEl = document.createElement('div');
                    locationInfoEl.className = 'quote-item-locations';
                    locationInfoEl.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${totalAssigned} units assigned to ${Object.keys(_locationAssignments[product.id]).length} location(s)`;
                    
                    clone.querySelector('.quote-item-info').appendChild(locationInfoEl);
                }
            }
            
            // Append to container
            _elements.quoteItems.appendChild(clone);
        });
        
        // Update summary
        _updateQuoteSummary();
    };

    const _addToQuote = (productId, quantity = 1) => {
        const product = DataModule.getProductById(productId);
        if (!product) return;
        
        // Check if product is already in quote
        const existingItem = _quoteItems.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            _quoteItems.push({
                productId,
                quantity
            });
        }
        
        _saveToStorage();
        _updateQuoteCount();
        
        // Show notification
        _showNotification(`${product.name} added to quote`);
    };

    const _removeFromQuote = (productId) => {
        _quoteItems = _quoteItems.filter(item => item.productId !== productId);
        
        // Remove location assignments for this product
        if (_locationAssignments[productId]) {
            delete _locationAssignments[productId];
        }
        
        _saveToStorage();
        _renderQuoteItems();
        _updateQuoteCount();
    };

    const _updateItemQuantity = (productId, quantity) => {
        const item = _quoteItems.find(item => item.productId === productId);
        if (item) {
            item.quantity = quantity;
            _saveToStorage();
            _updateQuoteSummary();
            
            // Update item total
            const quoteItem = document.querySelector(`.quote-item[data-product-id="${productId}"]`);
            if (quoteItem) {
                const product = DataModule.getProductById(productId);
                const totalEl = quoteItem.querySelector('.quote-item-total');
                totalEl.textContent = DataModule.formatPrice(product.price * quantity);
            }
            
            // If quantity changed, check if we need to update location assignments
            if (_locationAssignments[productId]) {
                const totalAssigned = Object.values(_locationAssignments[productId])
                    .reduce((sum, qty) => sum + parseInt(qty, 10), 0);
                
                // If assigned quantity doesn't match new quantity, show warning
                if (totalAssigned !== quantity) {
                    _showNotification(`Please update location assignments for ${product.name}. Current assignments (${totalAssigned}) don't match the new quantity (${quantity}).`, 'warning');
                }
            }
        }
    };

    const _updateQuoteCount = () => {
        const count = _quoteItems.reduce((sum, item) => sum + item.quantity, 0);
        _elements.quoteCount.textContent = count;
        
        // Show or hide count badge based on items
        if (count > 0) {
            _elements.quoteCount.style.display = 'inline-block';
        } else {
            _elements.quoteCount.style.display = 'none';
        }
    };

    const _updateQuoteSummary = () => {
        let subtotal = 0;
        
        _quoteItems.forEach(item => {
            const product = DataModule.getProductById(item.productId);
            if (product) {
                subtotal += product.price * item.quantity;
            }
        });
        
        const tax = subtotal * 0.08; // 8% tax rate
        const total = subtotal + tax;
        
        _elements.quoteSubtotal.textContent = DataModule.formatPrice(subtotal);
        _elements.quoteTax.textContent = DataModule.formatPrice(tax);
        _elements.quoteTotal.textContent = DataModule.formatPrice(total);
    };

    const _addNewLocation = () => {
        const newLocation = {
            id: 'location_' + Date.now(),
            name: '',
            address: '',
            isNew: true,
            isEditing: true
        };
        
        _customLocations.push(newLocation);
        _renderCustomLocations();
        
        // Scroll to the new location
        setTimeout(() => {
            const container = document.getElementById('custom-locations-container');
            container.scrollTop = container.scrollHeight;
        }, 100);
    };
    
    const _renderCustomLocations = () => {
        const container = document.getElementById('custom-locations-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Get template
        const template = document.getElementById('custom-location-template');
        
        // Render each custom location
        _customLocations.forEach(location => {
            const clone = document.importNode(template.content, true);
            const locationEl = clone.querySelector('.custom-location');
            
            // Set location ID
            locationEl.dataset.locationId = location.id;
            
            // Set inputs
            const nameInput = clone.querySelector('.location-name-input');
            const addressInput = clone.querySelector('.location-address-input');
            
            nameInput.value = location.name;
            addressInput.value = location.address;
            
            // Set to edit mode if new
            if (location.isEditing) {
                locationEl.classList.add('editing');
                nameInput.readOnly = false;
                addressInput.readOnly = false;
            } else {
                nameInput.readOnly = true;
                addressInput.readOnly = true;
            }
            
            // Handle save button
            const saveBtn = clone.querySelector('.save-location-btn');
            saveBtn.addEventListener('click', () => {
                const updatedLocation = _customLocations.find(loc => loc.id === location.id);
                if (updatedLocation) {
                    updatedLocation.name = nameInput.value.trim();
                    updatedLocation.address = addressInput.value.trim();
                    updatedLocation.isEditing = false;
                    delete updatedLocation.isNew;
                    
                    _saveCustomLocationsToStorage();
                    _renderCustomLocations();
                    _renderLocationAssignments();
                }
            });
            
            // Handle edit button
            const editBtn = clone.querySelector('.edit-location-btn');
            editBtn.addEventListener('click', () => {
                const locationToEdit = _customLocations.find(loc => loc.id === location.id);
                if (locationToEdit) {
                    locationToEdit.isEditing = true;
                    _renderCustomLocations();
                }
            });
            
            // Handle delete button
            const deleteBtn = clone.querySelector('.delete-location-btn');
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this location? Any assignments to this location will be removed.')) {
                    // Remove location from custom locations
                    _customLocations = _customLocations.filter(loc => loc.id !== location.id);
                    
                    // Remove any assignments to this location
                    Object.keys(_locationAssignments).forEach(productId => {
                        if (_locationAssignments[productId][location.id]) {
                            delete _locationAssignments[productId][location.id];
                        }
                    });
                    
                    _saveCustomLocationsToStorage();
                    _saveToStorage();
                    _renderCustomLocations();
                    _renderLocationAssignments();
                }
            });
            
            // Hide save button if not editing
            if (!location.isEditing) {
                saveBtn.style.display = 'none';
            } else {
                editBtn.style.display = 'none';
            }
            
            // Append to container
            container.appendChild(clone);
        });
    };
    
    const _renderLocationAssignments = () => {
        const productId = _elements.saveLocationsBtn.dataset.productId;
        if (!productId) return;
        
        const quoteItem = _quoteItems.find(item => item.productId === productId);
        if (!quoteItem) return;
        
        // Clear assignments container
        _elements.locationAssignments.innerHTML = '';
        
        // Get location assignment template
        const template = document.getElementById('location-assignment-template');
        
        // Get current assignments for this product
        const currentAssignments = _locationAssignments[productId] || {};
        
        // Calculate total assigned
        let totalAssigned = 0;
        Object.values(currentAssignments).forEach(qty => {
            totalAssigned += parseInt(qty, 10) || 0;
        });
        
        // Update assignment status
        _updateAssignmentStatus(totalAssigned, quoteItem.quantity);
        
        // Render each custom location
        _customLocations.forEach(location => {
            // Skip locations in editing mode or with empty names
            if (location.isEditing || !location.name.trim()) return;
            
            const clone = document.importNode(template.content, true);
            
            // Set location info
            clone.querySelector('.location-name').textContent = location.name;
            clone.querySelector('.location-address').textContent = location.address;
            
            // Set quantity
            const qtyInput = clone.querySelector('.location-qty');
            qtyInput.value = currentAssignments[location.id] || 0;
            qtyInput.dataset.locationId = location.id;
            
            // Add event listener to update assignment status in real-time
            qtyInput.addEventListener('input', () => {
                let newTotalAssigned = 0;
                const allInputs = _elements.locationAssignments.querySelectorAll('.location-qty');
                allInputs.forEach(input => {
                    newTotalAssigned += parseInt(input.value, 10) || 0;
                });
                _updateAssignmentStatus(newTotalAssigned, quoteItem.quantity);
            });
            
            // Append to container
            _elements.locationAssignments.appendChild(clone);
        });
    };

    const _openLocationModal = (productId) => {
        const product = DataModule.getProductById(productId);
        if (!product) return;
        
        const quoteItem = _quoteItems.find(item => item.productId === productId);
        if (!quoteItem) return;
        
        // Render product info
        _elements.locationProductInfo.innerHTML = `
            <div class="location-product-image">
                <img src="images/products/${product.images[0]}" alt="${product.name}">
            </div>
            <div class="location-product-details">
                <h3>${product.name}</h3>
                <p class="location-product-id">${product.id}</p>
                <p class="location-product-quantity">Total Quantity: ${quoteItem.quantity}</p>
                <div class="location-assignment-status">
                    <p class="assigned-count">0 of ${quoteItem.quantity} items assigned</p>
                    <div class="assignment-progress">
                        <div class="progress-bar" style="width: 0%"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Set data attribute for save button
        _elements.saveLocationsBtn.dataset.productId = productId;
        
        // Render custom locations
        _renderCustomLocations();
        
        // Render location assignments
        _renderLocationAssignments();
        
        // Show modal
        _elements.locationModal.style.display = 'block';
    };

    const _saveLocationAssignments = () => {
        const productId = _elements.saveLocationsBtn.dataset.productId;
        if (!productId) return;
        
        const quoteItem = _quoteItems.find(item => item.productId === productId);
        if (!quoteItem) return;
        
        // Get all location quantity inputs
        const qtyInputs = _elements.locationAssignments.querySelectorAll('.location-qty');
        
        // Create new assignments object
        const newAssignments = {};
        let totalAssigned = 0;
        
        // Gather assignments
        qtyInputs.forEach(input => {
            const locationId = input.dataset.locationId;
            const qty = parseInt(input.value, 10) || 0;
            
            if (qty > 0) {
                newAssignments[locationId] = qty;
                totalAssigned += qty;
            }
        });
        
        // Validate total assigned matches item quantity
        if (totalAssigned !== quoteItem.quantity) {
            alert(`Please assign all ${quoteItem.quantity} items to locations. Currently assigned: ${totalAssigned}`);
            return;
        }
        
        // Save assignments
        _locationAssignments[productId] = newAssignments;
        _saveToStorage();
        
        // Close modal
        _elements.locationModal.style.display = 'none';
        
        // Show notification
        _showNotification('Location assignments saved');
        
        // Update quote display to show location assignments
        _renderQuoteItems();
    };

    const _updateAssignmentStatus = (assigned, total) => {
        // Update the assigned count text
        const assignedCountEl = document.querySelector('.assigned-count');
        if (assignedCountEl) {
            assignedCountEl.textContent = `${assigned} of ${total} items assigned`;
        }
        
        // Update the progress bar
        const progressBarEl = document.querySelector('.progress-bar');
        if (progressBarEl) {
            const percentage = total > 0 ? (assigned / total) * 100 : 0;
            progressBarEl.style.width = `${percentage}%`;
            
            // Update color based on completion
            if (assigned === total) {
                progressBarEl.style.backgroundColor = '#28a745'; // Green for complete
            } else if (assigned > total) {
                progressBarEl.style.backgroundColor = '#dc3545'; // Red for over-assigned
            } else if (assigned > 0) {
                progressBarEl.style.backgroundColor = '#ffc107'; // Yellow for in-progress
            } else {
                progressBarEl.style.backgroundColor = '#6c757d'; // Gray for not started
            }
        }
        
        // Update save button state
        if (assigned === total) {
            _elements.saveLocationsBtn.classList.add('ready');
        } else {
            _elements.saveLocationsBtn.classList.remove('ready');
        }
    };

    const _handleRequestQuote = () => {
        if (_quoteItems.length === 0) {
            alert('Your quote is empty. Please add products to request a quote.');
            return;
        }
        
        // Validate all items have location assignments if quantity > 1
        let allAssigned = true;
        let firstUnassignedProductName = '';
        
        for (const item of _quoteItems) {
            if (item.quantity > 1) {
                const productAssignments = _locationAssignments[item.productId];
                if (!productAssignments) {
                    allAssigned = false;
                    const product = DataModule.getProductById(item.productId);
                    firstUnassignedProductName = product.name;
                    break;
                }
                
                const totalAssigned = Object.values(productAssignments).reduce((sum, qty) => sum + parseInt(qty, 10), 0);
                if (totalAssigned !== item.quantity) {
                    allAssigned = false;
                    const product = DataModule.getProductById(item.productId);
                    firstUnassignedProductName = product.name;
                    break;
                }
            }
        }
        
        if (!allAssigned) {
            alert(`Please assign locations for all items. Product "${firstUnassignedProductName}" needs location assignments.`);
            return;
        }
        
        // Prepare quote data
        const quoteData = {
            items: _quoteItems.map(item => {
                const product = DataModule.getProductById(item.productId);
                return {
                    productId: item.productId,
                    name: product.name,
                    price: product.price,
                    quantity: item.quantity,
                    subtotal: product.price * item.quantity,
                    locations: _locationAssignments[item.productId] || {},
                    inStock: product.inStock,
                    buildTime: product.buildTime
                };
            }),
            summary: {
                subtotal: parseFloat(_elements.quoteSubtotal.textContent.replace(/[^0-9.-]+/g, '')),
                tax: parseFloat(_elements.quoteTax.textContent.replace(/[^0-9.-]+/g, '')),
                total: parseFloat(_elements.quoteTotal.textContent.replace(/[^0-9.-]+/g, ''))
            },
            customLocations: _customLocations,
            date: new Date().toISOString()
        };
        
        console.log('Quote requested:', quoteData);
        
        // In a real application, we would send this to the server
        alert('Your quote request has been submitted! A sales representative will contact you shortly.');
        
        // Clear quote
        _quoteItems = [];
        _locationAssignments = {};
        _saveToStorage();
        _renderQuoteItems();
        _updateQuoteCount();
        
        // Close modal
        _closeQuoteModal();
    };

    const _showNotification = (message, type = 'success') => {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
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
        getQuoteItems: () => [..._quoteItems],
        addToQuote: _addToQuote,
        removeFromQuote: _removeFromQuote,
        updateItemQuantity: _updateItemQuantity,
        openQuoteModal: _openQuoteModal,
        getLocationAssignments: () => ({..._locationAssignments})
    };
})();

// Initialize after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize after data is loaded
    DataModule.loadData().then(() => {
        QuoteBuilder.init();
    });
});

// Export for use in other modules
window.QuoteBuilder = QuoteBuilder;
