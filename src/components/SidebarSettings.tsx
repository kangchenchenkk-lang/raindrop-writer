import React, { useState, useRef } from 'react';
import { RainSettings, BackgroundPreset, PresetId } from '../types';
import { 
  Sliders, 
  CloudRain, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  X, 
  Upload, 
  Sparkles,
  RefreshCw,
  Flame, 
  CloudLightning, 
  Wind, 
  Waves, 
  Droplet, 
  Bird, 
  Bug, 
  Coffee, 
  BookOpen, 
  Train, 
  Keyboard, 
  Disc, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Type
} from 'lucide-react';

interface SoundItem {
  id: string;
  name: string;
  category: 'nature' | 'places' | 'asmr' | 'noise' | 'lofi';
  file: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SOUNDS_LIST: SoundItem[] = [
  { id: 'fire', name: '篝火', category: 'nature', file: 'fire.mp3', icon: Flame },
  { id: 'rain-on-window', name: '窗上雨声', category: 'asmr', file: 'rain-on-window.mp3', icon: CloudRain },
  { id: 'rain', name: '雨声', category: 'nature', file: 'rain.mp3', icon: CloudRain },
  { id: 'thunder', name: '雷声', category: 'nature', file: 'thunder.mp3', icon: CloudLightning },
  { id: 'wind', name: '风声', category: 'nature', file: 'wind.mp3', icon: Wind },
  { id: 'waves', name: '海浪', category: 'nature', file: 'waves.mp3', icon: Waves },
  { id: 'stream', name: '溪流', category: 'nature', file: 'stream.mp3', icon: Droplet },
  { id: 'birds', name: '鸟鸣', category: 'nature', file: 'birds.mp3', icon: Bird },
  { id: 'crickets', name: '虫鸣', category: 'nature', file: 'crickets.mp3', icon: Bug },
  { id: 'cafe', name: '咖啡馆', category: 'places', file: 'cafe.mp3', icon: Coffee },
  { id: 'library', name: '图书馆', category: 'places', file: 'library.mp3', icon: BookOpen },
  { id: 'train', name: '火车', category: 'places', file: 'train.mp3', icon: Train },
  { id: 'keyboard', name: '键盘', category: 'places', file: 'keyboard.mp3', icon: Keyboard },
  { id: 'white-noise', name: '白噪音', category: 'noise', file: 'white-noise.mp3', icon: Disc },
  { id: 'brown-noise', name: '棕色噪音', category: 'noise', file: 'brown-noise.mp3', icon: Disc },
  { id: 'pink-noise', name: '粉色噪音', category: 'noise', file: 'pink-noise.mp3', icon: Disc }
];

export interface FontItem {
  id: string;
  name: string;
  family: string;
}

export const FONTS_LIST: FontItem[] = [
  { id: 'font-sans', name: '系统默认 (Sans)', family: '"Inter", system-ui, sans-serif' },
  { id: 'font-serif-sc', name: '雅致宋体 (Serif)', family: '"Noto Serif SC", serif' },
  { id: 'font-magazine', name: '精致杂志 (Magazine)', family: '"ZCOOL XiaoWei", serif' },
  { id: 'font-handwrite', name: '静谧手写 (Long)', family: '"Long Cang", cursive' },
  { id: 'font-brush', name: '大雅楷体 (Brush)', family: '"Ma Shan Zheng", cursive' },
  { id: 'font-playfair', name: '古典文艺 (Playfair)', family: '"Playfair Display", serif' },
  { id: 'font-mono', name: '极客等宽 (Mono)', family: '"JetBrains Mono", monospace' },
];

interface SidebarSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RainSettings;
  onSettingsChange: (newSettings: RainSettings) => void;
  presets: BackgroundPreset[];
  activePresetId: PresetId;
  onPresetSelect: (presetId: PresetId) => void;
  customMedia: {
    type: 'image' | 'video' | null;
    url: string | null;
    name: string | null;
    rotation: number;
    flipH: boolean;
    flipV: boolean;
  };
  onMediaUpload: (file: File) => void;
  onClearMedia: () => void;
  onUpdateMediaTransform: (transform: { rotation?: number; flipH?: boolean; flipV?: boolean }) => void;
  activeFontId: string;
  onFontSelect: (fontId: string) => void;
}

