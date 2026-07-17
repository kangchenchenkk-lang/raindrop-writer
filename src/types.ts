export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type PresetId = 'default-fluid' | 'warm-sunset' | 'neon-cyberpunk' | 'deep-sea' | 'forest-mist' | 'soft-pink';

export interface BackgroundPreset {
  id: PresetId;
  name: string;
  color1: string;
  color2: string;
  description: string;
}

export interface RainSettings {
  rainAmount: number; // 0.0 to 1.0
  mistDensity: number; // 0.0 to 2.0 (scales maxBlur and minBlur)
  refraction: number; // 0.0 to 3.0 (scales normal offsets)
  zoom: number; // 0.5 to 2.0
  speed: number; // 0.1 to 2.0
  hasHeart: boolean; // Enables the HAS_HEART visual mode
  heartProgress: number; // Slider/Timer driven T value when dragging heart
}
