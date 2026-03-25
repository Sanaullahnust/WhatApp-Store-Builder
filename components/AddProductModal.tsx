import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Product, MediaItem, ProductVariant } from '../types';
import ImageIcon from './icons/ImageIcon';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
// FIX: Changed import from GoogleGenerativeAI to GoogleGenAI as per coding guidelines.
import { GoogleGenAI } from '@google/genai';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  editingProduct?: Product;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  onUpdateProduct,
  editingProduct,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setName('');
    setPrice('');
    setDiscountPrice('');
    setDescription('');
    setStockQuantity('');
    setMedia([]);
    setVariants([]);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }, []);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setPrice(editingProduct.price.toString());
      setDiscountPrice(editingProduct.discountPrice?.toString() || '');
      setDescription(editingProduct.description);
      setStockQuantity(editingProduct.stockQuantity.toString());
      
      if (editingProduct.media && editingProduct.media.length > 0) {
        setMedia(editingProduct.media);
      } else {
        const initialMedia: MediaItem[] = (editingProduct.images || (editingProduct.image ? [editingProduct.image] : [])).map(url => ({
          type: 'image',
          url
        }));
        setMedia(initialMedia);
      }

      if (editingProduct.variants) {
        setVariants(editingProduct.variants);
      } else {
        setVariants([]);
      }
    } else {
      resetForm();
    }
  }, [editingProduct, resetForm]);

  const processFiles = (files: FileList) => {
    const newMediaItems: MediaItem[] = [];
    let processedCount = 0;
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB

    Array.from(files).forEach(file => {
      if (file.size > MAX_SIZE) {
        toast.error(`File ${file.name} is too large. Max size is 50MB.`);
        return;
      }

      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onloadstart = () => {
        // Could add individual loading states if needed
      };
      reader.onloadend = () => {
        newMediaItems.push({
          type: isVideo ? 'video' : 'image',
          url: reader.result as string
        });
        processedCount++;
        // We need to account for skipped files (too large)
        const totalToProcess = Array.from(files).filter(f => f.size <= MAX_SIZE).length;
        if (processedCount === totalToProcess) {
          setMedia(prev => [...prev, ...newMediaItems]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newMedia = [...media];
    const draggedItem = newMedia[draggedIndex];
    newMedia.splice(draggedIndex, 1);
    newMedia.splice(index, 0, draggedItem);
    setMedia(newMedia);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const addVariant = () => {
    setVariants([...variants, {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      price: parseFloat(price) || 0,
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
      stockQuantity: parseInt(stockQuantity) || 0
    }]);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };
  
  const handleGenerateImage = async () => {
    if (!name.trim() || !description.trim()) {
      alert("Please enter a product name and description to generate a relevant image.");
      return;
    }
    setIsGenerating(true);
    try {
      // FIX: Updated Gemini API usage according to the latest SDK guidelines.
      // - Using new GoogleGenAI({apiKey: ...}) for initialization.
      // - Using ai.models.generateContent() for content generation.
      // - Using 'gemini-2.5-flash' model.
      // - Accessing text directly from the response.
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

      const prompt = `Generate 4-5 comma-separated, visually descriptive, single-word keywords for a stock photo for a product named "${name}" with the description: "${description}". Focus on the product's essence, appearance, and mood. Do not add any other text.`;
      
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      const text = result.text;
      
      const keywords = text.trim().replace(/\s/g, '').replace(/\.$/, '');
      const imageUrl = `https://source.unsplash.com/400x300/?${encodeURIComponent(keywords)}`;
      
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Unsplash image fetch failed with status: ${imageResponse.status}`);
      }
      const imageBlob = await imageResponse.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setMedia(prev => [...prev, { type: 'image', url: reader.result as string }]);
        setIsGenerating(false);
      };
      reader.onerror = () => {
          throw new Error('Failed to read image blob.');
      }
      reader.readAsDataURL(imageBlob);

    } catch (error) {
      console.error("Error generating image:", error);
      alert("Failed to generate AI placeholder image. Please try again or upload one manually.");
      setIsGenerating(false);
    }
  };


  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(price);
    const parsedDiscountPrice = discountPrice ? parseFloat(discountPrice) : undefined;
    const parsedStock = parseInt(stockQuantity);
    
    if (isNaN(parsedPrice)) {
      alert("Please enter a valid price.");
      return;
    }
    if (parsedDiscountPrice !== undefined && isNaN(parsedDiscountPrice)) {
      alert("Please enter a valid discount price.");
      return;
    }
    if (parsedDiscountPrice !== undefined && parsedDiscountPrice >= parsedPrice) {
      alert("Discount price must be less than the original price.");
      return;
    }
    if (isNaN(parsedStock)) {
      alert("Please enter a valid stock quantity.");
      return;
    }
    const productData = {
      name,
      price: parsedPrice,
      discountPrice: parsedDiscountPrice,
      description,
      stockQuantity: parsedStock,
      image: media.find(m => m.type === 'image')?.url || media[0]?.url || 'https://picsum.photos/400/300',
      images: media.filter(m => m.type === 'image').map(m => m.url),
      media: media,
      variants: variants.length > 0 ? variants : undefined,
    };

    if (editingProduct) {
      onUpdateProduct({ ...productData, id: editingProduct.id });
      toast.success('Product updated successfully!');
    } else {
      onAddProduct(productData);
      toast.success('Product added successfully!');
    }
    onClose();
  }, [name, price, discountPrice, description, stockQuantity, media, editingProduct, onUpdateProduct, onAddProduct, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-lg p-6 sm:p-8 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              id="productName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="productPrice" className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                id="productPrice"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label htmlFor="discountPrice" className="block text-sm font-medium text-gray-700 mb-1">Discount Price (Optional)</label>
              <input
                id="discountPrice"
                type="number"
                step="0.01"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Sale price"
              />
            </div>
          </div>
          <div>
            <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
            <input
              id="stockQuantity"
              type="number"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Product Variants</label>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-teal-600 bg-teal-50 rounded hover:bg-teal-100 transition-colors"
              >
                <Plus size={14} className="mr-1" />
                Add Variant
              </button>
            </div>
            
            {variants.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {variants.map((variant, index) => (
                  <div key={variant.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 relative group/variant">
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover/variant:opacity-100 transition-opacity hover:bg-red-200"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Variant Name (e.g. Small, Red)"
                          value={variant.name}
                          onChange={(e) => updateVariant(index, 'name', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-teal-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase font-bold mb-0.5">Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={variant.price}
                          onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-teal-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase font-bold mb-0.5">Discount</label>
                        <input
                          type="number"
                          step="0.01"
                          value={variant.discountPrice || ''}
                          onChange={(e) => updateVariant(index, 'discountPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-teal-500 outline-none"
                          placeholder="Optional"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] text-gray-500 uppercase font-bold mb-0.5">Stock</label>
                        <input
                          type="number"
                          value={variant.stockQuantity}
                          onChange={(e) => updateVariant(index, 'stockQuantity', parseInt(e.target.value))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-teal-500 outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No variants added. The base price and stock will be used.</p>
            )}
          </div>

          <div>
            <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="productDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Product Media (Images & Videos)</label>
             <p className="text-xs text-gray-500 mb-2">Drag and drop to reorder. The first image will be the main one.</p>
             <div className="mt-1 space-y-4">
                {media.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                        {media.map((item, index) => (
                            <div 
                                key={index} 
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`relative group aspect-square cursor-move transition-all duration-200 ${draggedIndex === index ? 'opacity-50 scale-95 shadow-xl ring-2 ring-teal-500 z-20' : 'hover:scale-[1.02]'}`}
                            >
                                {item.type === 'image' ? (
                                    <img src={item.url} alt={`Preview ${index}`} className="w-full h-full rounded-md object-cover border border-gray-200" />
                                ) : (
                                    <div className="w-full h-full rounded-md bg-black flex items-center justify-center border border-gray-200 overflow-hidden">
                                        <video src={item.url} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                                <button 
                                    type="button" 
                                    onClick={() => handleRemoveMedia(index)} 
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                {index === 0 && (
                                    <div className="absolute top-1 left-1 bg-teal-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-bold z-10 shadow-sm">
                                        Main
                                    </div>
                                )}
                                <div className="absolute inset-0 border-2 border-transparent group-hover:border-teal-500 rounded-md transition-colors pointer-events-none" />
                            </div>
                        ))}
                    </div>
                )}
                
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center h-32 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                        <p className="text-sm text-gray-500 mt-2">Generating image...</p>
                    </div>
                ) : (
                    <>
                        <input
                            ref={fileInputRef}
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={handleFileChange}
                            accept="image/*,video/*"
                            multiple
                        />
                        <label
                            htmlFor="file-upload"
                            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
                            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={handleDrop}
                            className={`flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors
                                ${isDraggingOver ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:border-gray-400'}`}
                        >
                            <div className="space-y-2 text-center">
                                <ImageIcon/>
                                <div className="flex text-sm text-gray-600 justify-center">
                                    <span className="font-medium text-teal-600">
                                        Upload files
                                    </span>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">Images or Videos up to 50MB</p>
                                <div className="pt-2 relative">
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="w-full border-t border-gray-300" />
                                    </div>
                                    <div className="relative flex justify-center text-xs">
                                        <span className="bg-white px-2 text-gray-500">or</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleGenerateImage();
                                    }}
                                    disabled={!name.trim() || !description.trim()}
                                    className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    Generate AI Placeholder
                                </button>
                            </div>
                        </label>
                    </>
                )}
             </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition">{editingProduct ? 'Save Changes' : 'Add Product'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;