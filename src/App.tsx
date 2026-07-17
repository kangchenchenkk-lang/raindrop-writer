import React, { useState, useRef } from 'react';
import { RainSettings, BackgroundPreset, PresetId } from './types';
import RainCanvas from './components/RainCanvas';
import SidebarSettings, { FONTS_LIST } from './components/SidebarSettings';
import HistoryDrawer, { SavedInspiration } from './components/HistoryDrawer';
import { toPng } from 'html-to-image';
import { 
  Sliders, 
  X, 
  Trash2, 
  Check, 
  Eye, 
  EyeOff, 
  BookOpenCheck,
  Smile,
  ChevronRight,
  Plus,
  History,
  Share2,
  Download,
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  CloudRain,
  Flame,
  Bird,
  Bug,
  Waves,
  Droplet,
  Coffee,
  Keyboard,
  Disc
} from 'lucide-react';

const PRESETS: BackgroundPreset[] = [
  {
    id: 'soft-pink',
    name: '温柔粉黛 (Soft Pink)',
    color1: '#FCF7F7',
    color2: '#F4DDE2',
    description: '如樱花雨落般的温柔少女粉'
  },
  {
    id: 'default-fluid',
    name: '经典流体 (Oceanic)',
    color1: '#070814',
    color2: '#270c35',
    description: '迷幻深紫与星空幽邃交融'
  },
  {
    id: 'warm-sunset',
    name: '暖阳落日 (Sunset)',
    color1: '#1a0b2e',
    color2: '#bd1b8a',
    description: '如雨中霓虹般的迷朦橘粉'
  },
  {
    id: 'neon-cyberpunk',
    name: '赛博雨夜 (Cyberpunk)',
    color1: '#03001e',
    color2: '#ec38bc',
    description: '高反差荧光蓝粉与都市流光'
  },
  {
    id: 'deep-sea',
    name: '幽蓝深海 (Deep Ocean)',
    color1: '#051319',
    color2: '#122c36',
    description: '静谧神秘的暗绿蓝深海域'
  },
  {
    id: 'forest-mist',
    name: '林深见鹿 (Sage Forest)',
    color1: '#0b262a',
    color2: '#417256',
    description: '雨后湿润的森林苔藓绿'
  }
];

