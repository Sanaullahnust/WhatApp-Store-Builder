
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, StoreInfo } from '../types';
import WhatsAppIcon from './icons/WhatsAppIcon';
import CheckIcon from './icons/CheckIcon';
import { Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaCarousel from './MediaCarousel';

interface ProductCardProps {
  product: Product;
  storeInfo: StoreInfo;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, storeInfo }) => {
  const [orderStatus, setOrderStatus] = useState<'idle' | 'processing' | 'confirmed'>('idle');
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants && product.variants.length > 0 ? product.variants[0].id : null
  );

  const selectedVariant = product.variants?.find(v => v.id === selectedVariantId);
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentDiscountPrice = selectedVariant ? selectedVariant.discountPrice : product.discountPrice;
  const currentStock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;

  const productMedia = product.media && product.media.length > 0 
    ? product.media 
    : (product.images && product.images.length > 0 
        ? product.images.map(img => ({ type: 'image' as const, url: img })) 
        : [{ type: 'image' as const, url: product.image }]);

  useEffect(() => {
    const handleHashChange = () => {
      setIsHighlighted(window.location.hash === `#product-${product.id}`);
    };
    
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [product.id]);

  const finalPrice = currentDiscountPrice ?? currentPrice;
  const whatsAppMessage = `Hi, I would like to order "${product.name}"${selectedVariant ? ` (${selectedVariant.name})` : ''} for ${storeInfo.currency} ${finalPrice.toFixed(2)}.`;
  const whatsAppLink = `https://wa.me/${storeInfo.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(whatsAppMessage)}`;

  const getStockStatus = () => {
    if (currentStock === 0) {
      return { label: 'Out of Stock', color: 'text-red-600 bg-red-50 border-red-100' };
    }
    if (currentStock <= 5) {
      return { label: `Low Stock (${currentStock} left)`, color: 'text-orange-600 bg-orange-50 border-orange-100' };
    }
    return { label: 'In Stock', color: 'text-green-600 bg-green-50 border-green-100' };
  };

  const stockStatus = getStockStatus();

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}${window.location.pathname}#product-${product.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} at ${storeInfo.name}!`,
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success('Link copied to clipboard!');
      }).catch(() => {
        toast.error('Failed to copy link.');
      });
    }
  };

  const handleOrderClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (orderStatus !== 'idle') return;

    setOrderStatus('processing');
    setShowTooltip(false);

    // Step 1: Processing animation
    setTimeout(() => {
      setOrderStatus('confirmed');
      
      // Step 2: Confirmed animation
      setTimeout(() => {
        window.open(whatsAppLink, '_blank', 'noopener,noreferrer');
        // Reset back to idle after a short delay so user can order again if needed
        setTimeout(() => {
          setOrderStatus('idle');
        }, 1000);
      }, 1000);
    }, 1500);
  };

  return (
    <div 
      id={`product-${product.id}`} 
      className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-xl relative group scroll-mt-24
        ${isHighlighted ? 'ring-2 ring-teal-500 shadow-teal-100 scale-105' : ''}`}
    >
      <div className="relative overflow-hidden group/image">
        <MediaCarousel media={productMedia} productName={product.name} />

        <button
          onClick={handleShare}
          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white hover:text-teal-600 z-20"
          title="Share product"
        >
          <Share2 size={18} />
        </button>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                {currentDiscountPrice && (
                  <span 
                    className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white rounded-md"
                    style={{ backgroundColor: storeInfo.primaryColor || '#0d9488' }}
                  >
                    Sale
                  </span>
                )}
              </div>
              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${stockStatus.color}`}>
                {stockStatus.label}
              </span>
            </div>
            <div className="text-right">
              {currentDiscountPrice ? (
                <>
                  <p className="text-sm text-gray-400 line-through">{storeInfo.currency} {currentPrice.toFixed(2)}</p>
                  <p className="text-lg font-bold text-red-500">{storeInfo.currency} {currentDiscountPrice.toFixed(2)}</p>
                </>
              ) : (
                <p className="text-lg font-bold" style={{ color: storeInfo.primaryColor || '#0d9488' }}>{storeInfo.currency} {currentPrice.toFixed(2)}</p>
              )}
            </div>
        </div>

        {product.variants && product.variants.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Select Option</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-all ${
                    selectedVariantId === variant.id
                      ? 'border-teal-500 bg-teal-50 text-teal-700 font-semibold shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {variant.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-gray-600 mt-2 h-20 overflow-hidden">{product.description}</p>
        
        <div className="relative mt-4">
          <AnimatePresence>
            {showTooltip && orderStatus === 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 10, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: 10, x: '-50%' }}
                className="absolute bottom-full left-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap z-10 pointer-events-none"
              >
                {currentStock === 0 
                  ? 'This item is currently out of stock' 
                  : 'Click to open WhatsApp and place your order'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-800" />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleOrderClick}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            disabled={orderStatus !== 'idle' || currentStock === 0}
            className={`w-full relative overflow-hidden font-bold py-2 px-4 rounded-lg shadow-lg transition-all duration-300 h-11
              ${orderStatus === 'idle' && currentStock > 0 ? 'bg-green-500 text-white hover:bg-green-600 transform hover:-translate-y-0.5' : ''}
              ${orderStatus === 'idle' && currentStock === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : ''}
              ${orderStatus === 'processing' ? 'bg-blue-500 text-white cursor-wait animate-pulse' : ''}
              ${orderStatus === 'confirmed' ? 'bg-green-600 text-white cursor-default' : ''}
            `}
          >
            {/* Progress Bar for Processing State */}
            {orderStatus === 'processing' && (
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, ease: "linear" }}
                className="absolute bottom-0 left-0 h-1 bg-blue-300 opacity-50"
              />
            )}

            <AnimatePresence mode="wait">
              {orderStatus === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-center gap-2"
                >
                  <WhatsAppIcon />
                  {currentStock === 0 ? 'Out of Stock' : 'Order on WhatsApp'}
                </motion.div>
              )}
              {orderStatus === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center justify-center gap-2"
                >
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </motion.div>
              )}
              {orderStatus === 'confirmed' && (
                <motion.div
                  key="confirmed"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="flex items-center justify-center gap-2"
                >
                  <CheckIcon />
                  Confirmed!
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;