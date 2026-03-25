
import React from 'react';
import { StoreInfo, Product } from '../types';
import ProductCard from './ProductCard';
import { Facebook, Instagram, Twitter } from 'lucide-react';

interface StorePreviewProps {
  storeInfo: StoreInfo;
  products: Product[];
}

const StorePreview: React.FC<StorePreviewProps> = ({ storeInfo, products }) => {
  const hasSocialLinks = storeInfo.facebook || storeInfo.instagram || storeInfo.twitter;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col min-h-[600px]">
      <div className="flex-grow">
        <div className="text-center pb-6 mb-8 border-b-2" style={{ borderColor: `${storeInfo.primaryColor}20` || '#f0fdfa' }}>
          <h2 className="text-4xl font-extrabold text-gray-800 tracking-tight">{storeInfo.name || 'Your Store Name'}</h2>
          <p className="mt-2 text-lg text-gray-500">{storeInfo.description || 'Your store description will appear here.'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.length > 0 ? (
            products.map(product => (
              <ProductCard key={product.id} product={product} storeInfo={storeInfo} />
            ))
          ) : (
            <div className="md:col-span-2 text-center py-16 px-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-700">Your Products Will Appear Here</h3>
              <p className="text-gray-500 mt-2">Add products using the settings panel to see them live.</p>
            </div>
          )}
        </div>
      </div>

      {hasSocialLinks && (
        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col items-center gap-4">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Connect with us</p>
          <div className="flex gap-6">
            {storeInfo.facebook && (
              <a 
                href={storeInfo.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-600 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={24} />
              </a>
            )}
            {storeInfo.instagram && (
              <a 
                href={storeInfo.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-600 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={24} />
              </a>
            )}
            {storeInfo.twitter && (
              <a 
                href={storeInfo.twitter} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={24} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StorePreview;
