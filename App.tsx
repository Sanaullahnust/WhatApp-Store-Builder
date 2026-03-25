
import React, { useState, useEffect, useCallback } from 'react';
import { StoreInfo, Product } from './types';
import SettingsPanel from './components/SettingsPanel';
import StorePreview from './components/StorePreview';
import AddProductModal from './components/AddProductModal';
import { Toaster, toast } from 'react-hot-toast';

const App: React.FC = () => {
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(() => {
    const saved = localStorage.getItem('storeInfo');
    return saved ? JSON.parse(saved) : {
      name: 'Dr. Sana\'s Store',
      description: 'Your one-stop shop for wellness products.',
      whatsappNumber: '1234567890',
      currency: 'USD',
      primaryColor: '#0d9488',
      facebook: '',
      instagram: '',
      twitter: '',
    };
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('products');
    if (saved) {
      const parsed = JSON.parse(saved) as Product[];
      // Migrate existing products to include images array and media array if missing
      return parsed.map(p => {
        const images = p.images || (p.image ? [p.image] : []);
        const media = p.media || images.map(img => ({ type: 'image' as const, url: img }));
        return {
          ...p,
          images,
          media
        };
      });
    }
    return [
        {
            id: '1',
            name: 'Organic Green Tea',
            price: 15.99,
            discountPrice: 12.99,
            description: 'A refreshing and healthy blend of organic green tea leaves.',
            image: 'https://picsum.photos/400/300?random=1',
            images: ['https://picsum.photos/400/300?random=1'],
            media: [{ type: 'image', url: 'https://picsum.photos/400/300?random=1' }],
            stockQuantity: 25
        },
        {
            id: '2',
            name: 'Aromatherapy Diffuser',
            price: 39.99,
            description: 'Create a calming atmosphere with this ultrasonic essential oil diffuser.',
            image: 'https://picsum.photos/400/300?random=2',
            images: ['https://picsum.photos/400/300?random=2'],
            media: [{ type: 'image', url: 'https://picsum.photos/400/300?random=2' }],
            stockQuantity: 3
        },
        {
            id: '3',
            name: 'Essential Oil Set',
            price: 29.99,
            description: 'A collection of pure essential oils for various needs.',
            image: 'https://picsum.photos/400/300?random=3',
            images: ['https://picsum.photos/400/300?random=3'],
            media: [{ type: 'image', url: 'https://picsum.photos/400/300?random=3' }],
            stockQuantity: 15,
            variants: [
              { id: 'v1', name: 'Lavender', price: 29.99, stockQuantity: 10 },
              { id: 'v2', name: 'Peppermint', price: 34.99, discountPrice: 29.99, stockQuantity: 5 }
            ]
        }
    ];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  useEffect(() => {
    localStorage.setItem('storeInfo', JSON.stringify(storeInfo));
  }, [storeInfo]);

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  const handleStoreInfoChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setStoreInfo(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleLogoUpload = useCallback((logo: string) => {
    setStoreInfo(prev => ({ ...prev, logo }));
  }, []);

  const handleColorChange = useCallback((primaryColor: string) => {
    setStoreInfo(prev => ({ ...prev, primaryColor }));
  }, []);

  const openAddModal = useCallback(() => {
    setEditingProduct(undefined);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingProduct(undefined);
  }, []);

  const addProduct = useCallback((product: Omit<Product, 'id'>) => {
    setProducts(prev => [...prev, { ...product, id: Date.now().toString() }]);
  }, []);

  const updateProduct = useCallback((updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  }, []);

  const deleteProduct = useCallback((productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    toast.success('Product deleted successfully!');
  }, []);

  const deleteProducts = useCallback((productIds: string[]) => {
    setProducts(prev => prev.filter(p => !productIds.includes(p.id)));
    toast.success(`${productIds.length} products deleted successfully!`);
  }, []);

  const handleProductReorder = useCallback((reorderedProducts: Product[]) => {
    setProducts(reorderedProducts);
  }, []);

  return (
    <div className="min-h-screen font-sans text-gray-800 bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-20 border-b" style={{ borderTop: `4px solid ${storeInfo.primaryColor || '#0d9488'}` }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {storeInfo.logo && (
              <img src={storeInfo.logo} alt="Logo" className="h-10 w-auto object-contain" />
            )}
            <h1 className="text-2xl font-bold" style={{ color: storeInfo.primaryColor || '#0d9488' }}>
              {storeInfo.name}
            </h1>
          </div>
          <div className="hidden sm:block text-sm text-gray-500 font-medium">
            WhatsApp Store Builder
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <SettingsPanel
              storeInfo={storeInfo}
              products={products}
              onStoreInfoChange={handleStoreInfoChange}
              onLogoUpload={handleLogoUpload}
              onColorChange={handleColorChange}
              onAddProduct={openAddModal}
              onEditProduct={openEditModal}
              onDeleteProduct={deleteProduct}
              onDeleteProducts={deleteProducts}
              onProductReorder={handleProductReorder}
            />
          </div>
          <div className="lg:col-span-8">
            <StorePreview storeInfo={storeInfo} products={products} />
          </div>
        </div>
      </main>

      {isModalOpen && (
        <AddProductModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onAddProduct={addProduct}
          onUpdateProduct={updateProduct}
          editingProduct={editingProduct}
        />
      )}
      <Toaster position="bottom-right" />
    </div>
  );
};

export default App;
