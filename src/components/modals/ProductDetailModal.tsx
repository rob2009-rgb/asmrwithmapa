import React from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { X, ShoppingCart, Loader } from 'lucide-react';
import DOMPurify from 'dompurify';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    stock_count: number;
}

interface ProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onAddToCart: (product: Product) => void;
    isNightMode: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ isOpen, onClose, product, onAddToCart, isNightMode }) => {
    useScrollLock(isOpen);
    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md transition-opacity" onClick={onClose} />

            <div className={`relative w-full max-w-5xl h-[90vh] md:h-[80vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300 ${isNightMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}>

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-20 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-all backdrop-blur-sm shadow-lg"
                >
                    <X size={24} />
                </button>

                {/* Left: Image Container */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full bg-slate-950 relative group overflow-hidden">
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/80 to-transparent md:hidden" />
                </div>

                {/* Right: Details Container */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col relative">

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
                        {/* Header */}
                        <div className="mb-8">
                            <span className="text-pink-500 font-black tracking-[0.2em] uppercase text-xs mb-3 block">Official Merch</span>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-[1.1] mb-4">{product.name}</h2>

                            <div className="flex items-center gap-4 flex-wrap">
                                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-500">
                                    ${product.price.toFixed(2)}
                                </span>

                                {product.stock_count > 0 && product.stock_count < 10 && (
                                    <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest animate-pulse">
                                        Low Stock: {product.stock_count} Left
                                    </span>
                                )}

                                {product.stock_count === 0 && (
                                    <span className="bg-slate-800 text-slate-400 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
                                        Sold Out
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className={`prose prose-lg max-w-none mb-8 leading-relaxed ${isNightMode ? 'prose-invert text-slate-400' : 'text-slate-600'}`}>
                            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }} />
                        </div>
                    </div>

                    {/* Fixed Footer Actions */}
                    <div className={`p-8 md:p-12 pt-6 border-t ${isNightMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
                        <button
                            onClick={() => {
                                onAddToCart(product);
                                onClose();
                            }}
                            disabled={product.stock_count === 0}
                            className="w-full py-5 bg-pink-600 hover:bg-pink-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-2xl font-black tracking-[0.2em] uppercase text-sm shadow-xl hover:shadow-pink-500/20 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                        >
                            <ShoppingCart size={20} />
                            {product.stock_count === 0 ? 'Waitlist Full' : 'Secure For Sanctuary'}
                        </button>
                        <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest mt-4 opacity-60">
                            Secure Checkout via Fourthwall
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
