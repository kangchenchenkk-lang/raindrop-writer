import React, { useEffect, useRef, useState } from 'react';
import { RainSettings, BackgroundPreset } from '../types';

interface RainCanvasProps {
  settings: RainSettings;
  preset: BackgroundPreset;
  customMedia: {
    type: 'image' | 'video' | null;
    url: string | null;
    rotation?: number;
    flipH?: boolean;
    flipV?: boolean;
  };
  isPlaying: boolean;
}

export default function RainCanvas({
  settings,
  preset,
  customMedia,
  isPlaying,
}: RainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // WebGL references
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Track rendering times and interactions
  const startTimeRef = useRef<number>(Date.now());
  const lastTimeRef = useRef<number>(Date.now());
  const totalAccumulatedTimeRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number; clickX: number; clickY: number; isDown: boolean }>({
    x: 0,
    y: 0,
    clickX: -1000,
    clickY: -1000,
    isDown: false,
  });

  // Track lightning flash state
  const lastLightningStateRef = useRef<number>(0);

  // Manage custom media loading state
  const [mediaLoaded, setMediaLoaded] = useState<boolean>(false);

  // Initialize offscreen canvas (1024x1024 for clean power-of-two mipmaps)
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    offscreenCanvasRef.current = canvas;
  }, []);

  // Set up custom media (image/video) loading
  useEffect(() => {
    setMediaLoaded(false);

    if (customMedia.type === 'image' && customMedia.url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = customMedia.url;
      img.onload = () => {
        imageRef.current = img;
        setMediaLoaded(true);
      };
    } else if (customMedia.type === 'video' && customMedia.url) {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = customMedia.url;
      video.loop = true;
      video.muted = false; // Enable sound by default
      video.playsInline = true;
      video.autoplay = true;
      video.onloadeddata = () => {
        videoRef.current = video;
        video.play().catch((err) => {
          console.log('Autoplay unmuted video error, trying muted:', err);
          // Fallback to muted if browser blocks unmuted autoplay
          video.muted = true;
          video.play().catch((err2) => console.log('Autoplay failed entirely:', err2));
        });
        setMediaLoaded(true);
      };
      return () => {
        video.pause();
        video.src = '';
        video.load();
        videoRef.current = null;
      };
    } else {
      // Fluid gradient (no custom media)
      setMediaLoaded(true);
    }
  }, [customMedia]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const width = canvas.parentElement?.clientWidth || window.innerWidth;
      const height = canvas.parentElement?.clientHeight || window.innerHeight;
      
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = '100%';
      canvas.style.height = '100%';

      // Adjust offscreen canvas size to match aspect ratio, keeping max dimension of 1024
      const offscreen = offscreenCanvasRef.current;
      if (offscreen) {
        const maxDim = 1024;
        if (width >= height) {
          offscreen.width = maxDim;
          offscreen.height = Math.max(1, Math.round(maxDim * (height / width)));
        } else {
          offscreen.height = maxDim;
          offscreen.width = Math.max(1, Math.round(maxDim * (width / height)));
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // WebGL 2 Initialization & Shader Compilation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { alpha: false, depth: false, antialias: true });
    if (!gl) {
      console.error('WebGL 2 is not supported in this browser.');
      return;
    }
    glRef.current = gl;

    // Vertex Shader
    const vsSource = `#version 300 es
      in vec2 position;
      out vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment Shader (adapted from Martijn Steinrucken's Heartfelt shader)
    const fsSource = `#version 300 es
      precision highp float;
      
      in vec2 vUv;
      out vec4 fragColor;

      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec4 iMouse;
      uniform sampler2D iChannel0;

      // Custom sliders
      uniform float uRainAmount;
      uniform float uMistDensity;
      uniform float uRefraction;
      uniform float uZoom;
      uniform float uSpeed;

      #define S(a, b, t) smoothstep(a, b, t)

      vec3 N13(float p) {
         vec3 p3 = fract(vec3(p) * vec3(.1031,.11369,.13787));
         p3 += dot(p3, p3.yzx + 19.19);
         return fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
      }

      float N(float t) {
          return fract(sin(t*12345.564)*7658.76);
      }

      float Saw(float b, float t) {
          return S(0., b, t)*S(1., b, t);
      }

      vec2 DropLayer2(vec2 uv, float t) {
          vec2 UV = uv;
          
          uv.y += t*0.75;
          vec2 a = vec2(6., 1.);
          vec2 grid = a*2.;
          vec2 id = floor(uv*grid);
          
          float colShift = N(id.x); 
          uv.y += colShift;
          
          id = floor(uv*grid);
          vec3 n = N13(id.x*35.2+id.y*2376.1);
          vec2 st = fract(uv*grid)-vec2(.5, 0);
          
          float x = n.x-.5;
          
          float y = UV.y*20.;
          float wiggle = sin(y+sin(y));
          x += wiggle*(.5-abs(x))*(n.z-.5);
          x *= .7;
          float ti = fract(t+n.z);
          y = (Saw(.85, ti)-.5)*.9+.5;
          vec2 p = vec2(x, y);
          
          float d = length((st-p)*a.yx);
          
          float mainDrop = S(.4, .0, d);
          
          float r = sqrt(S(1., y, st.y));
          float cd = abs(st.x-x);
          float trail = S(.23*r, .15*r*r, cd);
          float trailFront = S(-.02, .02, st.y-y);
          trail *= trailFront*r*r;
          
          y = UV.y;
          float trail2 = S(.2*r, .0, cd);
          float droplets = max(0., (sin(y*(1.-y)*120.)-st.y))*trail2*trailFront*n.z;
          y = fract(y*10.)+(st.y-.5);
          float dd = length(st-vec2(x, y));
          droplets = S(.3, 0., dd);
          float m = mainDrop+droplets*r*trailFront;
          
          return vec2(m, trail);
      }

      float StaticDrops(vec2 uv, float t) {
          uv *= 40.;
          
          vec2 id = floor(uv);
          uv = fract(uv)-.5;
          vec3 n = N13(id.x*107.45+id.y*3543.654);
          vec2 p = (n.xy-.5)*.7;
          float d = length(uv-p);
          
          float fade = Saw(.025, fract(t+n.z));
          float c = S(.3, 0., d)*fract(n.z*10.)*fade;
          return c;
      }

      vec2 Drops(vec2 uv, float t, float l0, float l1, float l2) {
          vec2 scaledUv = uv * 2.40; // Increased multiplier from 1.55 to 2.40 to make all raindrops smaller
          float s = StaticDrops(scaledUv, t)*l0; 
          vec2 m1 = DropLayer2(scaledUv, t)*l1;
          vec2 m2 = DropLayer2(scaledUv*1.85, t)*l2;
          
          float c = s+m1.x+m2.x;
          c = S(.3, 1., c);
          
          return vec2(c, max(m1.y*l0, m2.y*l1));
      }

      void main() {
          vec2 fragCoord = gl_FragCoord.xy;
          
          vec2 uv = (fragCoord.xy-.5*iResolution.xy) / iResolution.y;
          vec2 UV = fragCoord.xy/iResolution.xy;
          
          float T = iTime;
          float t = T * .2;
          
          // Scale rain amount dynamically
          float rainIntensity = uRainAmount;
          
          // Map slider values for blur logic
          float maxBlur = mix(1.0, 7.5, rainIntensity) * uMistDensity;
          float minBlur = 1.0 * uMistDensity;
          
          // Handle Zoom Scale
          float zoom = uZoom;
          
          uv *= zoom;
          
          float staticDrops = S(-.5, 1., rainIntensity)*2.;
          float layer1 = S(.25, .75, rainIntensity);
          float layer2 = S(.0, .5, rainIntensity);
          
          vec2 c = Drops(uv, t, staticDrops, layer1, layer2);
          
          // Calculate Refraction Normals (high precision gradient)
          vec2 e = vec2(.001, 0.);
          float cx = Drops(uv+e, t, staticDrops, layer1, layer2).x;
          float cy = Drops(uv+e.yx, t, staticDrops, layer1, layer2).x;
          vec2 n = vec2(cx-c.x, cy-c.x) * uRefraction; // Scale refraction strength
          
          // Calculate blur based on trail thickness and droplets
          float focus = mix(maxBlur-c.y, minBlur, S(.1, .2, c.x));
          
          // Sample the background channel using textureLod for soft blur refraction
          vec3 col = textureLod(iChannel0, UV+n, focus).rgb;
          
          // POST-PROCESSING EFFECTS: VIGNETTE
          t = (T+3.)*.5;
          float colFade = sin(t*.2)*.5+.5;
          col *= mix(vec3(1.), vec3(.8, .9, 1.3), colFade); // subtle ambient color shifts
          
          float fade = S(0., 10., T); // Fade-in on load
          
          // Vignette
          vec2 vigUV = gl_FragCoord.xy / iResolution.xy;
          col *= 1.0 - dot(vigUV - 0.5, vigUV - 0.5) * 0.8;
          
          col *= fade;
          
          // Output final pixel color
          fragColor = vec4(col, 1.0);
      }
    `;

    // Compile Helper function
    const compileShader = (source: string, type: number): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    // Link Program
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Shader linking error:', gl.getProgramInfoLog(program));
      return;
    }
    programRef.current = program;

    // Clean up individual shaders
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    // Setup Geometry (Full Screen Quad)
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Setup Texture Object
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    textureRef.current = texture;

    // Handle Unbinding
    return () => {
      if (glRef.current) {
        glRef.current.deleteProgram(program);
        glRef.current.deleteTexture(texture);
        glRef.current.deleteBuffer(positionBuffer);
      }
    };
  }, []);

  // Set up mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * window.devicePixelRatio;
    const y = (canvas.height - (e.clientY - rect.top) * window.devicePixelRatio); // Flip Y
    mouseRef.current = {
      x,
      y,
      clickX: x,
      clickY: y,
      isDown: true,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mouseRef.current.isDown) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * window.devicePixelRatio;
    const y = (canvas.height - (e.clientY - rect.top) * window.devicePixelRatio); // Flip Y
    mouseRef.current.x = x;
    mouseRef.current.y = y;
  };

  const handleMouseUp = () => {
    mouseRef.current.isDown = false;
    mouseRef.current.clickX = -1000;
    mouseRef.current.clickY = -1000;
  };

  // The main rendering loop (Draws background to offscreen canvas -> Updates WebGL texture + generates mipmaps -> Executes shader)
  useEffect(() => {
    let active = true;

    const render = () => {
      if (!active) return;

      const gl = glRef.current;
      const canvas = canvasRef.current;
      const offscreen = offscreenCanvasRef.current;
      const program = programRef.current;
      const texture = textureRef.current;

      if (!gl || !canvas || !offscreen || !program || !texture) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // 1. Render/Update Background onto the Offscreen Canvas
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, offscreen.width, offscreen.height);

        if (customMedia.type === 'video' && videoRef.current && mediaLoaded) {
          // Render Video Frame
          const v = videoRef.current;
          const aspectCanvas = offscreen.width / offscreen.height;
          const aspectVideo = v.videoWidth / v.videoHeight;
          
          let sWidth = v.videoWidth;
          let sHeight = v.videoHeight;
          let sx = 0;
          let sy = 0;

          if (aspectVideo > aspectCanvas) {
            // Video is wider
            sWidth = v.videoHeight * aspectCanvas;
            sx = (v.videoWidth - sWidth) / 2;
          } else {
            // Video is taller
            sHeight = v.videoWidth / aspectCanvas;
            sy = (v.videoHeight - sHeight) / 2;
          }

          ctx.save();
          ctx.translate(offscreen.width / 2, offscreen.height / 2);
          if (customMedia.rotation) {
            ctx.rotate((customMedia.rotation * Math.PI) / 180);
          }
          const scaleX = customMedia.flipH ? -1 : 1;
          const scaleY = customMedia.flipV ? -1 : 1;
          ctx.scale(scaleX, scaleY);
          ctx.translate(-offscreen.width / 2, -offscreen.height / 2);

          ctx.drawImage(v, sx, sy, sWidth, sHeight, 0, 0, offscreen.width, offscreen.height);
          ctx.restore();
        } else if (customMedia.type === 'image' && imageRef.current && mediaLoaded) {
          // Render Image Frame
          const img = imageRef.current;
          const aspectCanvas = offscreen.width / offscreen.height;
          const aspectImg = img.width / img.height;
          
          let sWidth = img.width;
          let sHeight = img.height;
          let sx = 0;
          let sy = 0;

          if (aspectImg > aspectCanvas) {
            sWidth = img.height * aspectCanvas;
            sx = (img.width - sWidth) / 2;
          } else {
            sHeight = img.width / aspectCanvas;
            sy = (img.height - sHeight) / 2;
          }

          ctx.save();
          ctx.translate(offscreen.width / 2, offscreen.height / 2);
          if (customMedia.rotation) {
            ctx.rotate((customMedia.rotation * Math.PI) / 180);
          }
          const scaleX = customMedia.flipH ? -1 : 1;
          const scaleY = customMedia.flipV ? -1 : 1;
          ctx.scale(scaleX, scaleY);
          ctx.translate(-offscreen.width / 2, -offscreen.height / 2);

          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, offscreen.width, offscreen.height);
          ctx.restore();
        } else {
          // Draw dynamic fluid gradient (default or chosen presets)
          const time = isPlaying 
            ? totalAccumulatedTimeRef.current + (Date.now() - lastTimeRef.current) * settings.speed 
            : totalAccumulatedTimeRef.current;

          // Fill Background
          ctx.fillStyle = preset.color1;
          ctx.fillRect(0, 0, offscreen.width, offscreen.height);

          const maxDim = Math.max(offscreen.width, offscreen.height);

          // Animated Fluid Blob 1
          const x1 = offscreen.width * (0.5 + 0.3 * Math.sin(time * 0.0004));
          const y1 = offscreen.height * (0.5 + 0.3 * Math.cos(time * 0.0006));
          const r1 = maxDim * (0.6 + 0.1 * Math.sin(time * 0.0002));
          const grad1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, r1);
          grad1.addColorStop(0, preset.color2);
          grad1.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.globalCompositeOperation = preset.id === 'soft-pink' ? 'source-over' : 'screen';
          ctx.fillStyle = grad1;
          ctx.fillRect(0, 0, offscreen.width, offscreen.height);

          // Animated Fluid Blob 2 (Accent Blob to enrich color dynamics)
          const x2 = offscreen.width * (0.5 + 0.3 * Math.cos(time * 0.0005 + Math.PI));
          const y2 = offscreen.height * (0.5 + 0.25 * Math.sin(time * 0.0003));
          const r2 = maxDim * (0.5 + 0.15 * Math.cos(time * 0.0001));
          const grad2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, r2);
          
          // Compute distinct visual accent based on preset style
          let accentColor = '#ff6b6b';
          if (preset.id === 'neon-cyberpunk') accentColor = '#00f2fe';
          else if (preset.id === 'deep-sea') accentColor = '#00c6ff';
          else if (preset.id === 'forest-mist') accentColor = '#f5f7fa';
          else if (preset.id === 'warm-sunset') accentColor = '#f7ff00';
          else if (preset.id === 'soft-pink') accentColor = '#ffd3e1';

          grad2.addColorStop(0, accentColor);
          grad2.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.fillStyle = grad2;
          ctx.fillRect(0, 0, offscreen.width, offscreen.height);
          
          // Revert blend operations
          ctx.globalCompositeOperation = 'source-over';
        }
      }

      // Update accumulated playback time if playing
      if (isPlaying) {
        const now = Date.now();
        const delta = (now - lastTimeRef.current) * settings.speed;
        totalAccumulatedTimeRef.current += delta;
        lastTimeRef.current = now;
      } else {
        lastTimeRef.current = Date.now();
      }

      const totalSeconds = totalAccumulatedTimeRef.current / 1000.0;

      // 2. Bind and Update WebGL Texture
      gl.bindTexture(gl.TEXTURE_2D, texture);
      
      // Correct vertical flip of Canvas rendering inside WebGL
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      
      // Upload our offscreen canvas directly as our background texture sampler
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offscreen);
      gl.generateMipmap(gl.TEXTURE_2D);

      // 3. Render WebGL Frame
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);

      // Pass Screen & Interaction Uniforms
      const iResolutionLoc = gl.getUniformLocation(program, 'iResolution');
      gl.uniform2f(iResolutionLoc, canvas.width, canvas.height);

      const iTimeLoc = gl.getUniformLocation(program, 'iTime');
      gl.uniform1f(iTimeLoc, totalSeconds);

      const m = mouseRef.current;
      const iMouseLoc = gl.getUniformLocation(program, 'iMouse');
      gl.uniform4f(iMouseLoc, m.x, m.y, m.clickX, m.clickY);

      // Pass custom interactive sliders
      gl.uniform1f(gl.getUniformLocation(program, 'uRainAmount'), settings.rainAmount);
      gl.uniform1f(gl.getUniformLocation(program, 'uMistDensity'), settings.mistDensity);
      gl.uniform1f(gl.getUniformLocation(program, 'uRefraction'), settings.refraction);
      gl.uniform1f(gl.getUniformLocation(program, 'uZoom'), settings.zoom);
      gl.uniform1f(gl.getUniformLocation(program, 'uSpeed'), settings.speed);

      // Run WebGL fragment shader
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    // Start rendering loop
    lastTimeRef.current = Date.now();
    render();

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [preset, customMedia, mediaLoaded, isPlaying, settings]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none bg-black">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="block w-full h-full cursor-crosshair scale-[1.01]"
      />
    </div>
  );
}
