import React, { useState } from 'react';
import { StoreInfo, Product } from '../types';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import DragHandleIcon from './icons/DragHandleIcon';

interface SettingsPanelProps {
  storeInfo: StoreInfo;
  products: Product[];
  onStoreInfoChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onLogoUpload: (logo: string) => void;
  onColorChange: (color: string) => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteProducts: (productIds: string[]) => void;
  onProductReorder: (reorderedProducts: Product[]) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  storeInfo,
  products,
  onStoreInfoChange,
  onLogoUpload,
  onColorChange,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onDeleteProducts,
  onProductReorder,
}) => {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStock = 
      stockFilter === 'all' ||
      (stockFilter === 'in-stock' && product.stockQuantity > 5) ||
      (stockFilter === 'low-stock' && product.stockQuantity > 0 && product.stockQuantity <= 5) ||
      (stockFilter === 'out-of-stock' && product.stockQuantity === 0);
    
    return matchesSearch && matchesStock;
  });

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, product: Product) => {
    setDraggedItemId(product.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', product.id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetProductId: string) => {
    e.preventDefault();
    if (targetProductId !== draggedItemId && dragOverItemId !== targetProductId) {
      setDragOverItemId(targetProductId);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only clear if we're leaving the item, not entering a child
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX <= rect.left ||
      clientX >= rect.right ||
      clientY <= rect.top ||
      clientY >= rect.bottom
    ) {
      setDragOverItemId(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetProduct: Product) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetProduct.id) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    const draggedIndex = products.findIndex(p => p.id === draggedItemId);
    const targetIndex = products.findIndex(p => p.id === targetProduct.id);

    const newProducts = Array.from(products);
    const [draggedItem] = newProducts.splice(draggedIndex, 1);
    newProducts.splice(targetIndex, 0, draggedItem);

    onProductReorder(newProducts);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  const handleDeleteConfirm = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      onDeleteProduct(product.id);
      setSelectedProductIds(prev => prev.filter(id => id !== product.id));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedProductIds.length} selected products? This action cannot be undone.`)) {
      onDeleteProducts(selectedProductIds);
      setSelectedProductIds([]);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };


  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onLogoUpload(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg space-y-8 sticky top-24">
      
      {/* Store Branding Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Branding</h2>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {storeInfo.logo ? (
              <div className="relative group">
                <img src={storeInfo.logo} alt="Store Logo" className="w-16 h-16 rounded-lg object-contain border border-gray-200" />
                <button 
                  onClick={() => onLogoUpload('')}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <TrashIcon />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                <span className="text-xs text-gray-400">No Logo</span>
              </div>
            )}
          </div>
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-600 mb-1">Store Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
          </div>
        </div>
        <div>
          <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-600 mb-1">Primary Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              id="primaryColor"
              value={storeInfo.primaryColor || '#0d9488'}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border-0 p-0"
            />
            <input
              type="text"
              value={storeInfo.primaryColor || '#0d9488'}
              onChange={(e) => onColorChange(e.target.value)}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition text-sm font-mono"
            />
          </div>
        </div>
      </div>

      {/* Store Details Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Store Details</h2>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-1">Store Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={storeInfo.name}
            onChange={onStoreInfoChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            placeholder="e.g., Sana's Wellness"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-600 mb-1">Store Description</label>
          <textarea
            id="description"
            name="description"
            value={storeInfo.description}
            onChange={onStoreInfoChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            placeholder="A short, catchy description"
          />
        </div>
        <div>
          <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-600 mb-1">WhatsApp Number</label>
          <input
            type="text"
            id="whatsappNumber"
            name="whatsappNumber"
            value={storeInfo.whatsappNumber}
            onChange={onStoreInfoChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            placeholder="Include country code (e.g., 1234567890)"
          />
        </div>
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-600 mb-1">Currency Symbol</label>
          <input
            type="text"
            id="currency"
            name="currency"
            value={storeInfo.currency}
            onChange={onStoreInfoChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            placeholder="e.g., USD, €, ₹"
          />
        </div>
      </div>

      {/* Social Media Links Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Social Media</h2>
        <div>
          <label htmlFor="facebook" className="block text-sm font-medium text-gray-600 mb-1">Facebook URL</label>
          <input
            type="url"
            id="facebook"
            name="facebook"
            value={storeInfo.facebook || ''}
            onChange={onStoreInfoChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            placeholder="https://facebook.com/yourpage"
          />
        </div>
        <div>
          <label htmlFor="instagram" className="block text-sm font-medium text-gray-600 mb-1">Instagram URL</label>
          <input
            type="url"
            id="instagram"
            name="instagram"
            value={storeInfo.instagram || ''}
            onChange={onStoreInfoChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            placeholder="https://instagram.com/yourprofile"
          />
        </div>
        <div>
          <label htmlFor="twitter" className="block text-sm font-medium text-gray-600 mb-1">Twitter URL</label>
          <input
            type="url"
            id="twitter"
            name="twitter"
            value={storeInfo.twitter || ''}
            onChange={onStoreInfoChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            placeholder="https://twitter.com/yourhandle"
          />
        </div>
      </div>

      {/* Products Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="text-xl font-semibold text-gray-700">Products</h2>
          <div className="flex gap-2">
            {selectedProductIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 bg-red-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon />
                Delete Selected ({selectedProductIds.length})
              </button>
            )}
            <button
              onClick={onAddProduct}
              style={{ backgroundColor: storeInfo.primaryColor || '#0d9488' }}
              className="flex items-center gap-2 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              <PlusIcon />
              Add New
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition text-sm bg-white"
          >
            <option value="all">All Stock</option>
            <option value="in-stock">In Stock (&gt;5)</option>
            <option value="low-stock">Low Stock (1-5)</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>

        {filteredProducts.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md">
              <input
                type="checkbox"
                checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                onChange={toggleSelectAll}
                style={{ color: storeInfo.primaryColor || '#0d9488' }}
                className="w-4 h-4 focus:ring-teal-500 border-gray-300 rounded cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-600">
                {searchTerm ? `Select All Filtered (${filteredProducts.length})` : 'Select All'}
              </span>
            </div>
            {!searchTerm && stockFilter === 'all' && (
              <p className="text-[10px] text-gray-400 italic px-1">
                Tip: Drag and drop products to reorder them in your store.
              </p>
            )}
          </div>
        )}

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {filteredProducts.length > 0 ? filteredProducts.map(product => (
            <div
              key={product.id}
              draggable={!searchTerm && stockFilter === 'all'} // Disable dragging when searching or filtering
              onDragStart={(e) => handleDragStart(e, product)}
              onDragEnter={() => {}} // Handled by DragOver for better reliability
              onDragLeave={handleDragLeave}
              onDragOver={(e) => handleDragOver(e, product.id)}
              onDrop={(e) => handleDrop(e, product)}
              onDragEnd={handleDragEnd}
              className={`p-3 rounded-lg flex items-center justify-between shadow-sm transition-all duration-200
                ${draggedItemId === product.id ? 'opacity-50 scale-95 bg-teal-50 border-2 border-dashed border-teal-300' : 'bg-gray-50 border border-transparent'}
                ${dragOverItemId === product.id ? 'border-teal-500 bg-teal-50 translate-y-1' : ''}
                ${selectedProductIds.includes(product.id) ? 'ring-1 ring-teal-300 bg-teal-50/30' : ''}
                ${searchTerm || stockFilter !== 'all' ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(product.id)}
                  onChange={() => toggleProductSelection(product.id)}
                  style={{ color: storeInfo.primaryColor || '#0d9488' }}
                  className="w-4 h-4 focus:ring-teal-500 border-gray-300 rounded cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
                <DragHandleIcon />
                <img src={product.image} alt={product.name} className="w-12 h-12 rounded-md object-cover" />
                <div>
                  <p className="font-semibold text-gray-800">{product.name}</p>
                  <div className="flex items-center gap-2">
                    {product.discountPrice ? (
                      <div className="flex items-center gap-1">
                        <p className="text-sm text-gray-400 line-through">{storeInfo.currency} {product.price}</p>
                        <p className="text-sm font-bold text-red-500">{storeInfo.currency} {product.discountPrice}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">{storeInfo.currency} {product.price}</p>
                    )}
                    <span className="text-gray-300">|</span>
                    <p className={`text-xs font-medium ${product.stockQuantity < 5 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                      Stock: {product.stockQuantity}
                      {product.stockQuantity < 5 && ' (Low)'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onEditProduct(product)} className="p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-100">
                  <EditIcon />
                </button>
                <button onClick={() => handleDeleteConfirm(product)} className="p-2 text-gray-500 hover:text-red-600 transition-colors rounded-full hover:bg-red-100">
                  <TrashIcon />
                </button>
              </div>
            </div>
          )) : (
            <p className="text-center text-gray-500 py-4">
              {searchTerm || stockFilter !== 'all' ? 'No products match your filters.' : 'No products yet. Add one to get started!'}
            </p>
          )}
        </div>
      </div>

    </div>
  );
};

export default SettingsPanel;