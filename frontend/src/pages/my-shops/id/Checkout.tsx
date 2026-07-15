import React, { useState, useEffect } from 'react';
import { Modal } from "~/components";
import { useParams } from 'react-router-dom';
import { useQuery, useLazyQuery, useMutation } from '@apollo/client/react';
import { SEARCH_SHOP_PRODUCTS_QUERY, DECREMENT_STOCK_MUTATION } from '~/api/graphql';
import { Check, X, ChevronLeft, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { ProductScannerCamera } from '../components';

interface CartItem {
    id: string;
    itemName: string;
    sellingPrice: number;
    stockQuantity: number;
    quantity: number;
    unitOfMeasure?: string;
}

interface Product {
    id: string;
    shopId: string;
    itemName: string;
    description?: string;
    category?: string;
    unitOfMeasure?: string;
    photo?: string;
    sellingPrice: number;
    stockQuantity: number;
}

// ScannerTab Component
function ScannerTab({ shopId, onAddToCart }: {
    shopId: string | undefined,
    onAddToCart: (product: Product, quantity: number) => void
}) {
    const [scannerStep, setScannerStep] = useState<'camera' | 'search'>('camera');
    const [scannedProductName, setScannedProductName] = useState('');
    const [scannedResults, setScannedResults] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);


    const [searchScannedProduct, { loading: searchLoading }] = useLazyQuery(SEARCH_SHOP_PRODUCTS_QUERY);

    // Handle scanner capture
    const handleScannerCapture = async (file: File, previewUrl: string, matchedName: string, unitOfMeasure: string) => {
        setScannedProductName(matchedName);

        // Search for the scanned product
        if (shopId) {
            setIsSearching(true);
            await searchScannedProduct({
                variables: {
                    shopId,
                    query: matchedName,
                    limit: 10,
                    offset: 0
                }
            }).then((data) => {
                setIsSearching(false);
                if (data?.searchShopProducts?.products) {
                    setScannedResults(data.searchShopProducts.products);
                    setScannerStep('search');
                    setShowDropdown(true);
                }
            });
        }
    };

    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product);
        setShowDropdown(false);
        setQuantity(1); // Reset quantity when selecting new product
    };

    const handleAddToCart = () => {
        if (!selectedProduct) return;
        onAddToCart(selectedProduct, quantity);
        setSelectedProduct(null);
        setScannedProductName('');
        setQuantity(1);
        setScannedResults([]);
        setScannerStep('camera');
    };

    const handleGoBackToCamera = () => {
        setScannerStep('camera');
        setScannedProductName('');
        setScannedResults([]);
        setSelectedProduct(null);
        setShowDropdown(false);
    };

    return (
        <div className="flex flex-col flex-1 h-full w-full bg-bg-secondary min-h-0">
            {scannerStep === 'camera' && (
                <div className="flex flex-col relative isolate flex-1 w-auto mx-2 rounded-[20px] my-2 overflow-hidden bg-bg-secondary">
                    <ProductScannerCamera onCaptureComplete={handleScannerCapture} />
                </div>
            )}

            {scannerStep === 'search' && (
                <div className="flex flex-col gap-4 p-5 w-full bg-bg-primary h-full overflow-auto">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-text-sub">
                            Scanned: "{scannedProductName}"
                        </h3>
                        <button
                            onClick={handleGoBackToCamera}
                            className="px-3 py-1.5 text-xs bg-bg-secondary border border-border-main text-text-sub rounded-lg hover:bg-item-hover transition-colors"
                        >
                            ← Scan Again
                        </button>
                    </div>

                    {/* Search Input with Dropdown */}
                    <div className="relative">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={selectedProduct?.itemName || scannedProductName}
                                onFocus={() => setShowDropdown(scannedResults.length > 0)}
                                readOnly
                                placeholder="Click to select product..."
                                onClick={() => setShowDropdown(scannedResults.length > 0 && !selectedProduct)}
                                className="flex-1 px-4 py-3 border border-border-main rounded-lg text-text-main bg-bg-primary opacity-70 cursor-pointer"
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-gold"></div>
                                </div>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {showDropdown && scannedResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-bg-secondary border border-border-main rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                {scannedResults.map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => handleSelectProduct(product)}
                                        className="w-full text-left px-4 py-3 hover:bg-item-hover transition-colors border-b border-border-main last:border-b-0"
                                    >
                                        <div className="font-medium text-text-main">{product.itemName}</div>
                                        {product.category && (
                                            <div className="text-xs text-text-sub mt-1">{product.category}</div>
                                        )}
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-sm font-semibold text-brand-gold">
                                                ₱{product.sellingPrice.toFixed(2)}
                                            </span>
                                            <span className="text-xs text-text-sub">
                                                Stock: {product.stockQuantity}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {isSearching && (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
                            <span className="ml-3 text-text-sub">Searching for "{scannedProductName}"...</span>
                        </div>
                    )}

                    {/* Selected Product Details */}
                    {selectedProduct && (
                        <div className="border border-border-main rounded-lg p-4 bg-bg-secondary">
                            <h3 className="font-bold text-text-main mb-3">Selected Product</h3>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Selling Price (readonly) */}
                                <div>
                                    <label className="block text-xs font-semibold text-text-sub mb-1">Selling Price</label>
                                    <input
                                        type="text"
                                        value={`₱${selectedProduct.sellingPrice.toFixed(2)}`}
                                        readOnly
                                        className="w-full px-3 py-2 border border-border-main rounded-lg text-text-main bg-bg-primary opacity-70"
                                    />
                                </div>

                                {/* Stock Quantity (readonly) */}
                                <div>
                                    <label className="block text-xs font-semibold text-text-sub mb-1">Available Stock</label>
                                    <input
                                        type="text"
                                        value={selectedProduct.stockQuantity}
                                        readOnly
                                        className="w-full px-3 py-2 border border-border-main rounded-lg text-text-main bg-bg-primary opacity-70"
                                    />
                                </div>

                                {/* Unit of Measure (readonly if available) */}
                                <div>
                                    <label className="block text-xs font-semibold text-text-sub mb-1">Unit of Measure</label>
                                    <input
                                        type="text"
                                        value={selectedProduct.unitOfMeasure || 'Not specified'}
                                        readOnly
                                        className="w-full px-3 py-2 border border-border-main rounded-lg text-text-main bg-bg-primary opacity-70"
                                    />
                                </div>

                                {/* Quantity Input */}
                                <div>
                                    <label className="block text-xs font-semibold text-text-sub mb-1">Quantity to Buy</label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value) || 0;
                                            setQuantity(Math.max(1, Math.min(selectedProduct.stockQuantity, value)));
                                        }}
                                        min="1"
                                        max={selectedProduct.stockQuantity}
                                        className="w-full px-3 py-2 border border-border-main rounded-lg text-text-main bg-bg-primary focus:outline-none focus:border-brand-gold"
                                    />
                                    <div className="text-xs text-text-sub mt-1">
                                        Max: {selectedProduct.stockQuantity}
                                    </div>
                                </div>

                                {/* Subtotal */}
                                <div>
                                    <label className="block text-xs font-semibold text-text-sub mb-1">Subtotal</label>
                                    <input
                                        type="text"
                                        value={`₱${(selectedProduct.sellingPrice * quantity).toFixed(2)}`}
                                        readOnly
                                        className="w-full px-3 py-2 border border-border-main rounded-lg text-brand-gold font-bold bg-bg-primary opacity-70"
                                    />
                                </div>
                            </div>

                            {/* Add to Cart Button */}
                            <button
                                onClick={handleAddToCart}
                                className="w-full mt-4 py-3 bg-brand-gold hover:bg-brand-gold-hover text-white font-semibold rounded-lg transition-colors"
                            >
                                Add to Cart
                            </button>
                        </div>
                    )}

                    {/* No Results */}
                    {!selectedProduct && !isSearching && scannedResults.length === 0 && (
                        <div className="text-center py-8 text-text-sub">
                            <p>No products found matching "{scannedProductName}"</p>
                            <p className="text-sm mt-2">Try scanning again or manually search</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Checkout({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'manual' | 'scanner' | 'checkout'>('manual');
    const { id: shopId } = useParams<{ id: string }>();

    // Cart state
    const [cart, setCart] = useState<CartItem[]>([]);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Checkout mutation
    const [decrementStock] = useMutation(DECREMENT_STOCK_MUTATION);

    // Add item to cart
    const addToCart = (product: Product, quantity: number) => {
        if (quantity <= 0 || quantity > product.stockQuantity) {
            openModal({
                isSuccess: false,
                message: 'Invalid quantity',
                error: `Quantity must be between 1 and ${product.stockQuantity}`
            });
            return;
        }

        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > product.stockQuantity) {
                openModal({
                    isSuccess: false,
                    message: 'Not enough stock',
                    error: `Only ${product.stockQuantity} items available`
                });
                return;
            }

            setCart(cart.map(item =>
                item.id === product.id
                    ? { ...item, quantity: newQuantity }
                    : item
            ));
        } else {
            setCart([...cart, {
                id: product.id,
                itemName: product.itemName,
                sellingPrice: product.sellingPrice,
                stockQuantity: product.stockQuantity,
                quantity,
                unitOfMeasure: product.unitOfMeasure
            }]);
        }

        openModal({ isSuccess: true, message: 'Item added to cart' });
    };

    // Remove item from cart
    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    // Calculate total
    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (item.sellingPrice * item.quantity), 0);
    };

    // Handle checkout/payment
    const handleCheckout = async () => {
        if (cart.length === 0) {
            openModal({ isSuccess: false, message: 'Cart is empty', error: 'Please add items to cart first' });
            return;
        }

        try {
            // Decrement stock for each item
            for (const item of cart) {
                await decrementStock({
                    variables: {
                        input: {
                            itemId: item.id,
                            quantityToRemove: item.quantity
                        }
                    }
                });
            }

            openModal({ isSuccess: true, message: 'Checkout successful! Stock updated.' });

            // Clear cart after successful checkout
            setCart([]);

            // Switch to checkout tab to show success
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err: any) {
            console.error("Checkout failed:", err);
            openModal({ isSuccess: false, message: 'Checkout failed', error: err.message });
        }
    };

    const openModal = ({ isSuccess, message, error }: { isSuccess: boolean, message: string, error?: string }) => {
        setIsModalOpen(true);
        setIsSuccess(isSuccess);
        setModalMessage(message);
        setErrorMessage(error || '');
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setIsSuccess(false);
        setModalMessage('');
        setErrorMessage('');
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                isFullScreenModal
                title='Checkout'
                subtitle=''
                customHeader={
                    <div className="flex items-center px-2 py-6">
                        <button
                            onClick={onClose}
                            className="p-1.5 text-text-sub hover:text-text-main hover:bg-item-hover z-1 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                            <ChevronLeft size={18} strokeWidth={2.5} />
                        </button>
                        <div className="flex-1 flex min-w-0 pr-4 -ml-4 text-center self-center justify-center">
                            <h2 className="text-lg font-bold text-text-main leading-tight truncate">
                                {activeTab === 'manual' ? 'Search Product' : activeTab === 'scanner' ? 'Scan Product' : 'Checkout'}
                            </h2>
                        </div>
                        <div className="relative">
                            <ShoppingCart size={20} className="text-text-sub" />
                            {cart.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-brand-gold text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                                    {cart.length}
                                </span>
                            )}
                        </div>
                    </div>
                }
            >
                <div className="flex flex-col w-full bg-bg-primary flex-1 h-full">
                    {/* Tab Headers */}
                    <div className='mx-4'>
                        <div className="flex bg-bg-primary my-2 rounded-full w-full max-w-xl border border-border-main">
                            <button
                                type="button"
                                onClick={() => setActiveTab('manual')}
                                className={`flex-1 flex flex-row gap-2 items-center justify-center py-2.5 px-4 text-sm font-semibold transition-all duration-200 rounded-full cursor-pointer ${activeTab === 'manual'
                                    ? 'bg-brand-gold text-text-white shadow-sm'
                                    : 'text-text-sub hover:text-text-main'
                                    }`}
                            >
                                Manual Input
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('scanner')}
                                className={`flex-1 flex flex-row gap-2 items-center justify-center py-2.5 px-4 text-sm font-semibold transition-all duration-200 rounded-full cursor-pointer ${activeTab === 'scanner'
                                    ? 'bg-brand-gold text-text-white shadow-sm'
                                    : 'text-text-sub hover:text-text-main'
                                    }`}
                            >
                                AI Scanner
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('checkout')}
                                className={`flex-1 flex flex-row gap-2 items-center justify-center py-2.5 px-4 text-sm font-semibold transition-all duration-200 rounded-full cursor-pointer ${activeTab === 'checkout'
                                    ? 'bg-brand-gold text-text-white shadow-sm'
                                    : 'text-text-sub hover:text-text-main'
                                    }`}
                            >
                                Checkout ({cart.length})
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="w-full bg-bg-primary h-full flex-1 flex overflow-auto">
                        {/* MANUAL SEARCH TAB */}
                        {activeTab === 'manual' && (
                            <ManualSearchTab
                                shopId={shopId}
                                onAddToCart={addToCart}
                            />
                        )}

                        {/* AI SCANNER TAB */}
                        {activeTab === 'scanner' && (
                            <ScannerTab
                                shopId={shopId}
                                onAddToCart={addToCart}
                            />
                        )}

                        {/* CHECKOUT TAB */}
                        {activeTab === 'checkout' && (
                            <div className="flex flex-col gap-4 p-5 w-full h-full">
                                {cart.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center text-text-sub">
                                        <div className="text-center">
                                            <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                                            <p>Your cart is empty</p>
                                            <p className="text-sm mt-2">Add items using Manual Input or AI Scanner</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 flex flex-col gap-3 overflow-auto">
                                            <h3 className="text-sm font-semibold text-text-sub">Cart Items</h3>
                                            {cart.map((item) => (
                                                <div key={item.id} className="border border-border-main rounded-lg p-4 bg-bg-secondary">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="font-semibold text-text-main">{item.itemName}</h4>
                                                            {item.unitOfMeasure && (
                                                                <p className="text-xs text-text-sub">{item.unitOfMeasure}</p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="p-1.5 hover:bg-item-hover rounded-lg text-text-sub hover:text-brand-red transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <div className="text-sm">
                                                            <span className="text-text-sub mr-2">Quantity:</span>
                                                            <span className="font-semibold">{item.quantity}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-brand-gold font-bold">
                                                                ₱{(item.sellingPrice * item.quantity).toFixed(2)}
                                                            </div>
                                                            <div className="text-xs text-text-sub">
                                                                ₱{item.sellingPrice.toFixed(2)} each
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Total and Checkout Button */}
                                        <div className="border-t border-border-main pt-4 mt-auto">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-lg font-bold text-text-main">Total:</span>
                                                <span className="text-2xl font-bold text-brand-gold">
                                                    ₱{calculateTotal().toFixed(2)}
                                                </span>
                                            </div>
                                            <button
                                                onClick={handleCheckout}
                                                className="w-full py-3 bg-brand-gold hover:bg-brand-gold-hover text-white font-semibold rounded-lg transition-colors"
                                            >
                                                Proceed to Payment
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Success/Error Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title={isSuccess ? "" : "Error"}
                subtitle=""
                isMobileVariant={false}
                maxWidth="max-w-[340px]"
                isFullScreenModal={false}
                isHeaderVisible={false}
                unsetHeight
            >
                <div className="flex flex-col items-center justify-center p-6 min-h-[200px]">
                    <div>
                        {isSuccess ? (
                            <Check className="w-8 h-8 text-brand-gold" />
                        ) : (
                            <X className="w-8 h-8 text-brand-red" />
                        )}
                    </div>
                    <p className="mt-2 text-lg font-bold text-text-main">{modalMessage}</p>
                    {errorMessage && (
                        <p className="mt-2 text-sm text-text-sub">{errorMessage}</p>
                    )}
                    <button
                        onClick={handleModalClose}
                        className='mt-6 p-2 px-4 bg-brand-gold hover:bg-brand-gold-hover cursor-pointer text-text-white rounded-lg transition-colors'
                    >
                        OK
                    </button>
                </div>
            </Modal>
        </>
    );
}

// ManualSearchTab Component
function ManualSearchTab({ shopId, onAddToCart }: {
    shopId: string | undefined,
    onAddToCart: (product: Product, quantity: number) => void
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const [searchProducts, { loading: searchLoading }] = useLazyQuery(SEARCH_SHOP_PRODUCTS_QUERY);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.length >= 2 && shopId) {
            setIsSearching(true);
            searchProducts({
                variables: {
                    shopId,
                    query: query,
                    limit: 10,
                    offset: 0
                }
            }).then((data) => {
                setIsSearching(false);
                if (data?.searchShopProducts?.products) {
                    setSearchResults(data.searchShopProducts.products);
                    setShowDropdown(true);
                }
            });
        } else {
            setSearchResults([]);
            setShowDropdown(false);
        }
    };

    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product);
        setSearchQuery(product.itemName);
        setShowDropdown(false);
        setQuantity(1); // Reset quantity when selecting new product
    };

    const handleAddToCart = () => {
        if (!selectedProduct) return;
        onAddToCart(selectedProduct, quantity);
        setSelectedProduct(null);
        setSearchQuery('');
        setQuantity(1);
        setSearchResults([]);
    };

    return (
        <div className="flex flex-col gap-4 p-5 w-full">
            {/* Search Input with Dropdown */}
            <div className="relative">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        onFocus={() => setShowDropdown(searchResults.length > 0)}
                        placeholder="Search product by name..."
                        className="flex-1 px-4 py-3 border border-border-main rounded-lg text-text-main bg-bg-primary focus:outline-none focus:border-brand-gold"
                    />
                    {isSearching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-gold"></div>
                        </div>
                    )}
                </div>

                {/* Search Results Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-bg-secondary border border-border-main rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {searchResults.map((product) => (
                            <button
                                key={product.id}
                                onClick={() => handleSelectProduct(product)}
                                className="w-full text-left px-4 py-3 hover:bg-item-hover transition-colors border-b border-border-main last:border-b-0"
                            >
                                <div className="font-medium text-text-main">{product.itemName}</div>
                                {product.category && (
                                    <div className="text-xs text-text-sub mt-1">{product.category}</div>
                                )}
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-sm font-semibold text-brand-gold">
                                        ₱{product.sellingPrice.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-text-sub">
                                        Stock: {product.stockQuantity}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected Product Details */}
            {selectedProduct && (
                <div className="border border-border-main rounded-lg p-4 bg-bg-secondary">
                    <h3 className="font-bold text-text-main mb-3">Selected Product</h3>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Item Name (readonly) */}
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-text-sub mb-1">Item Name</label>
                            <input
                                type="text"
                                value={selectedProduct.itemName}
                                readOnly
                                className="w-full px-3 py-2 border border-border-main rounded-lg text-text-main bg-bg-primary opacity-70"
                            />
                        </div>

                        {/* Selling Price (readonly) */}
                        <div>
                            <label className="block text-xs font-semibold text-text-sub mb-1">Selling Price</label>
                            <input
                                type="text"
                                value={`₱${selectedProduct.sellingPrice.toFixed(2)}`}
                                readOnly
                                className="w-full px-3 py-2 border border-border-main rounded-lg text-text-main bg-bg-primary opacity-70"
                            />
                        </div>

                        {/* Stock Quantity (readonly) */}
                        <div>
                            <label className="block text-xs font-semibold text-text-sub mb-1">Available Stock</label>
                            <input
                                type="text"
                                value={selectedProduct.stockQuantity}
                                readOnly
                                className="w-full px-3 py-2 border border-border-main rounded-lg text-text-main bg-bg-primary opacity-70"
                            />
                        </div>

                        {/* Unit of Measure (readonly if available) */}
                        <div>
                            <label className="block text-xs font-semibold text-text-sub mb-1">Unit of Measure</label>
                            <input
                                type="text"
                                value={selectedProduct.unitOfMeasure || 'Not specified'}
                                readOnly
                                className="w-full px-3 py-2 border border-border-main rounded-lg text-text-main bg-bg-primary opacity-70"
                            />
                        </div>

                        {/* Quantity Input */}
                        <div>
                            <label className="block text-xs font-semibold text-text-sub mb-1">Quantity to Buy</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    setQuantity(Math.max(1, Math.min(selectedProduct.stockQuantity, value)));
                                }}
                                min="1"
                                max={selectedProduct.stockQuantity}
                                className="w-full px-3 py-2 border border-border-main rounded-lg text-text-main bg-bg-primary focus:outline-none focus:border-brand-gold"
                            />
                            <div className="text-xs text-text-sub mt-1">
                                Max: {selectedProduct.stockQuantity}
                            </div>
                        </div>

                        {/* Subtotal */}
                        <div>
                            <label className="block text-xs font-semibold text-text-sub mb-1">Subtotal</label>
                            <input
                                type="text"
                                value={`₱${(selectedProduct.sellingPrice * quantity).toFixed(2)}`}
                                readOnly
                                className="w-full px-3 py-2 border border-border-main rounded-lg text-brand-gold font-bold bg-bg-primary opacity-70"
                            />
                        </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                        onClick={handleAddToCart}
                        className="w-full mt-4 py-3 bg-brand-gold hover:bg-brand-gold-hover text-white font-semibold rounded-lg transition-colors"
                    >
                        Add to Cart
                    </button>
                </div>
            )}

            {/* Instructions */}
            {!selectedProduct && !isSearching && (
                <div className="text-center py-8 text-text-sub text-sm">
                    <p>Type at least 2 characters to search products</p>
                    <p className="mt-1">Select a product from dropdown to add to cart</p>
                </div>
            )}
        </div>
    );
}
