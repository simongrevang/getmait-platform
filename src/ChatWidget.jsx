import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Utensils, Sparkles, Phone, MessageCircle, AlertCircle } from 'lucide-react';

/**
 * GETMAIT AI CHAT WIDGET (Multi-tenant)
 *
 * Multi-tenant logik:
 * 1. Læser window.location.hostname (f.eks. "napoli.getmait.dk")
 * 2. Ekstraher slug'en (f.eks. "napoli")
 * 3. Fetch store data fra Supabase baseret på slug
 * 4. Anvend branding (primary_color, name, phone)
 * 5. Send beskeder til n8n med store_id
 *
 * VIGTIGT: Sæt environment variables i din .env fil:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 * - VITE_N8N_CHAT_WEBHOOK
 */

const ChatWidget = () => {
  // --- KONFIGURATION (Hentes fra environment variables) ---
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const N8N_CHAT_WEBHOOK = import.meta.env.VITE_N8N_CHAT_WEBHOOK;

  // --- STATE ---
  const [isOpen, setIsOpen] = useState(false);
  const [store, setStore] = useState(null);
  const [isLoadingStore, setIsLoadingStore] = useState(true);
  const [storeError, setStoreError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  /**
   * MULTI-TENANT LOGIK
   * Ekstraherer slug fra hostname og fetcher store data
   */
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        // 1. Læs hostname (f.eks. "napoli.getmait.dk" eller "napoli-esbjerg.getmait.dk")
        const hostname = window.location.hostname;

        // 2. Ekstrahér slug (første del før .getmait.dk)
        // For localhost/development: brug default slug eller specificer i URL params
        let slug = 'napoli-esbjerg'; // Default for development

        if (hostname.includes('getmait.dk')) {
          slug = hostname.split('.getmait.dk')[0];
        } else if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
          // For local development: Check URL params
          const urlParams = new URLSearchParams(window.location.search);
          slug = urlParams.get('store') || 'napoli-esbjerg';
        }

        console.log('[GetMait Widget] Detected slug:', slug);

        // 3. Fetch store data fra Supabase
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/stores?slug=eq.${slug}&select=id,name,primary_color,contact_phone,city&is_open=eq.true`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 4. Valider at vi fandt en butik
        if (!data || data.length === 0) {
          throw new Error(`Kunne ikke finde restaurant med slug: ${slug}`);
        }

        const storeData = data[0];
        setStore(storeData);

        // 5. Sæt velkomstbesked med restaurantens navn
        setMessages([
          {
            role: 'assistant',
            content: `Hejsa! Jeg er din personlige AI-Mait her hos ${storeData.name}. 🍕 Hvad drømmer din mave om i dag, Mait? Jeg er klar til at hjælpe dig med din bestilling direkte her i chatten!`
          }
        ]);

        setIsLoadingStore(false);
      } catch (error) {
        console.error('[GetMait Widget] Error fetching store:', error);
        setStoreError(error.message);
        setIsLoadingStore(false);
      }
    };

    fetchStoreData();
  }, [SUPABASE_URL, SUPABASE_ANON_KEY]);

  /**
   * Auto-scroll til bunden når nye beskeder kommer
   */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  /**
   * Send besked til n8n webhook
   * VIGTIGT: Inkluderer store_id så n8n ved hvilket menukort der skal bruges
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !store) return;

    // Tilføj brugerens besked til chat
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Send til n8n webhook med store_id
      const response = await fetch(N8N_CHAT_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: currentInput,
          store_id: store.id,        // VIGTIGT: Så n8n ved hvilken restaurant
          store_name: store.name,     // Ekstra kontekst
          source: 'web_chat',         // Kilde-identifikation
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Tilføj n8n's svar til chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.output || data.message || "Modtaget! Jeg sender din bestilling til køkkenet nu."
      }]);
    } catch (error) {
      console.error('[GetMait Widget] Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Hov, Mait! Jeg mistede forbindelsen til ovnen. Prøv venligst igen eller giv os et kald på " + store.contact_phone
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * LOADING STATE
   * Vises mens vi henter store data
   */
  if (isLoadingStore) {
    return (
      <div className="fixed bottom-8 right-8 z-50">
        <div className="bg-white p-4 rounded-2xl shadow-lg flex items-center gap-3">
          <div className="animate-spin">
            <Sparkles className="text-orange-500" size={20} />
          </div>
          <span className="text-sm text-slate-600 font-medium">Indlæser GetMait...</span>
        </div>
      </div>
    );
  }

  /**
   * ERROR STATE
   * Vises hvis vi ikke kunne finde restauranten
   */
  if (storeError || !store) {
    return (
      <div className="fixed bottom-8 right-8 z-50">
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl shadow-lg max-w-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm font-semibold text-red-800">Kunne ikke indlæse chat</p>
              <p className="text-xs text-red-600 mt-1">{storeError || 'Ukendt fejl'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * HOVEDKOMPONENT
   * Floating Action Button + Chat Widget
   */
  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* CHAT KNAP (FAB) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: store.primary_color }}
          className="p-5 rounded-full shadow-[0_15px_50px_rgba(0,0,0,0.3)] text-white hover:scale-110 active:scale-95 transition-all flex items-center justify-center animate-bounce-slow border-4 border-white"
          aria-label="Åbn chat"
        >
          <div className="relative">
            <MessageSquare size={32} />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white"></span>
            </span>
          </div>
        </button>
      )}

      {/* CHAT VINDUE */}
      {isOpen && (
        <div className="bg-white w-[360px] sm:w-[420px] h-[680px] max-h-[85vh] rounded-[3rem] shadow-[0_25px_70px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden border border-white transition-all transform animate-in fade-in zoom-in duration-300">

          {/* HEADER MED RESTAURANTENS BRANDING */}
          <div
            style={{ backgroundColor: store.primary_color }}
            className="p-8 text-white flex justify-between items-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 scale-150">
              <Utensils size={100} />
            </div>

            <div className="flex items-center gap-4 relative z-10">
              <div className="bg-white text-slate-900 p-3.5 rounded-2xl shadow-2xl">
                <Sparkles size={24} className="text-orange-500" />
              </div>
              <div>
                <h3 className="font-black text-2xl leading-none tracking-tighter uppercase italic">{store.name}</h3>
                {store.city && (
                  <p className="text-xs opacity-75 mt-0.5">{store.city}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(74,222,128,1)]"></span>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-90 text-white">Din personlige Mait</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-full transition-all relative z-10"
              aria-label="Luk chat"
            >
              <X size={24} />
            </button>
          </div>

          {/* KONTAKT BAR (DYNAMISK FRA SUPABASE) */}
          <div className="bg-slate-50 px-6 py-5 flex justify-around border-b border-slate-100 shadow-inner">
            <a
              href={`tel:${store.contact_phone}`}
              className="flex flex-col items-center gap-1.5 group"
              aria-label={`Ring til ${store.name}`}
            >
              <div className="bg-white p-3 rounded-xl shadow-sm group-hover:bg-green-50 group-active:scale-90 transition-all">
                <Phone size={18} className="text-slate-400 group-hover:text-green-600" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600">Ring</span>
            </a>
            <a
              href={`sms:${store.contact_phone}`}
              className="flex flex-col items-center gap-1.5 group"
              aria-label={`Send SMS til ${store.name}`}
            >
              <div className="bg-white p-3 rounded-xl shadow-sm group-hover:bg-blue-50 group-active:scale-90 transition-all">
                <MessageCircle size={18} className="text-slate-400 group-hover:text-blue-600" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600">SMS</span>
            </a>
            <div className="flex flex-col items-center gap-1.5">
              <div className="bg-red-50 p-3 rounded-xl shadow-sm border border-red-100 animate-pulse">
                <Sparkles size={18} className="text-red-600" />
              </div>
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Chat-ordre</span>
            </div>
          </div>

          {/* BESKED HISTORIK */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/20"
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-[2rem] text-[15px] leading-relaxed shadow-sm transition-all ${
                  msg.role === 'user'
                    ? 'bg-slate-800 text-white rounded-tr-none translate-x-0'
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none font-medium'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* "MAITEN TÆNKER..." INDIKATOR */}
            {isLoading && (
              <div className="flex justify-start animate-in slide-in-from-left duration-300">
                <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 rounded-tl-none flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span className="text-xs text-slate-400 font-bold italic">Maiten tænker...</span>
                </div>
              </div>
            )}
          </div>

          {/* INPUT OMRÅDE */}
          <div className="p-6 bg-white border-t border-slate-100">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hvad skal vi sætte i ovnen, Mait?"
                className="flex-1 bg-slate-100 border-none rounded-2xl px-6 py-5 text-sm focus:ring-2 focus:ring-red-600 transition-all outline-none font-medium placeholder:text-slate-400 shadow-inner"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{ backgroundColor: store.primary_color }}
                className="p-4 text-white rounded-2xl hover:opacity-90 disabled:opacity-30 transition-all shadow-2xl active:scale-95 flex items-center justify-center min-w-[60px]"
                aria-label="Send besked"
              >
                <Send size={24} />
              </button>
            </form>
            <div className="flex items-center justify-center gap-1.5 mt-5">
              <p className="text-[10px] text-slate-300 font-black tracking-[0.3em] uppercase">
                Powered by GetMait
              </p>
              <Sparkles size={10} className="text-orange-300" />
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM STYLES */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoom-in {
          from { transform: scale(0.95); }
          to { transform: scale(1); }
        }
        .animate-in {
          animation: fade-in 0.3s ease-out, zoom-in 0.3s ease-out;
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
};

export default ChatWidget;
