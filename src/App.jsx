import React, { useState, useEffect } from 'react';
import { Pizza, MessageSquare, Phone, MapPin, Clock, ChevronRight, Zap, AlertCircle, Volume2, ChevronDown, ChevronUp, Beer, Utensils, Star, ShieldCheck, Sparkles } from 'lucide-react';
import { supabase } from './lib/supabase';
import ChatWidget from './ChatWidget';

/**
 * GETMAIT PLATFORM - PUNCHY HEADLINE EDITION
 * Brand: Getmait.dk
 * Headline: "Din Pizza. Din Mait." (Kort, præcis og sigende)
 */

const App = () => {
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [menu, setMenu] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      // Extract slug from hostname (subdomain eller domæne)
      const hostname = window.location.hostname;
      const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);

      let slug;
      if (hostname.includes('getmait.dk')) {
        // Extract subdomain from *.getmait.dk (e.g., napoli-pizza.getmait.dk -> napoli-pizza)
        slug = hostname.split('.getmait.dk')[0];
      } else if (hostname.includes('sslip.io')) {
        // Extract subdomain from sslip.io
        slug = hostname.split('.')[0];
      } else if (hostname.includes('localhost') || isIpAddress) {
        // Default for localhost and IP addresses
        slug = 'napoli-esbjerg';
      } else {
        // Fallback: extract first part
        slug = hostname.split('.')[0];
      }

      try {
        // Hent butiksinformation fra Supabase
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('slug', slug)
          .single();

        if (storeError) {
          console.error('Store error:', storeError);
          setError('Kunne ikke finde pizzaria. Kontakt support@getmait.dk');
          setLoading(false);
          return;
        }

        if (!storeData) {
          setError('Pizzaria ikke fundet.');
          setLoading(false);
          return;
        }

        setStore(storeData);

        // Hent menu items fra Supabase
        const { data: menuData, error: menuError } = await supabase
          .from('menu')
          .select('*')
          .eq('store_id', storeData.id)
          .eq('tilgaengelig', true)
          .order('kategori', { ascending: true })
          .order('pris', { ascending: true });

        if (menuError) {
          console.error('Menu error:', menuError);
          setError('Kunne ikke hente menukort.');
          setLoading(false);
          return;
        }

        setMenu(menuData || []);
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Kunne ikke hente data. Prøv igen senere.');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white font-sans text-left">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin mb-4"></div>
      <div className="font-black uppercase text-slate-300 italic tracking-[0.2em] text-[10px]">Getmait Platform...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white font-sans text-center p-6">
      <AlertCircle size={64} className="text-orange-600 mb-4" />
      <h2 className="text-2xl font-black italic-caps mb-2">Noget gik galt</h2>
      <p className="text-slate-500 mb-6">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-orange-600 text-white px-8 py-3 rounded-full font-bold"
      >
        Prøv igen
      </button>
    </div>
  );

  const brandColor = store?.primary_color || '#ea580c';
  const filteredMenu = activeCategory === 'all' ? menu : menu.filter(item => item.kategori === activeCategory);
  const displayedItems = isMenuExpanded ? filteredMenu : filteredMenu.slice(0, 4);

  // Find unikke kategorier
  const categories = [...new Set(menu.map(item => item.kategori))];

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-100 overflow-x-hidden text-left">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md py-5 border-b border-slate-100 px-6 text-left">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-black text-2xl tracking-tighter italic text-slate-900 uppercase">
            <Pizza style={{ color: brandColor }} size={28} /> {store.name}
          </div>
          <div className="flex items-center gap-6">
             <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 italic leading-none mb-1 tracking-widest">Spørg din Mait</span>
                <a href={`tel:${store.contact_phone}`} className="text-sm font-extrabold text-slate-900 tracking-tight italic">{store.contact_phone}</a>
             </div>
            <button className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-xl active:scale-95 transition-transform">Bestil nu</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-48 pb-24 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center hero-gradient text-left">
        <div className="text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest mb-6 italic">
            <Sparkles size={12} className="text-orange-500" /> Ingen telefonkø hos {store.name}
          </div>
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-black leading-[0.85] mb-8 italic-caps text-slate-900 text-left">
            Din Pizza. <br />
            <span style={{ color: brandColor }} className="underline decoration-8 underline-offset-[12px]">Din Mait.</span>
          </h1>
          <p className="text-slate-500 text-xl mb-10 max-w-sm font-medium italic text-left leading-relaxed">
            Smagen af {store.name}, nu med hurtigere bestilling. Ring direkte til din Mait, eller send en SMS på få sekunder.
          </p>
          <div className="flex flex-col gap-4 text-left">
            <a
              href={`tel:${store.contact_phone}`}
              style={{ backgroundColor: brandColor }}
              className="text-white px-10 py-5 rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-2xl transition-all hover:brightness-110 active:scale-95 text-lg group w-full sm:w-auto text-left"
            >
              <Volume2 size={22} /> Ring til din Mait
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href={`sms:${store.contact_phone}`}
              className="bg-white border-2 border-slate-200 text-slate-800 px-10 py-5 rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-sm transition-all hover:bg-slate-50 active:scale-95 text-lg w-full sm:w-auto text-left"
            >
              <MessageSquare size={22} /> Send SMS Bestilling
            </a>
          </div>
        </div>

        <div className="relative hidden md:block text-left">
          <div className="rounded-[80px] overflow-hidden shadow-2xl rotate-3 border-[16px] border-white bg-slate-100 aspect-square group hover:rotate-0 transition-all duration-700">
            <img
              src={store.cover_image_url || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1000'}
              className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700"
              alt={store.name}
            />
          </div>
          <div className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-md p-6 rounded-[32px] flex items-center gap-4 shadow-2xl border border-slate-50 transition-transform hover:-translate-y-2 text-left">
            <div className="h-4 w-4 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5 italic text-left">Ovnene er varme</p>
              <p className="font-bold text-slate-800 tracking-tight italic uppercase text-left">{store.waiting_time || 20} min ventetid</p>
            </div>
          </div>
        </div>
      </header>

      {/* Menu Section */}
      <section className="bg-white py-32 px-6 rounded-t-[80px] shadow-[0_-20px_50px_rgba(0,0,0,0.02)] -mt-12 text-left">
        <div className="max-w-6xl mx-auto text-left">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 text-left">
            <div className="text-left">
              <h2 className="text-5xl font-black italic-caps mb-2 text-left tracking-tighter">Menukortet</h2>
              <p className="text-slate-400 font-medium italic text-left leading-relaxed">Håndplukket menu fra {store.name} i {store.city || 'Danmark'}.</p>
            </div>
            <div className="flex flex-wrap gap-3 text-left">
              <button
                onClick={() => { setActiveCategory('all'); setIsMenuExpanded(false); }}
                style={{ backgroundColor: activeCategory === 'all' ? brandColor : '#fff', color: activeCategory === 'all' ? '#fff' : '#94a3b8' }}
                className={`px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest italic shadow-sm flex items-center gap-2 transition-all ${activeCategory !== 'all' ? 'border border-slate-200' : ''}`}
              >
                <Utensils size={16} /> Se Alt
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setIsMenuExpanded(false); }}
                  style={{ backgroundColor: activeCategory === cat ? brandColor : '#fff', color: activeCategory === cat ? '#fff' : '#94a3b8' }}
                  className={`px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest italic shadow-sm flex items-center gap-2 transition-all ${activeCategory !== cat ? 'border border-slate-200' : ''}`}
                >
                  {cat === 'drinks' && <Beer size={16} />}
                  {cat === 'pizza' && <Pizza size={16} />}
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {displayedItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 italic">Ingen menupunkter tilgængelige i denne kategori.</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-8 text-left transition-all duration-500">
                {displayedItems.map(item => (
                  <div key={item.id} className="p-10 rounded-[48px] border border-slate-100 flex justify-between items-center bg-slate-50/30 hover:bg-white hover:border-slate-300 hover:shadow-xl transition-all duration-300 group cursor-default text-left">
                    <div className="max-w-[70%] text-left">
                      <div className="flex items-center gap-2 mb-1">
                         <h3 className="font-black text-2xl italic-caps text-slate-800 group-hover:text-orange-600 transition-colors text-left">{item.navn}</h3>
                         {item.is_popular && <Star size={14} className="text-orange-400 fill-orange-400" />}
                      </div>
                      <p className="text-slate-400 text-sm italic font-medium leading-relaxed text-left">{item.beskrivelse}</p>
                    </div>
                    <div className="text-right flex flex-col items-end text-left">
                      <span style={{ color: brandColor }} className="text-3xl font-black tabular-nums tracking-tighter italic">{item.pris} kr.</span>
                      <div className="h-1 w-6 bg-slate-100 rounded-full mt-2 group-hover:w-12 transition-all"></div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredMenu.length > 4 && (
                <div className="mt-16 flex justify-center">
                  <button onClick={() => setIsMenuExpanded(!isMenuExpanded)} className="flex flex-col items-center gap-3 group transition-all">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-orange-600 italic">
                      {isMenuExpanded ? 'Vis mindre' : 'Se hele menukortet'}
                    </span>
                    <div className={`h-14 w-14 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-300 group-hover:border-orange-600 group-hover:text-orange-600 transition-all shadow-sm ${isMenuExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown size={28} />
                    </div>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-32 px-6 bg-slate-50 text-left">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center text-left">
            <div className="text-left">
                <div className="text-orange-600 font-black italic-caps text-sm tracking-widest mb-4">MODERNE SERVICE</div>
                <h2 className="text-5xl md:text-6xl font-black italic-caps mb-8 text-left italic tracking-tighter leading-none">Spørg din Mait <br/> hos {store.name}</h2>
                <p className="text-slate-500 text-lg mb-10 font-medium italic text-left leading-relaxed">
                    Glem robot-stemmer og ventetid. Din Mait kender menukortet ud og ind og husker dine præferencer fra sidst. <br/><br/>
                    Bestil med stemmen eller en SMS – det er den hurtigste vej fra sult til servering.
                </p>
                <div className="flex items-center gap-4 text-left">
                    <div className="h-12 w-12 rounded-full bg-white shadow-md flex items-center justify-center text-orange-600">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Intelligent digital ekspedition</p>
                </div>
            </div>
            <div className="bg-slate-900 p-12 rounded-[60px] text-white relative overflow-hidden text-left">
                <div className="relative z-10 text-left">
                    <div className="h-12 w-12 rounded-2xl bg-orange-600 flex items-center justify-center mb-8">
                        <MessageSquare size={24} />
                    </div>
                    <blockquote className="text-3xl font-black italic mb-8 tracking-tight text-left leading-relaxed">
                        "Hej Mait, jeg vil gerne have en Roma klar til kl. 18.00 og en Fanta – tak!"
                    </blockquote>
                    <div className="flex items-center gap-3 text-left">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Getmait: Noteret, vi ses kl. 18.00!</p>
                    </div>
                </div>
                <div className="absolute -right-20 -bottom-20 opacity-5 font-black italic-caps text-[200px] pointer-events-none">MAIT</div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 px-6 bg-slate-900 text-center text-white">
        <div className="max-w-xl mx-auto space-y-12 text-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2 font-black text-3xl tracking-tighter italic text-white uppercase italic text-center leading-none">
              <Pizza style={{ color: brandColor }} /> {store.name}
            </div>
            <p className="text-slate-500 text-sm font-medium italic max-w-xs mx-auto text-center">
              Traditionelt håndværk kombineret med personlig digital service.
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-center gap-8 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] italic text-center">
            <div className="flex items-center justify-center gap-2 text-center italic"><MapPin size={14} /> {store.address}</div>
            <div className="flex items-center justify-center gap-2 text-center italic"><Phone size={14} /> Direkte: {store.contact_phone}</div>
          </div>

          <div className="pt-12 border-t border-slate-800 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-slate-600 text-[9px] font-black uppercase tracking-[0.6em] leading-none text-center">Powered by</span>
                <div className="font-black italic text-xs tracking-tighter text-white">GET<span className="text-orange-600">MAIT</span>.dk</div>
            </div>
            <div className="text-slate-700 text-[8px] font-bold uppercase text-center italic tracking-widest">
              CVR: {store.cvr_number} • © 2026 {store.name} • Professional Automation
            </div>
            {store.smiley_url && (
              <div className="mt-4">
                <a
                  href={store.smiley_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-slate-500 text-[9px] font-black uppercase tracking-widest hover:text-orange-600 transition-colors"
                >
                  <ShieldCheck size={12} /> Se kontrolrapport
                </a>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* GetMait AI Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default App;