export default function App() {
  // --- Text Editor & Document State ---
  const [noteTitle, setNoteTitle] = useState<string>('脑海里刚刚闪过什么?');
  const [inspirationText, setInspirationText] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [toastMessage, setToastMessage] = useState<string>('');

  // --- Rain Shader Settings ---
  const [rainSettings, setRainSettings] = useState<RainSettings>({
    rainAmount: 0.8, // 80%
    mistDensity: 0.0, // 0%
    refraction: 1.0, // 100%
    zoom: 0.3, // 30%
    speed: 2.5, // 2.5x
    hasHeart: false,
    heartProgress: 0.0,
  });

  // --- Background Preset State ---
  const [activePresetId, setActivePresetId] = useState<PresetId>('soft-pink');
  const activePreset = PRESETS.find(p => p.id === activePresetId) || PRESETS[0];

  // --- Custom Media Upload State ---
  const [customMedia, setCustomMedia] = useState<{
    type: 'image' | 'video' | null;
    url: string | null;
    name: string | null;
    rotation: number;
    flipH: boolean;
    flipV: boolean;
  }>({
    type: null,
    url: null,
    name: null,
    rotation: 0,
    flipH: false,
    flipV: false,
  });

  // --- White Noise CD & Player State ---
  const INITIAL_NATIVE_SOUNDS = [
    { id: 'rain', name: '沙沙雨声', url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg', isPlaying: false, volume: 0.5, icon: 'CloudRain' },
    { id: 'campfire', name: '劈啪篝火', url: 'https://actions.google.com/sounds/v1/ambiences/fireplace_crackling.ogg', isPlaying: false, volume: 0.4, icon: 'Flame' },
    { id: 'birds', name: '森林鸟鸣', url: 'https://actions.google.com/sounds/v1/animals/morning_birds.ogg', isPlaying: false, volume: 0.3, icon: 'Bird' },
    { id: 'crickets', name: '夏夜虫鸣', url: 'https://actions.google.com/sounds/v1/animals/crickets_chirping.ogg', isPlaying: false, volume: 0.3, icon: 'Bug' },
    { id: 'waves', name: '幽邃海浪', url: 'https://actions.google.com/sounds/v1/water/sea_waves.ogg', isPlaying: false, volume: 0.4, icon: 'Waves' },
    { id: 'stream', name: '山谷溪流', url: 'https://actions.google.com/sounds/v1/water/creek_flowing.ogg', isPlaying: false, volume: 0.3, icon: 'Droplet' },
    { id: 'cafe', name: '舒适咖啡', url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop_ambience.ogg', isPlaying: false, volume: 0.3, icon: 'Coffee' },
    { id: 'keyboard', name: '专注键盘', url: 'https://actions.google.com/sounds/v1/office/keyboard_typing.ogg', isPlaying: false, volume: 0.3, icon: 'Keyboard' },
  ];

  const [pos, setPos] = useState(() => {
    const saved = localStorage.getItem('white_noise_cd_position');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      } catch (e) {}
    }
    return { x: 24, y: 24 }; // Default top-left position
  });

  const [isNoiseExpanded, setIsNoiseExpanded] = useState(() => {
    const saved = localStorage.getItem('white_noise_expanded');
    return saved === 'true'; // Default collapsed
  });

  const [noiseTab, setNoiseTab] = useState<'native' | 'online'>('native');

  const [nativeSounds, setNativeSounds] = useState(() => {
    const saved = localStorage.getItem('white_noise_native_sounds');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return INITIAL_NATIVE_SOUNDS.map(initial => {
            const match = parsed.find((p: any) => p.id === initial.id);
            return match ? { ...initial, isPlaying: match.isPlaying, volume: match.volume } : initial;
          });
        }
      } catch (e) {}
    }
    return INITIAL_NATIVE_SOUNDS;
  });

  const audioPlayersRef = useRef<{ [key: string]: HTMLAudioElement }>({});
  const dragRef = useRef<{ isDragging: boolean; startX: number; startY: number; posX: number; posY: number }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    posX: 24,
    posY: 24,
  });
  const dragDistanceRef = useRef(0);

  // --- UI Controls State ---
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [hideUI, setHideUI] = useState<boolean>(false);

  // --- Active Font State ---
  const [activeFontId, setActiveFontId] = useState<string>('font-sans');
  const activeFont = FONTS_LIST.find(f => f.id === activeFontId) || FONTS_LIST[0];

  // --- Live Edit/Preview and Sharing State ---
  const [editMode, setEditMode] = useState<'edit' | 'preview'>('edit');
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [activeShareBgId, setActiveShareBgId] = useState<string>('parchment-cat');
  const [shareCardTheme, setShareCardTheme] = useState<'light' | 'dark'>('light');

  const SHARE_BACKGROUNDS = [
    { id: 'parchment-cat', name: '极简暖杏', bgClass: 'bg-[#fdfbf7]', textColor: 'text-[#4c2c31]' },
    { id: 'winter-story', name: '冬日物语', bgClass: 'bg-[#81b3df]', textColor: 'text-[#1c4d80]' },
    { id: 'summer-breeze', name: '夏日微风', bgClass: 'bg-[#ddd264]', textColor: 'text-[#333d11]' },
    { id: 'tiny-type', name: '手写便签', bgClass: 'bg-[#fdfcf7]', textColor: 'text-[#1B365D]' },
  ];

  // Markdown parsing helper functions
  const renderInlineMarkdown = (text: string, isLight: boolean = false) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className={`font-semibold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const parseMarkdown = (text: string, isLight: boolean = false) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className={`text-xl sm:text-2xl font-bold mb-3 mt-4 tracking-wide ${isLight ? 'text-[#1B365D]' : 'text-[#E5A7B8]'}`} style={{ fontFamily: activeFont.family }}>
            {renderInlineMarkdown(line.substring(2), isLight)}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className={`text-base sm:text-lg font-medium mb-2.5 mt-3.5 tracking-normal ${isLight ? 'text-zinc-700' : 'text-white/80'}`} style={{ fontFamily: activeFont.family }}>
            {renderInlineMarkdown(line.substring(3), isLight)}
          </h2>
        );
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={index} className={`pl-4 border-l-[1.5px] italic font-light my-3.5 leading-relaxed ${isLight ? 'border-[#1B365D]/30 text-zinc-600/90' : 'border-[#E5A7B8]/40 text-stone-300/90'}`}>
            {renderInlineMarkdown(line.substring(2), isLight)}
          </blockquote>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <ul key={index} className={`list-disc pl-5 mb-1.5 ${isLight ? 'text-zinc-700' : 'text-white/80'}`}>
            <li className="text-sm sm:text-base leading-relaxed font-light">
              {renderInlineMarkdown(line.substring(2), isLight)}
            </li>
          </ul>
        );
      }
      if (line.trim() === '') {
        return <div key={index} className="h-2" />;
      }
      return (
        <p key={index} className={`text-sm sm:text-base leading-relaxed mb-2 font-light ${isLight ? 'text-zinc-800/90' : 'text-white/85'}`}>
          {renderInlineMarkdown(line, isLight)}
        </p>
      );
    });
  };

  const renderThemeParagraphs = (text: string, styleClass: string, isHandwriting: boolean = false, title?: string) => {
    const elements: React.ReactNode[] = [];
    
    if (title && title.trim()) {
      elements.push(
        <p
          key="card-body-title"
          className={`text-base sm:text-lg font-bold tracking-wide mb-4 ${styleClass} ${
            isHandwriting ? 'border-[#dfd9cd]/50 border-b border-dashed pb-2' : ''
          }`}
          style={{ letterSpacing: '0.04em' }}
        >
          {title}
        </p>
      );
    }

    if (text) {
      const lines = text.split('\n');
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed === '') {
          elements.push(<div key={`empty-${index}`} className="h-2" />);
          return;
        }
        
        const isAttribution = trimmed.startsWith('/');
        if (isAttribution) {
          elements.push(
            <p 
              key={`attr-${index}`} 
              className={`text-xs sm:text-sm font-light italic mt-6 opacity-80 ${styleClass} text-right`}
              style={{ letterSpacing: '0.04em' }}
            >
              {line}
            </p>
          );
          return;
        }

        elements.push(
          <p 
            key={`p-${index}`} 
            className={`text-sm sm:text-base leading-relaxed font-normal tracking-wide ${styleClass} ${
              isHandwriting ? 'border-[#dfd9cd]/50 border-b border-dashed pb-2 mb-3' : 'mb-3'
            }`}
            style={{ letterSpacing: '0.03em' }}
          >
            {renderInlineMarkdown(line, true)}
          </p>
        );
      });
    }

    return elements;
  };

  const renderCard = (bgId: string, isExport: boolean = false) => {
    const now = new Date();
    const yearShortStr = now.getFullYear().toString().slice(2);
    const yearCenturyStr = now.getFullYear().toString().slice(0, 2);
    const monthStr = now.toLocaleString('en-US', { month: 'short' });
    const dayStr = now.getDate();
    const badgeDateStr = `${monthStr}.${dayStr}`;
    const fullDateSlashStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');

    switch (bgId) {
      case 'parchment-cat':
        return (
          <div 
            className={`w-full bg-[#fdfbf7] rounded-[24px] border border-[#4c2c31]/15 text-[#4c2c31] flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
              isExport 
                ? 'p-12 w-[460px] min-h-[640px] h-auto' 
                : 'p-6 sm:p-10 min-h-[520px] sm:min-h-[580px] h-auto aspect-[23/32] w-auto max-w-full'
            }`}
            style={{ boxShadow: '0 20px 40px -15px rgba(0,0,0,0.15)' }}
          >
            <div className="flex items-start justify-between select-none">
              <div className="border border-[#4c2c31]/80 px-2.5 py-1.5 flex flex-col items-center leading-none text-[#4c2c31] font-serif tracking-tight w-12 rounded-b-md bg-[#fdfbf7] z-10">
                <span className="text-[10px] font-light opacity-80">{yearCenturyStr}</span>
                <span className="text-xs font-semibold mt-0.5">{yearShortStr}</span>
                <span className="text-[8px] border-t border-[#4c2c31]/50 mt-1 pt-1 font-mono tracking-tighter">{badgeDateStr}</span>
              </div>
              <span className="text-[#4c2c31]/40 text-[9px] font-sans tracking-[0.2em] uppercase select-none mt-2">
                @ 雨天随笔
              </span>
            </div>

            <div className="flex-1 py-6 flex flex-col">
              <div 
                className="space-y-3 my-auto animate-in fade-in duration-300"
                style={{ fontFamily: activeFont.family }}
              >
                {renderThemeParagraphs(inspirationText, 'text-[#4c2c31]', false, noteTitle)}
              </div>
            </div>

            <div className="pt-4 border-t border-[#4c2c31]/10 flex justify-between items-end select-none">
              <div 
                className="text-[#4c2c31]/40 text-[9px] font-mono tracking-[0.2em] font-light uppercase"
                style={{ writingMode: 'vertical-rl' }}
              >
                Rain
              </div>
              
              <div className="text-[#4c2c31]/70 shrink-0 transform translate-y-2 translate-x-2">
                <svg className="w-20 h-20" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 85 L 90 83" />
                  <path d="M30 83 C 32 75, 37 60, 48 58 C 49 58, 50 58, 52 58 C 63 60, 68 75, 70 82" />
                  <path d="M38 52 C 34 46, 36 38, 44 38 C 45 38, 46 38, 48 39 C 52 38, 58 40, 60 46 C 62 52, 58 58, 48 58 C 42 58, 39 55, 38 52 Z" fill="#fdfbf7" />
                  <path d="M39 40 L 35 30 L 44 36" fill="#fdfbf7" />
                  <path d="M57 40 L 61 30 L 53 36" fill="#fdfbf7" />
                  <path d="M44 36 C 46 32, 51 32, 53 35 L 44 36" fill="currentColor" />
                  <circle cx="45" cy="46" r="1" fill="currentColor" />
                  <circle cx="53" cy="46" r="1" fill="currentColor" />
                  <circle cx="49" cy="49" r="0.75" fill="currentColor" />
                  <path d="M49 51 L 49 53" />
                  <circle cx="49" cy="62" r="1" fill="currentColor" />
                  <circle cx="49" cy="67" r="1" fill="currentColor" />
                  <path d="M38 78 C 40 70, 50 70, 52 75" />
                  <path d="M60 78 C 58 70, 50 70, 48 75" />
                  <path d="M43 78 C 44 75, 47 75, 48 78" />
                  <path d="M55 78 C 54 75, 51 75, 50 78" />
                </svg>
              </div>
            </div>
          </div>
        );

      case 'winter-story':
        return (
          <div 
            className={`w-full bg-[#81b3df] rounded-[24px] flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
              isExport 
                ? 'w-[460px] min-h-[640px] h-auto p-8' 
                : 'min-h-[520px] sm:min-h-[580px] h-auto aspect-[23/32] w-auto max-w-full p-5 sm:p-6'
            }`}
            style={{ boxShadow: '0 20px 40px -15px rgba(0,0,0,0.3)' }}
          >
            <div className="text-center pt-4 pb-2 text-[#1c4d80] select-none">
              <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-[0.25em]">WINTER</h2>
              <div className="text-[8px] font-sans uppercase tracking-[0.2em] font-semibold mt-1.5 inline-block border-y border-[#1c4d80]/20 py-0.5 px-3">
                - 冬 -
              </div>
              <p className="text-[7.5px] font-sans font-light tracking-wider opacity-80 mt-1.5">
                Winter is the time for warm hugs and fuzzy socks. | Memory
              </p>
            </div>

            <div className="flex-1 bg-[#fbfbf8] rounded-xl shadow-lg relative p-6 sm:p-7 my-4 flex flex-col justify-between min-h-[260px] overflow-hidden">
              <div className="absolute top-4 left-4 w-10 h-10 rounded-full border border-dashed border-[#1c4d80]/40 flex flex-col items-center justify-center text-[#1c4d80] rotate-12 select-none opacity-80 z-20">
                <span className="text-[6.5px] font-mono font-bold">W I N</span>
                <span className="text-[7.5px] my-0.5">❄️</span>
                <span className="text-[6.5px] font-mono font-bold">T E R</span>
              </div>

              <div className="absolute right-[-4px] top-16 w-3 h-14 bg-[#eb6195] rounded-l-md shadow-sm select-none z-20" />

              <div className="flex-1 pt-12 pb-6 z-10 flex flex-col">
                <div 
                  className="space-y-2.5 my-auto animate-in fade-in duration-300"
                  style={{ fontFamily: activeFont.family }}
                >
                  {renderThemeParagraphs(inspirationText, 'text-[#1c4d80]', false, noteTitle)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-2 mb-3 mt-1 select-none z-20">
              <div className="bg-[#fdf091] border border-dashed border-[#e3d15d]/70 rounded px-1.5 py-0.5 text-[#1c4d80]/80 text-[7px] font-mono leading-none flex items-center space-x-1 shadow-sm">
                <span className="opacity-40">MON</span>
                <span className="bg-[#1c4d80] text-[#fdf091] px-0.5 py-0.2 rounded-[1px] font-bold">TUE</span>
                <span className="opacity-40">THU</span>
                <span className="opacity-40">FRI</span>
              </div>

              <div className="h-4 w-12 bg-[#4f83b2]/80 border border-white/10 flex items-center justify-center rounded shadow-inner">
                <div className="bg-[#f4f4f4] text-[#1c4d80] border border-stone-300 shadow-sm rounded-sm px-1 text-[7px] font-bold leading-tight">
                  T
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-[7.5px] font-sans tracking-widest text-[#1c4d80]/60 px-2 pb-1 select-none">
              <span>Rain</span>
              <span>雨天随笔</span>
            </div>
          </div>
        );

      case 'summer-breeze':
        return (
          <div 
            className={`w-full bg-[#ddd264] rounded-[24px] flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
              isExport 
                ? 'w-[460px] min-h-[640px] h-auto p-8' 
                : 'min-h-[520px] sm:min-h-[580px] h-auto aspect-[23/32] w-auto max-w-full p-5 sm:p-6'
            }`}
            style={{ boxShadow: '0 20px 40px -15px rgba(0,0,0,0.3)' }}
          >
            <div className="text-center pt-4 pb-2 text-[#333d11] select-none">
              <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-[0.25em]">SUMMER</h2>
              <div className="text-[8px] font-sans uppercase tracking-[0.2em] font-semibold mt-1.5 inline-block border-y border-[#333d11]/20 py-0.5 px-3">
                - 夏 -
              </div>
              <p className="text-[7.5px] font-sans font-light tracking-wider opacity-80 mt-1.5">
                Summer is the time for freedom. | Memory
              </p>
            </div>

            <div className="flex-1 bg-[#fbfbf8] rounded-xl shadow-lg relative p-6 sm:p-7 my-4 flex flex-col justify-between min-h-[260px] overflow-hidden">
              <div className="absolute top-4 left-4 w-10 h-10 rounded-full border border-dashed border-[#333d11]/40 flex flex-col items-center justify-center text-[#333d11] -rotate-12 select-none opacity-80 z-20">
                <span className="text-[6.5px] font-mono font-bold leading-none">SUM</span>
                <span className="text-[7.5px] my-0.5 leading-none">🌾</span>
                <span className="text-[6.5px] font-mono font-bold leading-none">MER</span>
              </div>

              <div className="absolute right-[-4px] top-16 w-3 h-14 bg-[#4caf50] rounded-l-md shadow-sm select-none z-20" />

              <div className="flex-1 pt-12 pb-6 z-10 flex flex-col">
                <div 
                  className="space-y-2.5 my-auto animate-in fade-in duration-300"
                  style={{ fontFamily: activeFont.family }}
                >
                  {renderThemeParagraphs(inspirationText, 'text-[#333d11]', false, noteTitle)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-2 mb-3 mt-1 select-none z-20">
              <div className="bg-[#ff9ebb] border border-dashed border-[#e67595]/70 rounded px-1.5 py-0.5 text-[#333d11]/80 text-[7px] font-mono leading-none flex items-center space-x-1 shadow-sm">
                <span className="opacity-40">MON</span>
                <span className="bg-[#333d11] text-[#ff9ebb] px-0.5 py-0.2 rounded-[1px] font-bold">TUE</span>
                <span className="opacity-40">THU</span>
                <span className="opacity-40">FRI</span>
              </div>

              <div className="h-4 w-12 bg-[#859846]/80 border border-white/10 flex items-center justify-center rounded shadow-inner">
                <div className="bg-[#f4f4f4] text-[#333d11] border border-stone-300 shadow-sm rounded-sm px-1 text-[7px] font-bold leading-tight">
                  T
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-[7.5px] font-sans tracking-widest text-[#333d11]/60 px-2 pb-1 select-none">
              <span>Rain</span>
              <span>雨天随笔</span>
            </div>
          </div>
        );

      case 'tiny-type':
      default:
        return (
          <div 
            className={`w-full bg-[#fdfcf7] rounded-[24px] border border-[#dfd9cd]/50 text-[#1B365D] flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
              isExport 
                ? 'p-12 w-[460px] min-h-[640px] h-auto' 
                : 'p-6 sm:p-8 min-h-[520px] sm:min-h-[580px] h-auto aspect-[23/32] w-auto max-w-full'
            }`}
            style={{ boxShadow: '0 20px 40px -15px rgba(0,0,0,0.12)' }}
          >
            <div className="flex justify-between items-center text-[9px] font-mono text-[#1B365D]/60 border-b border-[#dfd9cd] pb-2 mb-6 select-none">
              <span className="font-semibold tracking-widest uppercase">Rain</span>
              <span>Date {fullDateSlashStr}</span>
            </div>

            <div className="flex-1 py-4 flex flex-col">
              <div 
                className="space-y-1.5 my-auto animate-in fade-in duration-300"
                style={{ fontFamily: activeFont.family }}
              >
                {renderThemeParagraphs(inspirationText, 'text-[#1B365D]', true, noteTitle)}
              </div>
            </div>

            <div className="mt-4 flex justify-between items-end border-t border-[#dfd9cd]/40 pt-4 select-none">
              <span className="text-[8px] font-mono text-[#1B365D]/40 font-light">
                雨天随笔
              </span>

              <div className="text-[#1B365D]/75 shrink-0 transform translate-y-2 translate-x-2">
                <svg className="w-20 h-20" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M40 85 C 42 75, 47 65, 58 62 C 65 65, 75 70, 78 85" />
                  <path d="M48 55 C 44 50, 46 42, 54 42 C 55 42, 56 42, 58 43 C 62 42, 68 44, 70 50 C 72 56, 68 62, 58 62 C 52 62, 49 59, 48 55 Z" fill="#fdfcf7" />
                  <path d="M49 44 L 45 34 L 54 40" fill="#fdfcf7" />
                  <path d="M67 44 L 71 34 L 63 40" fill="#fdfcf7" />
                  <path d="M54 40 C 56 36, 61 36, 63 39 L 54 40" fill="currentColor" />
                  <circle cx="55" cy="50" r="1" fill="currentColor" />
                  <circle cx="63" cy="50" r="1" fill="currentColor" />
                  <circle cx="59" cy="53" r="0.75" fill="currentColor" />
                  <path d="M59 55 L 59 57" />
                  <path d="M45 78 C 48 76, 52 76, 55 78" />
                  <path d="M42 72 L 48 72 L 48 80 L 42 80 Z" fill="#fdfcf7" />
                  <path d="M48 74 C 50 74, 51 75, 51 76 C 51 77, 50 78, 48 78" />
                  <path d="M44 68 C 44 66, 45 66, 45 64" />
                  <path d="M46 68 C 46 66, 47 66, 47 64" />
                  <path d="M10 90 L 90 90" stroke="#dfd9cd" strokeWidth="0.5" />
                </svg>
              </div>
            </div>
          </div>
        );
    }
  };

  // --- Saved Inspirations State (Local Storage persistent) ---
  const [savedInspirations, setSavedInspirations] = useState<SavedInspiration[]>(() => {
    try {
      const saved = localStorage.getItem('saved_inspirations');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);

  // --- White Noise Audio and Dragging Actions ---
  const toggleSound = (id: string) => {
    setNativeSounds((prevSounds: any) => {
      const updated = prevSounds.map((sound: any) => {
        if (sound.id === id) {
          const nextIsPlaying = !sound.isPlaying;
          
          if (nextIsPlaying) {
            if (!audioPlayersRef.current[id]) {
              const audio = new Audio(sound.url);
              audio.loop = true;
              audio.volume = sound.volume;
              audioPlayersRef.current[id] = audio;
            }
            audioPlayersRef.current[id].play().catch((err: any) => {
              console.warn('Playback prevented or failed:', err);
            });
          } else {
            if (audioPlayersRef.current[id]) {
              audioPlayersRef.current[id].pause();
            }
          }
          return { ...sound, isPlaying: nextIsPlaying };
        }
        return sound;
      });
      
      localStorage.setItem('white_noise_native_sounds', JSON.stringify(
        updated.map((s: any) => ({ id: s.id, isPlaying: s.isPlaying, volume: s.volume }))
      ));
      return updated;
    });
  };

  const handleVolumeChange = (id: string, newVolume: number) => {
    setNativeSounds((prevSounds: any) => {
      const updated = prevSounds.map((sound: any) => {
        if (sound.id === id) {
          if (audioPlayersRef.current[id]) {
            audioPlayersRef.current[id].volume = newVolume;
          }
          return { ...sound, volume: newVolume };
        }
        return sound;
      });
      
      localStorage.setItem('white_noise_native_sounds', JSON.stringify(
        updated.map((s: any) => ({ id: s.id, isPlaying: s.isPlaying, volume: s.volume }))
      ));
      return updated;
    });
  };

  const handleMuteAll = () => {
    setNativeSounds((prevSounds: any) => {
      const updated = prevSounds.map((sound: any) => {
        if (sound.isPlaying && audioPlayersRef.current[sound.id]) {
          audioPlayersRef.current[sound.id].pause();
        }
        return { ...sound, isPlaying: false };
      });
      localStorage.setItem('white_noise_native_sounds', JSON.stringify(
        updated.map((s: any) => ({ id: s.id, isPlaying: s.isPlaying, volume: s.volume }))
      ));
      return updated;
    });
  };

  const isAnySoundPlaying = true;

  const getSoundIcon = (iconName: string) => {
    switch (iconName) {
      case 'CloudRain': return <CloudRain className="w-4 h-4 text-[#e5a7b8]" />;
      case 'Flame': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'Bird': return <Bird className="w-4 h-4 text-emerald-400" />;
      case 'Bug': return <Bug className="w-4 h-4 text-lime-400" />;
      case 'Waves': return <Waves className="w-4 h-4 text-blue-400" />;
      case 'Droplet': return <Droplet className="w-4 h-4 text-teal-400" />;
      case 'Coffee': return <Coffee className="w-4 h-4 text-amber-500" />;
      case 'Keyboard': return <Keyboard className="w-4 h-4 text-stone-400" />;
      default: return <Music className="w-4 h-4 text-pink-400" />;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on left click
    if (e.button !== 0) return;
    // Prevent dragging if clicking inside form controls of the expanded panel
    if ((e.target as HTMLElement).closest('.no-drag')) {
      return;
    }
    dragDistanceRef.current = 0;
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      posX: pos.x,
      posY: pos.y,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) {
      return;
    }
    dragDistanceRef.current = 0;
    const touch = e.touches[0];
    dragRef.current = {
      isDragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
      posX: pos.x,
      posY: pos.y,
    };
  };

  // Dragging event listeners
  React.useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      
      dragDistanceRef.current += Math.sqrt(dx * dx + dy * dy);
      
      let newX = dragRef.current.posX + dx;
      let newY = dragRef.current.posY + dy;
      
      const margin = 10;
      newX = Math.max(margin, Math.min(window.innerWidth - 80, newX));
      newY = Math.max(margin, Math.min(window.innerHeight - 80, newY));
      
      setPos({ x: newX, y: newY });
    };

    const handleWindowMouseUp = () => {
      if (dragRef.current.isDragging) {
        dragRef.current.isDragging = false;
        localStorage.setItem('white_noise_cd_position', JSON.stringify(pos));
      }
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (!dragRef.current.isDragging) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragRef.current.startX;
      const dy = touch.clientY - dragRef.current.startY;
      
      dragDistanceRef.current += Math.sqrt(dx * dx + dy * dy);
      
      let newX = dragRef.current.posX + dx;
      let newY = dragRef.current.posY + dy;
      
      const margin = 10;
      newX = Math.max(margin, Math.min(window.innerWidth - 80, newX));
      newY = Math.max(margin, Math.min(window.innerHeight - 80, newY));
      
      setPos({ x: newX, y: newY });
      if (e.cancelable) e.preventDefault();
    };

    const handleWindowTouchEnd = () => {
      if (dragRef.current.isDragging) {
        dragRef.current.isDragging = false;
        localStorage.setItem('white_noise_cd_position', JSON.stringify(pos));
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
    window.addEventListener('touchend', handleWindowTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
    };
  }, [pos]);

  // Cleanup audio on unmount
  React.useEffect(() => {
    return () => {
      Object.values(audioPlayersRef.current).forEach((audio: any) => {
        try {
          audio.pause();
        } catch (e) {}
      });
    };
  }, []);

  // States to track saved versus unsaved states
  const [lastSavedTitle, setLastSavedTitle] = useState<string>('脑海里刚刚闪过什么?');
  const [lastSavedContent, setLastSavedContent] = useState<string>('');
  const [showNewConfirmModal, setShowNewConfirmModal] = useState<boolean>(false);

  // Compute dirty state
  const hasUnsavedChanges = 
    (inspirationText !== lastSavedContent || noteTitle !== lastSavedTitle) && 
    (inspirationText.trim() !== '' || noteTitle !== '脑海里刚刚闪过什么?');

  const performCreateNew = () => {
    setInspirationText('');
    setNoteTitle('脑海里刚刚闪过什么?');
    setLastSavedContent('');
    setLastSavedTitle('脑海里刚刚闪过什么?');
    setEditMode('edit');
    showToast('已准备好新的灵感画布 ✨');
  };

  const handleNewInspiration = () => {
    if (hasUnsavedChanges) {
      setShowNewConfirmModal(true);
    } else {
      performCreateNew();
    }
  };

  const saveAndCreateNew = () => {
    if (!inspirationText.trim()) {
      performCreateNew();
      setShowNewConfirmModal(false);
      return;
    }

    const newItem: SavedInspiration = {
      id: Date.now().toString(),
      title: noteTitle.trim() || '未命名灵感',
      content: inspirationText,
      createdAt: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }) + ' ' + new Date().toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit'
      })
    };

    const updated = [newItem, ...savedInspirations];
    setSavedInspirations(updated);
    localStorage.setItem('saved_inspirations', JSON.stringify(updated));

    // Clear and create new
    setInspirationText('');
    setNoteTitle('脑海里刚刚闪过什么?');
    setLastSavedContent('');
    setLastSavedTitle('脑海里刚刚闪过什么?');
    setEditMode('edit');
    setShowNewConfirmModal(false);
    showToast('灵感已安全保存，已开启新画布 ✨');
  };

  const handleSaveInspiration = () => {
    if (!inspirationText.trim() || saveStatus !== 'idle') return;
    
    setSaveStatus('saving');
    
    // Simulate gentle saving transition
    setTimeout(() => {
      const newItem: SavedInspiration = {
        id: Date.now().toString(),
        title: noteTitle.trim() || '未命名灵感',
        content: inspirationText,
        createdAt: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }) + ' ' + new Date().toLocaleDateString('zh-CN', {
          month: '2-digit',
          day: '2-digit'
        })
      };

      const updated = [newItem, ...savedInspirations];
      setSavedInspirations(updated);
      localStorage.setItem('saved_inspirations', JSON.stringify(updated));

      setSaveStatus('saved');
      setLastSavedContent(inspirationText);
      setLastSavedTitle(noteTitle);
      showToast('灵感已温柔保存到写作室 ✨');
      
      // 2 seconds later, revert save status to idle
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }, 1200);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleDownloadCard = async () => {
    if (!shareCardRef.current || isCapturing) return;
    setIsCapturing(true);
    showToast('正在绘制造物卡片... 🎨');
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: 'transparent',
      });
      const link = document.createElement('a');
      link.download = `雨天灵感_${noteTitle.trim() || '未命名'}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      showToast('卡片下载成功！ ✨');
    } catch (error) {
      console.error('Download card error:', error);
      showToast('卡片绘制失败，请重试 😢');
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePresetSelect = (id: PresetId) => {
    setActivePresetId(id);
    if (customMedia.url) {
      URL.revokeObjectURL(customMedia.url);
      setCustomMedia({ 
        type: null, 
        url: null, 
        name: null,
        rotation: 0,
        flipH: false,
        flipV: false
      });
    }
  };

  const handleMediaUpload = (file: File) => {
    if (customMedia.url) {
      URL.revokeObjectURL(customMedia.url);
    }
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    const url = URL.createObjectURL(file);
    setCustomMedia({ 
      type, 
      url, 
      name: file.name,
      rotation: 0,
      flipH: false,
      flipV: false
    });
  };

  const handleClearMedia = () => {
    if (customMedia.url) {
      URL.revokeObjectURL(customMedia.url);
    }
    setCustomMedia({ 
      type: null, 
      url: null, 
      name: null,
      rotation: 0,
      flipH: false,
      flipV: false
    });
  };

  const handleUpdateMediaTransform = (transform: { rotation?: number; flipH?: boolean; flipV?: boolean }) => {
    setCustomMedia(prev => ({
      ...prev,
      ...transform
    }));
  };

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden bg-[#FAF4F4] text-[#2D2224] font-sans"
    >
      
      {/* 1. Dynamic WebGL Rain and Glass Canvas Background */}
      <div className="absolute inset-0 z-0">
        <RainCanvas 
          settings={rainSettings}
          preset={activePreset}
          customMedia={customMedia}
          isPlaying={true}
        />
      </div>

      {/* 2. Simple, Distraction-Free Focused Editor Layout */}
      <div className={`relative z-10 w-full h-full flex flex-col items-center justify-center p-4 sm:p-8 transition-all duration-700 ${
        hideUI ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}>
        
        {/* Large Translucent Glassmorphic Card (Matches the screenshot perfectly) */}
        <div 
          className="w-full sm:w-[580px] h-[460px] sm:h-[480px] border border-white/15 rounded-none p-6 sm:p-8 flex flex-col justify-between resize overflow-hidden min-w-[320px] min-h-[280px] max-w-full max-h-[90vh] transition-all duration-300 relative"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 1.0)'
          }}
        >
          {/* SVG fractal noise layer inside card at 10% opacity */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-10 mix-blend-overlay z-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }}
          />
          
          {/* Header Area inside Card */}
          <div className="text-center z-10">
            {/* Note Title Input (Editable) */}
            <input 
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full bg-transparent border-0 text-center text-xl sm:text-2xl font-light tracking-[0.15em] text-white focus:outline-none focus:ring-0 placeholder-white/50 mb-1"
              placeholder="脑海里刚刚闪过什么?"
              style={{ fontFamily: activeFont.family }}
            />
            
            {/* Status Row: Centered display of the single green status */}
            <div className="flex items-center justify-center space-x-2 text-xs text-white/60 mb-5 select-none h-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="tracking-wide font-light">
                {saveStatus === 'saving' && '正在保存到写作室…'}
                {saveStatus === 'saved' && '已保存到写作室'}
                {saveStatus === 'idle' && (inspirationText.trim() ? '创作中' : '已就绪')}
              </span>
            </div>
          </div>

          {/* Textarea Body */}
          <div className="flex-1 flex flex-col min-h-0 z-10">
            {editMode === 'edit' ? (
              <textarea
                value={inspirationText}
                onChange={(e) => setInspirationText(e.target.value)}
                placeholder="在雨里,写下一点仍然清晰的事......."
                className="w-full flex-1 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-white placeholder-white/35 text-sm sm:text-base leading-relaxed custom-scrollbar min-h-[100px] font-light"
                id="minimal-editor-textarea"
                style={{ fontFamily: activeFont.family }}
              />
            ) : (
              <div 
                onDoubleClick={() => setEditMode('edit')}
                className="w-full flex-1 overflow-y-auto custom-scrollbar select-text text-white text-sm sm:text-base leading-relaxed min-h-[100px] font-light cursor-pointer pr-1"
                title="双击进入编辑模式"
              >
                {inspirationText ? parseMarkdown(inspirationText) : (
                  <span className="text-white/25 italic font-light">在雨里,写下一点仍然清晰的事....... (双击进行编辑)</span>
                )}
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="flex justify-between items-center pt-3 mt-3 select-none z-10">
            <div className="flex items-center space-x-4 text-[10px] sm:text-xs text-white/40 font-light tracking-wide">
              <span>{inspirationText.length} 字</span>
              <button
                onClick={handleNewInspiration}
                className="hover:text-white transition-colors cursor-pointer flex items-center"
                title="新建"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setHistoryOpen(true)}
                className="hover:text-white transition-colors cursor-pointer flex items-center"
                title="历史"
              >
                <History className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {inspirationText.trim() && (
                <button
                  onClick={() => {
                    if (confirm('确定要清空当前的灵感内容吗？')) {
                      setInspirationText('');
                    }
                  }}
                  className="px-2.5 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer rounded-lg hover:bg-white/5"
                >
                  清空
                </button>
              )}
              
              <button
                onClick={() => setEditMode(editMode === 'edit' ? 'preview' : 'edit')}
                className="px-2.5 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer rounded-lg font-light"
                title={editMode === 'edit' ? '预览排版' : '返回编辑'}
              >
                {editMode === 'edit' ? '预览' : '编辑'}
              </button>

              {inspirationText.trim() && (
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                  title="分享此灵感"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={handleSaveInspiration}
                disabled={!inspirationText.trim() || saveStatus !== 'idle'}
                className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 active:scale-95 text-white/80 hover:text-white disabled:opacity-20 disabled:scale-100 font-light text-xs tracking-wider transition-all cursor-pointer"
              >
                {saveStatus === 'saving' ? '正在保存...' : saveStatus === 'saved' ? '已保存 ✨' : '保存'}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 3. Floating Bottom Controls: Slide Settings */}
      <div className="fixed bottom-6 right-6 z-35 bg-black/40 backdrop-blur-md border border-white/10 p-1.5 rounded-full shadow-xl flex items-center select-none text-white">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSidebarOpen(true);
          }}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full hover:bg-white/5 text-white/80 hover:text-white transition-all cursor-pointer text-xs font-light"
          title="打开雨景设置"
        >
          <Sliders className="w-4 h-4 text-[#E5A7B8]" />
          <span>雨景设置</span>
        </button>
      </div>



      {/* Beautiful Share Card Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-[#FAF4F4]/45 backdrop-blur-2xl overflow-y-auto custom-scrollbar animate-in fade-in duration-300">
          <div className="w-full max-w-5xl mx-auto flex flex-row items-stretch justify-center gap-8 sm:gap-12 lg:gap-16 py-6 relative overflow-x-auto custom-scrollbar">
            
            {/* Header / Info label for screen-readers & title (Invisible or subtle) */}
            <div className="sr-only">
              <h3>分享我的灵感卡片</h3>
            </div>

            {/* Left Column: Floating Elegant Card Preview with full vertical scrolling */}
            <div className="flex-1 flex flex-col justify-center items-center min-w-[340px] max-w-[420px]">
              <div className="w-full max-h-[75vh] md:max-h-[580px] overflow-y-auto custom-scrollbar-light pr-2 py-2 transition-all duration-300 flex justify-center">
                <div className="w-full">
                  {renderCard(activeShareBgId, false)}
                </div>
              </div>
            </div>

            {/* Right Column: Free Floating Control Panel with fresh light theme */}
            <div className="w-[280px] sm:w-[300px] flex flex-col justify-center space-y-7 shrink-0 text-stone-800">
              
              {/* Card Style selection */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-medium tracking-[0.15em] text-stone-500 uppercase">选择便签风格</h4>
                <div className="grid grid-cols-2 gap-2">
                  {SHARE_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setActiveShareBgId(bg.id)}
                      className={`py-2.5 px-3 rounded-xl text-[11px] font-light transition-all border cursor-pointer text-left flex items-center space-x-2 ${
                        activeShareBgId === bg.id
                          ? 'border-[#E5A7B8] text-[#9c5a6c] bg-white/85 shadow-sm font-medium'
                          : 'border-stone-200/60 bg-white/25 text-stone-600 hover:text-stone-800 hover:bg-white/60'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${bg.bgClass} border border-stone-200 shrink-0 shadow-sm`} />
                      <span className="truncate">{bg.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons with fresh aesthetic styling */}
              <div className="space-y-3 pt-6 border-t border-stone-200">
                <button
                  onClick={handleDownloadCard}
                  disabled={isCapturing}
                  className="w-full py-3 rounded-xl bg-[#E5A7B8] hover:bg-[#DC93A6] text-[#2D2224] text-xs font-medium transition-all active:scale-95 hover:shadow-lg hover:shadow-[#E5A7B8]/20 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isCapturing ? '生成中...' : '下载图片'}</span>
                </button>
                <button
                  onClick={() => setShareModalOpen(false)}
                  className="w-full py-3 rounded-xl bg-stone-200/50 hover:bg-stone-200/80 text-stone-600 hover:text-stone-800 text-xs font-light border border-stone-200/40 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                >
                  <span>关闭</span>
                </button>
              </div>

            </div>

            {/* Hidden actual render target (Always full length, no scrolling or cutoffs!) */}
            <div className="absolute left-[-9999px] top-[-9999px] pointer-events-none select-none">
              <div 
                ref={shareCardRef}
                className="w-[460px] h-auto flex flex-col justify-start items-stretch relative overflow-hidden"
              >
                {renderCard(activeShareBgId, true)}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. Beautiful sliding History Drawer from Left */}
      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        inspirations={savedInspirations}
        onReload={(item) => {
          setNoteTitle(item.title);
          setInspirationText(item.content);
          setLastSavedTitle(item.title);
          setLastSavedContent(item.content);
          showToast('已重新载入选中的历史灵感 📖');
        }}
        onDelete={(id) => {
          const updated = savedInspirations.filter(x => x.id !== id);
          setSavedInspirations(updated);
          localStorage.setItem('saved_inspirations', JSON.stringify(updated));
          showToast('已删除该条灵感记录 🗑️');
        }}
        onShowToast={showToast}
      />

      {/* 5. Beautiful sliding Sidebar Drawer for Background Rain and Sound Board controls */}
      <SidebarSettings 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        settings={rainSettings}
        onSettingsChange={setRainSettings}
        presets={PRESETS}
        activePresetId={activePresetId}
        onPresetSelect={handlePresetSelect}
        customMedia={customMedia}
        onMediaUpload={handleMediaUpload}
        onClearMedia={handleClearMedia}
        onUpdateMediaTransform={handleUpdateMediaTransform}
        activeFontId={activeFontId}
        onFontSelect={setActiveFontId}
      />

      {/* Custom Confirmation Modal for Unsaved Content on "New" */}
      {showNewConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1a1817] border border-white/10 rounded-2xl max-w-sm w-full p-6 text-stone-200 shadow-2xl flex flex-col space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-white/5 text-[#E5A7B8] shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="text-sm font-medium text-stone-100 tracking-wide">
                  未保存的灵感
                </h3>
                <p className="text-xs font-light text-stone-400 leading-relaxed">
                  当前画布有未保存的文字，新建后将无法恢复。您希望如何处理？
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                onClick={() => setShowNewConfirmModal(false)}
                className="px-3 py-2 text-xs font-light text-white/40 hover:text-white/70 transition-colors cursor-pointer rounded-lg"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowNewConfirmModal(false);
                  performCreateNew();
                }}
                className="px-3.5 py-2 text-xs font-light text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-colors cursor-pointer rounded-xl"
              >
                不保存
              </button>
              <button
                onClick={saveAndCreateNew}
                className="px-4 py-2 text-xs font-medium bg-[#E5A7B8] hover:bg-[#DC93A6] text-[#2D2224] transition-colors cursor-pointer rounded-xl shadow-lg shadow-[#E5A7B8]/10"
              >
                保存并新建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Custom Float Center Success/Alert Toast Notification */}
      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-[#2D2224] text-white text-xs sm:text-sm shadow-2xl flex items-center space-x-2 border border-white/10 animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300">
          <Check className="w-4 h-4 text-[#E5A7B8]" />
          <span className="tracking-wide font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 7. Draggable Floating CD and White Noise Panel */}
      <div 
        className="fixed z-40 select-none"
        style={{ left: pos.x, top: pos.y }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="relative flex items-center justify-start">
          {/* Draggable Vinyl CD */}
          <div 
            className="relative w-16 h-16 flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 transition-transform duration-200"
            onClick={(e) => {
              e.stopPropagation();
              // Only trigger expand if it was a quick click, not a drag movement
              if (dragDistanceRef.current < 5) {
                setIsNoiseExpanded(!isNoiseExpanded);
                localStorage.setItem('white_noise_expanded', String(!isNoiseExpanded));
              }
            }}
            title={isNoiseExpanded ? "点击收起白噪音面板 (可拖拽)" : "点击展开白噪音面板 (可拖拽)"}
          >
            {/* Vinyl Disk outer rim */}
            <div 
              className={`w-14 h-14 rounded-full bg-[#1b1719] border-2 border-white/90 shadow-2xl flex items-center justify-center relative overflow-hidden transition-all duration-300 ${isNoiseExpanded ? 'ring-2 ring-[#E5A7B8]/40 scale-102' : ''}`}
            >
              {/* Glossy reflection cover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent z-10 pointer-events-none" />
              {/* Circular grooves using concentric circles */}
              <div className="absolute inset-1 rounded-full border border-stone-800/60 pointer-events-none" />
              <div className="absolute inset-2.5 rounded-full border border-stone-700/40 pointer-events-none" />
              <div className="absolute inset-4 rounded-full border border-stone-800/60 pointer-events-none" />

              {/* Vinyl Record Center Label */}
              <div 
                className="absolute w-7 h-7 rounded-full bg-[#f3c2ce] flex items-center justify-center shadow-inner animate-spin-slow border border-white/25"
                style={{ animationPlayState: 'running' }}
              >
                {/* Custom Elegant Candy SVG 🍬 */}
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#d06982] fill-current drop-shadow-[0_0.5px_1px_rgba(0,0,0,0.12)]" xmlns="http://www.w3.org/2000/svg">
                  {/* Left wrapping wing */}
                  <path d="M5 8.5C6.5 10 6.5 14 5 15.5L2 14C2 13 3 12 2 11L5 8.5Z" className="text-[#fca5a5] fill-current" />
                  {/* Right wrapping wing */}
                  <path d="M19 8.5C17.5 10 17.5 14 19 15.5L22 14C22 13 21 12 22 11L19 8.5Z" className="text-[#fca5a5] fill-current" />
                  {/* Center Candy Body */}
                  <rect x="7" y="8" width="10" height="8" rx="4" className="text-[#d06982] fill-current" />
                  {/* Glossy shine line */}
                  <path d="M9 10C10.5 9.5 13.5 9.5 15 10" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.65" />
                </svg>
              </div>
            </div>
          </div>

          {/* Frosted Glass White Noise Panel - Always mounted for continuous playback, hidden/revealed via CSS opacity/pointer-events */}
          <div 
            className={`no-drag absolute left-18 top-0 w-[412px] bg-[#FAF4F4]/85 backdrop-blur-xl border border-[#E5A7B8]/20 rounded-2xl p-4 shadow-2xl text-stone-800 transition-all duration-300 select-text ${
              isNoiseExpanded 
                ? 'opacity-100 translate-x-0 pointer-events-auto' 
                : 'opacity-0 -translate-x-4 pointer-events-none'
            }`}
            onMouseDown={(e) => e.stopPropagation()} // Stop dragging when interacting inside panel
            onTouchStart={(e) => e.stopPropagation()} // Stop dragging on touch interact inside panel
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 border-b border-[#E5A7B8]/15 pb-2">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-[#e5a7b8]" />
                <span className="text-xs font-medium tracking-wider text-stone-700">环境白噪音调音台</span>
              </div>
            </div>

            {/* White Noise Mixer Component */}
            <div className="w-[380px] h-[340px] bg-white/40 border border-stone-200/30 rounded-2xl overflow-hidden shadow-sm">
              <iframe
                src="https://www.ppbzy.com/embed"
                width="380"
                height="340"
                frameBorder="0"
                allow="autoplay"
                style={{ borderRadius: '16px', border: 'none' }}
                title="环境白噪音"
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
