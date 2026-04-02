"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  Sparkles,
  Loader2,
  Download,
  RotateCcw,
  Plus,
  MessageSquare,
  Search,
  Calendar,
  Settings,
  Grid,
  FileText,
  Trash2,
  ArrowUp,
  Image as ImageIcon,
  MoreHorizontal,
  ChevronLeft,
  Share2,
  Copy,
  Check,
} from "lucide-react"

interface GeneratedItem {
  id: string
  type: "image" | "chat"
  title: string
  prompt: string
  url: string        // blob URL for images, empty for chat
  response: string   // text response for chat, empty for images
  timestamp: Date
}

export default function NewtonFusionWorkspace() {
  const [prompt, setPrompt] = useState("")
  const [items, setItems] = useState<GeneratedItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeCategory, setActiveCategory] = useState<"image" | "chat">("image")
  const [activeItem, setActiveItem] = useState<GeneratedItem | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-select first item
  useEffect(() => {
    if (items.length > 0 && !activeItem) {
      setActiveItem(items[0])
    }
  }, [items, activeItem])

  // Scroll to bottom when generating chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeItem?.response, isGenerating])

  const generate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return

    setIsGenerating(true)
    setError(null)
    const currentPrompt = prompt.trim()
    const currentCategory = activeCategory
    setPrompt("")

    try {
      if (currentCategory === "image") {
        // Image generation (Classic Blocked Logic)
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: currentPrompt }),
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || "Image generation failed")
        }

        const blob = await response.blob()
        const imageUrl = URL.createObjectURL(blob)

        const newItem: GeneratedItem = {
          id: crypto.randomUUID(),
          type: "image",
          title: currentPrompt.slice(0, 30),
          prompt: currentPrompt,
          url: imageUrl,
          response: "",
          timestamp: new Date(),
        }

        setItems((prev) => [newItem, ...prev])
        setActiveItem(newItem)
      } else {
        // Chat generation (Streaming Logic)
        const response = await fetch("/api/generate-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: currentPrompt }),
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || "Text generation failed")
        }

        // 1. Create the initial item
        const itemId = crypto.randomUUID()
        const initialItem: GeneratedItem = {
          id: itemId,
          type: "chat",
          title: currentPrompt.slice(0, 30),
          prompt: currentPrompt,
          url: "",
          response: "",
          timestamp: new Date(),
        }

        setItems((prev) => [initialItem, ...prev])
        setActiveItem(initialItem)

        // 2. Consume the stream
        const reader = response.body?.getReader()
        if (!reader) return

        const decoder = new TextDecoder()
        let streamingText = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          streamingText += chunk

          // Update the array and active item
          setItems((prev) => 
            prev.map((item) => 
              item.id === itemId ? { ...item, response: streamingText } : item
            )
          )
          setActiveItem((prev) => 
            prev?.id === itemId ? { ...prev, response: streamingText } : prev
          )
        }
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, isGenerating, activeCategory])

  const handleDownload = useCallback((url: string, title: string) => {
    const a = document.createElement("a")
    a.href = url
    a.download = `newtonfusion-${title.replace(/\s+/g, "-").toLowerCase()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [])

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* 1. Far-Left Sidebar: Icon Nav */}
      <aside className="w-16 flex flex-col items-center py-6 gap-6 sidebar-acrylic">
        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <Sparkles className="h-5 w-5" />
        </div>
        
        <nav className="flex flex-col gap-4 flex-1 mt-4">
          <button className="p-2.5 rounded-xl bg-primary/10 text-primary transition-all active:scale-95 cursor-pointer">
            <MessageSquare className="h-5 w-5" />
          </button>
          <button className="p-2.5 rounded-xl text-foreground/40 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer">
            <Search className="h-5 w-5" />
          </button>
          <button className="p-2.5 rounded-xl text-foreground/40 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer">
            <Calendar className="h-5 w-5" />
          </button>
          <button className="p-2.5 rounded-xl text-foreground/40 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer">
            <FileText className="h-5 w-5" />
          </button>
        </nav>

        <div className="flex flex-col gap-4 mb-2">
          <button className="p-2.5 rounded-xl text-foreground/40 hover:text-primary transition-all cursor-pointer">
            <Settings className="h-5 w-5" />
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-black/5 shrink-0">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </aside>

      {/* 2. Middle Panel: History */}
      <aside className={`w-80 flex flex-col bg-white/30 backdrop-blur-3xl transition-all ${sidebarCollapsed ? 'translate-x-[-100%] w-0' : ''}`}>
        <div className="p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Results</h2>
          <button className="p-1.5 hover:bg-black/5 rounded-lg text-foreground/40 cursor-pointer">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-8 scrollbar-hide pb-20">
          <div className="space-y-4">
            <span className="px-2 text-xs font-semibold text-foreground/30 uppercase tracking-widest">Today</span>
            
            {items.length === 0 && (
              <div className="p-4 rounded-3xl border border-dashed border-black/5 text-center space-y-2 opacity-50">
                <Grid className="h-4 w-4 mx-auto" />
                <p className="text-[10px]">No results yet</p>
              </div>
            )}

            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveItem(item)}
                className={`w-full group relative text-left transition-all text-xs border border-transparent ${activeItem?.id === item.id ? 'scale-[0.98]' : ''} cursor-pointer`}
              >
                <div className={`p-4 rounded-[2.5rem] card-squircle space-y-3 transition-shadow ${activeItem?.id === item.id ? 'ring-2 ring-primary/20 shadow-xl' : 'hover:shadow-md'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${item.type === 'image' ? 'bg-violet-500/10 text-violet-500' : 'bg-primary/10 text-primary'}`}>
                        {item.type === 'image' ? <ImageIcon className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                      </div>
                      <span className="font-medium text-foreground/70">{item.type === 'image' ? 'Image' : 'Chat'}</span>
                    </div>

                  </div>

                  {item.type === 'image' ? (
                    <div className="relative aspect-square rounded-[1.8rem] overflow-hidden bg-black/5">
                      <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/20 to-transparent">
                         <span className="text-[10px] text-white/90 truncate block">{item.prompt}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="px-2 py-1.5">
                      <p className="text-[10px] text-foreground/50 line-clamp-2">{item.prompt}</p>
                      <p className="text-[10px] text-foreground/30 mt-1 line-clamp-2 italic">{item.response.slice(0, 80)}…</p>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-4 pt-4">
            <span className="px-2 text-xs font-semibold text-foreground/30 uppercase tracking-widest">Yesterday</span>
            <div className="p-5 rounded-[2.5rem] bg-white/20 border border-black/5 opacity-50 space-y-2">
               <div className="h-2 w-20 bg-black/10 rounded-full" />
               <div className="h-2 w-12 bg-black/10 rounded-full" />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-black/5 flex items-center justify-between">
           <button onClick={() => setSidebarCollapsed(true)} className="p-2 hover:bg-black/5 rounded-xl transition-all cursor-pointer">
              <ChevronLeft className="h-4 w-4 text-foreground/40" />
           </button>
           <Trash2 onClick={() => { setItems([]); setActiveItem(null); }} className="h-4 w-4 text-foreground/20 hover:text-destructive cursor-pointer transition-colors" />
        </div>
      </aside>

      {/* 3. Main content area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="px-8 py-6 flex items-center justify-between z-10">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight">NewtonFusion</h1>

          </div>
          
          <div className="flex items-center gap-3">
          </div>
        </header>

        {/* Dynamic content view */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-10 pb-40 scroll-smooth">
          {activeItem ? (
            <div className="max-w-3xl mx-auto space-y-8 animate-reveal py-10" key={activeItem.id}>
              {/* Prompt bubble (user message) */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-foreground/40">You</span>
                </div>
                <div className="flex-1 pt-1">
                   <p className="text-sm text-foreground/80 leading-relaxed">{activeItem.prompt}</p>
                   <span className="text-[10px] text-foreground/20 mt-1 block">{activeItem.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Response */}
              <div className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activeItem.type === 'image' ? 'bg-violet-500/10' : 'bg-primary/10'}`}>
                  <Sparkles className={`h-4 w-4 ${activeItem.type === 'image' ? 'text-violet-500' : 'text-primary'}`} />
                </div>
                <div className="flex-1">
                  {activeItem.type === 'image' ? (
                    <>
                      <div className="rounded-[2rem] overflow-hidden border border-white shadow-2xl shadow-indigo-500/10 bg-white">
                        <img src={activeItem.url} alt="Result" className="w-full h-auto" />
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <button 
                          onClick={() => handleDownload(activeItem.url, activeItem.title)}
                          className="p-2.5 rounded-xl bg-black text-white hover:bg-black/90 cursor-pointer transition-all text-xs flex items-center gap-2"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </button>
                        <button className="p-2.5 rounded-xl bg-black/5 hover:bg-black/10 cursor-pointer transition-all text-xs flex items-center gap-2">
                          <RotateCcw className="h-3.5 w-3.5 text-foreground/60" />
                          Regenerate
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-[2rem] bg-white border border-black/5 p-6 shadow-lg shadow-black/[0.02] min-h-[100px] relative">
                         {activeItem.response ? (
                            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap animate-reveal">{activeItem.response}</p>
                         ) : (
                            <div className="flex gap-1.5 py-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                            </div>
                         )}
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <button 
                          onClick={() => handleCopy(activeItem.response)}
                          className="p-2.5 rounded-xl bg-black/5 hover:bg-black/10 cursor-pointer transition-all text-xs flex items-center gap-2"
                        >
                          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-foreground/60" />}
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button className="p-2.5 rounded-xl bg-black/5 hover:bg-black/10 cursor-pointer transition-all text-xs flex items-center gap-2">
                          <RotateCcw className="h-3.5 w-3.5 text-foreground/60" />
                          Regenerate
                        </button>
                      </div>
                    </>
                  )}

                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-30 text-center animate-reveal">
               <div className="w-20 h-20 rounded-[2.5rem] bg-black/5 flex items-center justify-center">
                  <Plus className="h-10 w-10 text-foreground/30" />
               </div>
               <p className="text-sm font-medium">Start a new fusion below</p>
            </div>
          )}
        </div>

        {/* Loading Overlay (Only for Images) */}
        {isGenerating && activeCategory === 'image' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/50 backdrop-blur-sm animate-reveal">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-14 w-14 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground/70">Generating image…</p>
                <p className="text-[10px] text-foreground/30 mt-1">This may take 10–30 seconds</p>
              </div>
            </div>
          </div>
        )}

        {/* Floating Bottom Input Area */}
        <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col items-center pointer-events-none z-20">
          <div className="w-full max-w-2xl space-y-3 pointer-events-auto">
             <div className="flex justify-center gap-3 animate-reveal">
                {['Images', 'Chat'].map((cat) => {
                  const isImg = cat === 'Images';
                  const active = (isImg && activeCategory === 'image') || (!isImg && activeCategory === 'chat');
                  return (
                    <button 
                      key={cat} 
                      onClick={() => {
                        setActiveCategory(isImg ? 'image' : 'chat');
                        textareaRef.current?.focus();
                      }}
                      className={`px-4 py-2 rounded-2xl backdrop-blur-md border text-[10px] font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                        active 
                        ? 'bg-primary text-white border-primary/20' 
                        : 'bg-white/40 border-white/60 text-foreground/60 hover:bg-white hover:text-primary hover:border-primary/20'
                      }`}
                    >
                      {isImg ? <ImageIcon className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                      {cat}
                    </button>
                  );
                })}
             </div>

             <div className="relative input-floating rounded-[2.5rem] p-2 pr-4 flex items-center gap-2 w-full animate-reveal" style={{ animationDelay: '0.1s' }}>
                {activeCategory === 'image' && (
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 pointer-events-none animate-reveal">
                    <div className="command-badge animate-rainbow">
                      <ImageIcon className="h-3 w-3 text-primary" />
                      <span className="rainbow-text uppercase">/image</span>
                    </div>
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith('/image')) {
                      setActiveCategory('image');
                      setPrompt(val.replace(/^\/image\s*/, ''));
                    } else {
                      setPrompt(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      generate();
                    }
                    if (e.key === 'Backspace' && prompt === '' && activeCategory === 'image') {
                      setActiveCategory('chat');
                    }
                  }}
                  placeholder={activeCategory === 'image' ? "Describe your vision..." : "Ask me anything..."}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-4 px-6 resize-none h-14 selection:bg-primary/20 transition-all duration-300"
                  style={{ paddingLeft: activeCategory === 'image' ? '115px' : '24px' }}
                />
                
                <button 
                  onClick={generate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg group cursor-pointer"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-5 w-5 group-hover:translate-y-[-2px] transition-transform" />}
                </button>
             </div>
             
             <p className="text-[10px] text-center text-foreground/20 font-medium">
               {activeCategory === 'image' ? 'Press Enter to Generate' : 'Press Enter to Chat'}
             </p>
          </div>
        </div>

        {error && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 animate-reveal">
            <div className="bg-destructive/10 border border-destructive/20 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl shadow-destructive/10">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              <p className="text-[10px] font-bold text-destructive tracking-tight">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="ml-2 hover:opacity-60 transition-opacity p-0.5"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
