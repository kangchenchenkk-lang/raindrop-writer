<img width="2940" height="1602" alt="image" src="https://github.com/user-attachments/assets/5803657c-4f92-455d-9280-26c0a0fd6cbd" />


# 🌧️ Raindrop Ambient Editor

> Raindrop Ambient Editor 是一个融合 GLSL 实时雨滴渲染、东方美学壁纸与多声道白噪音的沉浸式氛围编辑器。在 WebGL 驱动的拟真雨景中写作、冥想与放松，打造属于你的静谧空间。

本项目灵感源自小红书博主 @秒秒Guo 的教程，在此致以诚挚感谢。



---

## ✨ 功能特性

| 模块 | 说明 |
|------|------|
| 🌧️ **拟真雨滴渲染** | 基于 **GLSL（OpenGL Shading Language）** 编写自定义着色器，在 GPU 端并行计算雨滴运动轨迹、碰撞融合与玻璃折射效果，相比 CPU 渲染性能提升数倍，流畅支持高分辨率与高刷新率设备 |
| 🌸 **东方美学预设** | 落樱拂雪 · 樱漫枝头 · 深邃雨夜 · 古韵廊桥 · 绿意初绽 · 雨中车站 |
| 🎬 **自定义素材导入** | 支持跨域图片与循环视频链接，可将 Live 壁纸、动漫场景转为专属背景 |
| 🎵 **多通道音效控制** | 雨声 · 雷声 · 风声独立音量调节，支持一键全局静音 |
| 🖼️ **氛围卡片导出** | 一键生成纵向滚动式精致预览卡片，适配社交平台分享场景 |
| 📱 **全端自适应** | 完美适配桌面、平板与移动端，支持触屏手势操作 |

---

## 🖼️ 预览

<img width="2940" height="1602" alt="落樱拂雪" src="https://github.com/user-attachments/assets/5e5bf07f-c368-417e-90f1-8b58c2cbfba9" />

<img width="2940" height="1602" alt="深邃雨夜" src="https://github.com/user-attachments/assets/66bfe162-4f5f-48c9-9eb0-0e8051252536" />

<img width="2940" height="1602" alt="古韵廊桥" src="https://github.com/user-attachments/assets/56aea423-682a-42df-8a6e-eb0d69167a65" />

---

## 🛠️ 技术栈

- **核心框架**：[React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) — 强类型声明式组件开发
- **构建工具**：[Vite](https://vite.dev/) — 极速热重载与高效生产打包
- **动效引擎**：[Motion](https://motion.dev/) — 优雅舒缓的组件过渡动画
- **样式方案**：[Tailwind CSS](https://tailwindcss.com/) — 高对比度呼吸感响应式设计
- **图标系统**：[Lucide React](https://lucide.dev/) — 精致轻量矢量图标
- **渲染引擎**：**WebGL 2.0 + GLSL 着色器** — 雨滴的生成、运动、碰撞与折射效果全部在 GPU 中并行完成，利用片段着色器（Fragment Shader）与顶点着色器（Vertex Shader）实现雨丝拖尾、水滴形变、光线扭曲等写实视觉效果

---

## 💡 使用指南

### 🎨 切换氛围预设
在右侧控制面板中点击 **「预设背景壁纸」**，即可在六种东方美学场景间自由切换。雨滴密度与玻璃折射效果会随场景自动适配。

### 🎬 打造专属工作台
1. 打开右侧设置面板中的 **「自定义背景」**
2. 粘贴图片或视频直链（需支持 CORS 跨域）
3. 调节 **「雨滴速度」**、**「降雨强度」** 与 **「风向角度」**，为背景叠加独特的雨中玻璃质感

### 🖼️ 导出氛围卡片
1. 点击底部或侧边栏的 **「分享 / 导出」**
2. 选择卡片皮肤模板（温润原木 · 经典流沙 · 古典竹绿 等）
3. 输入心情寄语或自习心得
4. 在 **「纵向美学卡片预览」** 中确认效果，一键保存并分享至社交平台

---

## 📦 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器（访问 http://localhost:3000）
npm run dev

# 代码检查
npm run lint

# 生产环境打包（输出至 dist 目录）
npm run build
```

---

> *“雨声是地球的呼吸，在这一刻，静下心来，创造你的静谧一隅。”* 🌧️
