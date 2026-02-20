import React, { useEffect, useState } from 'react';
import { useScrollLock } from '../src/hooks/useScrollLock';
import { X, ShoppingCart, Heart, Loader, ShoppingBag, Plus } from 'lucide-react';
import { supabase } from '../src/supabaseClient';
import { Database } from '../src/db_types';
import { FourthwallService } from '../src/services/FourthwallService';
import DOMPurify from 'dompurify';
import { ProductDetailModal } from '../src/components/modals/ProductDetailModal';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_count: number;
  is_hero: boolean;
  is_active: boolean;
  created_at: string;
}

interface MerchShopProps {
  onClose: () => void;
  isNightMode: boolean;
}

const MerchShop: React.FC<MerchShopProps> = ({ onClose, isNightMode }) => {
  useScrollLock(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ id: string; variantId: string; quantity: number; name: string; price: number; image_url: string }[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [banner, setBanner] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchBanner();
  }, []);

  const fetchBanner = async () => {
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'merch_banner')
      .single();

    if (data?.value) {
      try {
        setBanner(JSON.parse(data.value));
      } catch (e) {
        console.error('Failed to parse banner settings', e);
      }
    }
  };

  const fetchProducts = async () => {
    try {
      const fwProducts = await FourthwallService.getProducts();

      if (fwProducts.length > 0) {
        setProducts(fwProducts.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.variants[0]?.unitPrice?.value || 0,
          image_url: p.images[0]?.url || '',
          stock_count: 999,
          created_at: new Date().toISOString(),
          is_active: true,
          is_hero: false, // Default, will be overridden
        })));

        // Match with Supabase for is_hero status
        const { data: dbProducts } = await supabase.from('products').select('*') as any;
        if (dbProducts) {
          setProducts(prev => prev.map(p => {
            const dbP = dbProducts.find((dp: any) => dp.id === p.id);
            return {
              ...p,
              is_hero: dbP?.is_hero || false,
              description: dbP?.description || p.description, // Prefer DB description if set
              stock_count: dbP?.stock_count ?? p.stock_count
            };
          }));
        }

      } else {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('is_hero', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        id: product.id,
        variantId: product.id, // Assuming ID is variant ID for simple flow
        quantity: 1,
        name: product.name,
        price: product.price,
        image_url: product.image_url
      }];
    });
    setShowCart(true);
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const checkoutItems = cart.map(item => ({
        variantId: item.variantId,
        quantity: item.quantity
      }));

      const session = await FourthwallService.createCart(checkoutItems);
      if (session?.checkoutUrl) {
        window.location.href = session.checkoutUrl;
      } else {
        alert("Unable to reach checkout right now. Please try again later crystals! ✨");
      }
    } catch (err) {
      console.error("Checkout crash:", err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const heroProduct = products.find(p => p.is_hero) || products[0];
  const regularProducts = products.filter(p => p.id !== heroProduct?.id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
        onClick={onClose}
      />

      <div className={`relative w-full max-w-7xl h-full md:h-[90vh] overflow-hidden rounded-none md:rounded-[3rem] shadow-2xl flex flex-col md:flex-row transition-all duration-500 ${isNightMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className={`p-6 border-b flex items-center justify-between ${isNightMode ? 'border-slate-800' : 'border-pink-50'}`}>
            <div className="flex items-center space-x-3">
              <h2 className="text-3xl font-brand font-black text-pink-600 tracking-tighter">THE SANCTUARY SHOP</h2>
              <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">Collection 2026</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative p-3 bg-pink-500 text-white rounded-2xl shadow-lg hover:bg-pink-600 transition-all active:scale-95 group"
              >
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-pink-500 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shadow-md animate-bounce">
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                  </span>
                )}
              </button>
              <button onClick={onClose} className={`p-3 rounded-2xl transition-all hover:bg-red-50 hover:text-red-500 ${isNightMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Shop Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 space-y-10">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-40">
                <Loader className="animate-spin text-pink-500 mb-4" size={48} />
                <p className="text-slate-400 font-medium">Summoning your treasures...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-40 text-slate-400 border-2 border-dashed border-slate-800 rounded-[3rem]">
                <Heart size={48} className="mb-4 opacity-20" />
                <p className="font-medium uppercase tracking-widest text-xs">The vault is currently closed</p>
              </div>
            ) : (
              <>
                {/* Admin Banner */}
                {banner && banner.active && (
                  <div className="relative rounded-3xl overflow-hidden min-h-[180px] flex items-center shadow-2xl group">
                    <div className="absolute inset-0">
                      <img src={banner.imageUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/50 to-transparent" />
                    </div>
                    <div className="relative z-10 p-8 md:p-12 max-w-2xl">
                      <span className="text-pink-400 font-bold tracking-widest uppercase text-xs mb-2 block">{banner.subtitle}</span>
                      <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter mb-6 leading-[0.9]">{banner.title}</h2>
                      {banner.ctaLink && (
                        <a href={banner.ctaLink} target="_blank" rel="noopener noreferrer" className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-pink-500 hover:text-white transition-all shadow-lg inline-flex items-center gap-2">
                          {banner.ctaText} <ShoppingBag size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Hero Feature (Smaller) */}
                {heroProduct && (
                  <div className="relative group rounded-[2.5rem] overflow-hidden bg-slate-950 min-h-[350px] flex flex-col md:flex-row shadow-xl border border-slate-800/50">
                    <div className="w-full md:w-2/5 overflow-hidden relative">
                      <img
                        src={heroProduct.image_url}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out opacity-80"
                        alt={heroProduct.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-transparent hidden md:block" />
                    </div>
                    <div className="w-full md:w-3/5 p-8 md:p-10 flex flex-col justify-center relative z-10">
                      <span className="text-pink-500 font-black tracking-[0.3em] uppercase text-xs mb-3 flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-pink-500" /> Sanctuary Hero
                      </span>
                      <h3 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 tracking-tighter">
                        {heroProduct.name}
                      </h3>
                      <div
                        className="text-slate-400 text-sm mb-6 line-clamp-2 max-w-lg"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(heroProduct.description) }}
                      />
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSelectedProduct(heroProduct)}
                          className="px-8 py-4 bg-white text-slate-950 rounded-2xl font-black shadow-lg hover:bg-pink-500 hover:text-white transition-all transform hover:-translate-y-1 active:scale-95 text-xs uppercase tracking-widest"
                        >
                          View Details
                        </button>
                        <span className="text-2xl font-black text-white">${heroProduct.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Grid */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h4 className="text-2xl font-black uppercase tracking-tight">The Collection</h4>
                    <div className={`h-[2px] flex-1 mx-8 rounded-full ${isNightMode ? 'bg-slate-800' : 'bg-slate-100'}`} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {regularProducts.map((item) => (
                      <div
                        key={item.id}
                        className="group flex flex-col space-y-4 cursor-pointer"
                        onClick={() => setSelectedProduct(item)}
                      >
                        <div className={`relative aspect-[4/5] rounded-[2rem] overflow-hidden border border-transparent group-hover:border-pink-500/30 transition-all duration-500 shadow-sm hover:shadow-2xl ${isNightMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
                          <img
                            src={item.image_url || 'https://placehold.co/400x500/pink/white?text=Mapa+Merch'}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                            <span className="bg-white text-black px-6 py-3 rounded-full font-black uppercase text-xs tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                              Quick View
                            </span>
                          </div>

                          {item.stock_count < 10 && item.stock_count > 0 && (
                            <span className="absolute top-4 left-4 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-lg">
                              Rare Drop
                            </span>
                          )}
                        </div>
                        <div className="px-1 space-y-1">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold tracking-tight group-hover:text-pink-500 transition-colors">{item.name}</h3>
                            <p className="text-slate-500 font-mono font-bold">${item.price.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Persistent Cart Sidebar */}
        <div className={`w-full md:w-[400px] border-l transform transition-all duration-[600ms] cubic-bezier(0.4, 0, 0.2, 1) flex flex-col ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-pink-50/30 border-pink-100'} ${showCart ? 'translate-x-0 opacity-100' : 'translate-x-full md:translate-x-0 md:w-0 overflow-hidden md:opacity-0'}`}>
          <div className="p-8 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black tracking-tight">YOUR BASKET</h3>
              <button
                onClick={() => setShowCart(false)}
                className={`md:hidden p-2 rounded-full ${isNightMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center space-y-4">
                  <ShoppingBag size={48} className="opacity-10 mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest">Basket is longing for treasures</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-20 h-24 bg-slate-200 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-white/10">
                      <img src={item.image_url} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-bold text-sm leading-tight text-pink-600 mb-1">{item.name}</h4>
                        <p className="text-xs font-mono text-slate-500">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center rounded-xl border p-1 ${isNightMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                          <button onClick={() => updateCartQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center hover:text-pink-500 transition-colors">-</button>
                          <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center hover:text-pink-500 transition-colors">+</button>
                        </div>
                        <button onClick={() => updateCartQuantity(item.id, -999)} className="text-[10px] font-black uppercase text-slate-400 hover:text-red-500 tracking-widest">Remove</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={`mt-8 pt-8 border-t space-y-6 ${isNightMode ? 'border-slate-800' : 'border-pink-100'}`}>
              <div className="flex justify-between items-end">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Subtotal</span>
                <span className="text-3xl font-black tracking-tighter text-pink-500">
                  ${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                </span>
              </div>
              <button
                disabled={cart.length === 0 || isCheckingOut}
                onClick={handleCheckout}
                className="w-full py-5 bg-pink-500 hover:bg-pink-600 disabled:bg-slate-400 text-white rounded-3xl font-black tracking-[0.2em] text-sm shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-3 group overflow-hidden relative"
              >
                {isCheckingOut ? (
                  <Loader className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>CHECKOUT NOW</span>
                    <ShoppingCart size={18} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ProductDetailModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onAddToCart={addToCart}
        isNightMode={isNightMode}
      />
    </div>
  );
};

export default MerchShop;