export default function SidebarSettings({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  presets,
  activePresetId,
  onPresetSelect,
  customMedia,
  onMediaUpload,
  onClearMedia,
  onUpdateMediaTransform,
  activeFontId,
  onFontSelect,
}: SidebarSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSliderChange = (key: keyof RainSettings, val: number | boolean) => {
    onSettingsChange({
      ...settings,
      [key]: val,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onMediaUpload(e.target.files[0]);
    }
  };

  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-black/40 backdrop-blur-2xl border-l border-white/15 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
    }`}>
      
      {/* Sidebar Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Sliders className="w-5 h-5 text-[#E5A7B8]" />
          <h2 className="text-base font-bold text-white tracking-tight">雨景环境面板</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
          title="关闭面板"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-7 custom-scrollbar pb-16">
        
        {/* Section 1: Rain Shader Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#E5A7B8] flex items-center space-x-1.5 border-b border-white/10 pb-2">
            <CloudRain className="w-4 h-4" />
            <span>着色器参数调节</span>
          </h3>

          {/* Rain Amount */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-white/60">
              <span>雨量强度 (Rain Amount)</span>
              <span className="font-mono text-[#E5A7B8] font-medium">{Math.round(settings.rainAmount * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={settings.rainAmount}
              onChange={(e) => handleSliderChange('rainAmount', parseFloat(e.target.value))}
              className="w-full accent-[#E5A7B8] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Mist Density */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-white/60">
              <span>玻璃雾化度 (Mist Density)</span>
              <span className="font-mono text-[#E5A7B8] font-medium">{settings.mistDensity.toFixed(1)}x</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="2" 
              step="0.1"
              value={settings.mistDensity}
              onChange={(e) => handleSliderChange('mistDensity', parseFloat(e.target.value))}
              className="w-full accent-[#E5A7B8] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Refraction Strength */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-white/60">
              <span>折射率/透射力 (Refraction)</span>
              <span className="font-mono text-[#E5A7B8] font-medium">{settings.refraction.toFixed(1)}x</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="3" 
              step="0.1"
              value={settings.refraction}
              onChange={(e) => handleSliderChange('refraction', parseFloat(e.target.value))}
              className="w-full accent-[#E5A7B8] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Zoom Factor */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-white/60">
              <span>视场缩放 (Camera Zoom)</span>
              <span className="font-mono text-[#E5A7B8] font-medium">{settings.zoom.toFixed(1)}x</span>
            </div>
            <input 
              type="range" 
              min="0.3" 
              max="2.5" 
              step="0.1"
              value={settings.zoom}
              onChange={(e) => handleSliderChange('zoom', parseFloat(e.target.value))}
              className="w-full accent-[#E5A7B8] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Animation Speed */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-white/60">
              <span>雨流速度 (Drop Speed)</span>
              <span className="font-mono text-[#E5A7B8] font-medium">{settings.speed.toFixed(1)}x</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="3.0" 
              step="0.1"
              value={settings.speed}
              onChange={(e) => handleSliderChange('speed', parseFloat(e.target.value))}
              className="w-full accent-[#E5A7B8] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

          {/* Fluid Gradient Presets */}
          <div className="space-y-3.5 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#E5A7B8] flex items-center space-x-1.5 border-b border-white/10 pb-2">
              <Sparkles className="w-4 h-4" />
              <span>背景渐变预设</span>
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPresetSelect(p.id)}
                  disabled={!!customMedia.url}
                  className={`group text-left p-3 rounded-2xl border text-xs transition-all relative overflow-hidden cursor-pointer ${
                    activePresetId === p.id && !customMedia.url
                      ? 'border-[#E5A7B8] bg-white/15'
                      : 'border-white/10 hover:border-white/20 bg-white/5 disabled:opacity-20 disabled:hover:border-white/10'
                  }`}
                >
                  {/* Dynamic Overlapping color previews with high-contrast white borders and soft shadows */}
                  <div className="flex items-center mb-1.5">
                    <div className="flex -space-x-1.5">
                      <span className="w-5 h-5 rounded-full border border-white/40 shadow-sm relative z-10 block" style={{ backgroundColor: p.color1 }} />
                      <span className="w-5 h-5 rounded-full border border-white/40 shadow-sm block" style={{ backgroundColor: p.color2 }} />
                    </div>
                  </div>
                  <div className="font-semibold text-white group-hover:text-[#E5A7B8] transition-colors">{p.name}</div>
                  <div className="text-[9px] text-white/50 line-clamp-1 mt-0.5">{p.description}</div>
                </button>
              ))}
            </div>
          </div>

        {/* Section 4: Media Upload */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#E5A7B8] flex items-center space-x-1.5 border-b border-white/10 pb-2">
            <ImageIcon className="w-4 h-4" />
            <span>自定义媒体背景</span>
          </h3>
          
          <div className="space-y-2.5">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
            />
            
            {customMedia.url ? (
              <div className="space-y-2">
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    {customMedia.type === 'video' ? (
                      <VideoIcon className="w-5 h-5 text-[#E5A7B8] shrink-0" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-[#E5A7B8] shrink-0" />
                    )}
                    <div className="text-xs min-w-0">
                      <div className="font-semibold text-white truncate">
                        {customMedia.name || '已载入自定义媒体'}
                      </div>
                      <div className="text-[10px] text-[#E5A7B8] font-medium uppercase tracking-wide">
                        {customMedia.type === 'video' ? '视频背景' : '图片背景'}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={onClearMedia}
                    className="p-1.5 rounded-xl bg-white/10 text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all shrink-0 cursor-pointer"
                    title="恢复默认渐变"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 媒体方向调整工具栏 */}
                <div className="grid grid-cols-3 gap-2 pt-0.5">
                  <button
                    onClick={() => onUpdateMediaTransform({ rotation: (customMedia.rotation + 90) % 360 })}
                    className="py-2 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[11px] text-white/80 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    title="顺时针旋转90度"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-[#E5A7B8]" />
                    <span>旋转 90°</span>
                  </button>
                  <button
                    onClick={() => onUpdateMediaTransform({ flipH: !customMedia.flipH })}
                    className={`py-2 px-2 rounded-xl border text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                      customMedia.flipH 
                        ? 'bg-[#E5A7B8]/20 border-[#E5A7B8]/40 text-[#E5A7B8]' 
                        : 'bg-white/5 border-white/10 hover:border-white/20 text-white/80 hover:text-white'
                    }`}
                    title="左右翻转"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>左右翻转</span>
                  </button>
                  <button
                    onClick={() => onUpdateMediaTransform({ flipV: !customMedia.flipV })}
                    className={`py-2 px-2 rounded-xl border text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                      customMedia.flipV 
                        ? 'bg-[#E5A7B8]/20 border-[#E5A7B8]/40 text-[#E5A7B8]' 
                        : 'bg-white/5 border-white/10 hover:border-white/20 text-white/80 hover:text-white'
                    }`}
                    title="上下翻转"
                  >
                    <FlipVertical className="w-3.5 h-3.5" />
                    <span>上下翻转</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 border-2 border-dashed border-white/10 hover:border-[#E5A7B8]/50 bg-white/5 hover:bg-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-xs text-white/60 hover:text-white transition-all cursor-pointer group"
              >
                <Upload className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
                <span className="font-medium">点击上传背景图片或视频</span>
                <span className="text-[10px] text-white/40">支持 JPG, PNG, MP4 等</span>
              </button>
            )}
          </div>
        </div>

        {/* Section 5: Editor Fonts Selection */}
        <div className="space-y-3.5 pb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#E5A7B8] flex items-center space-x-1.5 border-b border-white/10 pb-2">
            <Type className="w-4 h-4" />
            <span>编辑器字体样式</span>
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {FONTS_LIST.map((f) => (
              <button
                key={f.id}
                onClick={() => onFontSelect(f.id)}
                className={`group text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                  activeFontId === f.id
                    ? 'border-[#E5A7B8] bg-white/15'
                    : 'border-white/10 hover:border-white/20 bg-white/5'
                }`}
                style={{ fontFamily: f.family }}
              >
                <div className="font-semibold text-white group-hover:text-[#E5A7B8] transition-colors text-xs truncate">
                  {f.name}
                </div>
                <div className="text-[10px] text-white/40 truncate mt-1">
                  雨落长街，笔尖落寞
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
