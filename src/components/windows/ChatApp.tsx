import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

type Message = {
  id: number;
  sender: 'me' | 'partner';
  text: string;
};

export const ChatApp: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'partner', text: '你终于来了，我还以为你把密码忘了呢。' },
    { id: 2, sender: 'partner', text: '今天过得好吗？' }
  ]);
  const [step, setStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const script = [
    {
      options: ['一直在想你呀', '今天有点累...'],
      replies: [
        ['我也想你。TT', '可以打开 Memories.exe 看看我们的回忆吧。'],
        ['辛苦啦。宝宝我心疼你...', '去地图里看看我们去过的地方，会不会开心点？']
      ],
      nextPrompt: '其实，我偷偷在这个系统里藏了一句话。'
    },
    {
      options: ['是什么呀？', '快告诉我！'],
      replies: [
        ['在这个随时会断线的世界里，只有你是我永远的存档。'],
        ['在这个随时会断线的世界里，只有你是我永远的存档。']
      ],
      nextPrompt: '晚安，宝宝。记得常回来看看。'
    }
  ];

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isExpanded]);

  const handleOption = (optIndex: number, text: string) => {
    if (isTyping) return;
    
    // Add my message
    setMessages(prev => [...prev, { id: Date.now(), sender: 'me', text }]);
    setIsTyping(true);

    // Simulate network/typing delay
    setTimeout(() => {
      const replies = script[step].replies[optIndex];
      const newMsgs = replies.map((r, i) => ({ id: Date.now() + i + 1, sender: 'partner', text: r } as Message));
      
      setMessages(prev => [...prev, ...newMsgs]);

      // Add follow up prompt if it exists
      setTimeout(() => {
        if (script[step].nextPrompt) {
          setMessages(prev => [...prev, { id: Date.now() + 10, sender: 'partner', text: script[step].nextPrompt! }]);
        }
        setIsTyping(false);
        setStep(prev => prev + 1);
      }, 1500);

    }, 1000);
  };

  if (!isExpanded) {
    return (
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-[32px] left-4 z-[90] win-bevel-out w-56 cursor-pointer hover:brightness-105 active:win-bevel-in"
        onClick={() => setIsExpanded(true)}
      >
        <div className="h-[22px] u-dream-title flex items-center px-1 border border-white/40">
          <MessageSquare size={12} className="text-white ml-1" />
          <span className="ml-1 font-bold text-[11px] text-white truncate" style={{ fontFamily: 'MS Sans Serif, Tahoma' }}>CHAT WITH ME - 点击展开</span>
          <div className="ml-auto flex gap-[2px]">
            <div className="win-btn win-title-btn">_</div>
            <div className="win-btn win-title-btn">□</div>
            <div className="win-btn win-title-btn"><span className="mt-[1px] ml-[1px]">✕</span></div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      drag
      dragMomentum={false}
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      className="fixed bottom-[32px] left-4 z-[90] win-bevel-out w-[300px] h-[400px] flex flex-col p-[3px] shadow-2xl"
    >
      {/* Title Bar */}
      <div className="h-[22px] u-dream-title flex items-center px-1 flex-shrink-0 cursor-grab active:cursor-grabbing">
        <MessageSquare size={12} className="text-white ml-1" />
        <span className="ml-1 font-bold text-white text-[11px]" style={{ fontFamily: 'MS Sans Serif, Tahoma' }}>MSN - Chat_Room.exe</span>
        <div className="ml-auto flex gap-[2px]">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="win-btn win-title-btn"
          >
            _
          </button>
          <button className="win-btn win-title-btn" onPointerDown={(e) => e.stopPropagation()}>□</button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="win-btn win-title-btn"
          >
            <span className="mt-[1px] ml-[1px]">✕</span>
          </button>
        </div>
      </div>

      {/* Menu Bar */}
      <div 
        onPointerDown={(e) => e.stopPropagation()}
        className="flex gap-2 p-[2px] border-b border-[var(--win-dark-gray)] flex-shrink-0 text-xs text-black bg-[var(--win-gray)]" 
        style={{ fontFamily: 'MS Sans Serif' }}
      >
        <span className="px-1.5 u-dream-hover cursor-pointer underline decoration-transparent hover:decoration-white underline-offset-2">文件(F)</span>
        <span className="px-1.5 u-dream-hover cursor-pointer underline decoration-transparent hover:decoration-white underline-offset-2">编辑(E)</span>
        <span className="px-1.5 u-dream-hover cursor-pointer underline decoration-transparent hover:decoration-white underline-offset-2">查看(V)</span>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        onPointerDown={(e) => e.stopPropagation()}
        className="flex-1 win-bevel-in bg-white m-[2px] p-2 overflow-y-auto font-yuyuan text-[14px] leading-relaxed flex flex-col gap-2 custom-scrollbar"
      >
        <div className="text-center text-gray-500 font-bold text-[10px] mb-2 border-b border-[#808080] pb-1" style={{ fontFamily: 'MS Sans Serif' }}>
          --- Connection Established ---<br/>
          {new Date().toLocaleDateString()}
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, x: msg.sender === 'me' ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex flex-col max-w-[85%] ${msg.sender === 'me' ? 'self-end items-end' : 'self-start items-start'}`}
            >
              <span className="text-[10px] text-gray-500 font-bold mb-[1px]" style={{ fontFamily: 'MS Sans Serif' }}>
                {msg.sender === 'me' ? 'Me' : 'Partner'}
              </span>
              <div className={`px-2 py-1 font-yuyuan text-[13px] border ${msg.sender === 'me' ? 'bg-[#dce6f2] border-[var(--win-dark-gray)] text-[var(--dream-accent)] shadow-[1px_1px_0_#fff_inset]' : 'bg-white border-transparent text-[#2a5f7a] font-bold'}`}>
                {msg.sender === 'partner' ? `> ${msg.text}` : msg.text}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="self-start text-[#2a5f7a] font-bold text-[12px] animate-pulse mt-1" style={{ fontFamily: 'MS Sans Serif' }}
            >
              &gt; 对方正在输入...
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interaction Area */}
      <div 
        onPointerDown={(e) => e.stopPropagation()}
        className="h-24 bg-[var(--win-gray)] flex flex-col p-[2px] gap-[2px] flex-shrink-0 border-t border-[var(--win-dark-gray)]"
      >
        <div className="font-bold text-[11px] text-black px-1 mb-[2px]" style={{ fontFamily: 'MS Sans Serif, Tahoma' }}>
          {step < script.length ? "请选择回复:" : "会话已结束."}
        </div>
        <div className="flex flex-col gap-[2px] overflow-y-auto custom-scrollbar pr-1">
          {step < script.length ? (
            script[step].options.map((opt, idx) => (
              <button
                key={idx}
                disabled={isTyping}
                onClick={() => handleOption(idx, opt)}
                className="win-btn font-yuyuan text-[13px] py-1 px-2 text-left w-full justify-start font-normal disabled:opacity-50 disabled:cursor-wait"
              >
                {opt}
              </button>
            ))
          ) : (
            <div className="win-bevel-in bg-white h-full flex items-center justify-center text-gray-500 font-bold text-[11px]" style={{ fontFamily: 'MS Sans Serif' }}>
              [ Connection Saved ]
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};