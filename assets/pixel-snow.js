const vertexShader = `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentShader = `#version 300 es
precision mediump float;
precision highp int;

uniform float uTime;
uniform vec2 uResolution;
uniform float uFlakeSize;
uniform float uMinFlakeSize;
uniform float uPixelResolution;
uniform float uSpeed;
uniform float uDepthFade;
uniform float uFarPlane;
uniform vec3 uColor;
uniform float uBrightness;
uniform float uGamma;
uniform float uDensity;
uniform float uVariant;
uniform float uDirection;

out vec4 outColor;

#define PI 3.14159265
#define PI_OVER_6 0.5235988
#define PI_OVER_3 1.0471976
#define M1 1597334677U
#define M2 3812015801U
#define M3 3299493293U
#define F0 2.3283064e-10
#define hash(n) (n * (n ^ (n >> 15)))
#define coord3(p) (uvec3(p).x * M1 ^ uvec3(p).y * M2 ^ uvec3(p).z * M3)

const vec3 camK = vec3(0.57735027, 0.57735027, 0.57735027);
const vec3 camI = vec3(0.70710678, 0.0, -0.70710678);
const vec3 camJ = vec3(-0.40824829, 0.81649658, -0.40824829);
const vec2 b1d = vec2(0.574, 0.819);

vec3 hash3(uint n) {
  uvec3 hashed = hash(n) * uvec3(1U, 511U, 262143U);
  return vec3(hashed) * F0;
}

float snowflakeDist(vec2 p) {
  float r = length(p);
  float a = atan(p.y, p.x);
  a = abs(mod(a + PI_OVER_6, PI_OVER_3) - PI_OVER_6);
  vec2 q = r * vec2(cos(a), sin(a));
  float dMain = max(abs(q.y), max(-q.x, q.x - 1.0));
  float b1t = clamp(dot(q - vec2(0.4, 0.0), b1d), 0.0, 0.4);
  float dB1 = length(q - vec2(0.4, 0.0) - b1t * b1d);
  float b2t = clamp(dot(q - vec2(0.7, 0.0), b1d), 0.0, 0.25);
  float dB2 = length(q - vec2(0.7, 0.0) - b2t * b1d);
  return min(dMain, min(dB1, dB2)) * 10.0;
}

void main() {
  float invPixelRes = 1.0 / uPixelResolution;
  float pixelSize = max(1.0, floor(0.5 + uResolution.x * invPixelRes));
  float invPixelSize = 1.0 / pixelSize;

  vec2 fragCoord = floor(gl_FragCoord.xy * invPixelSize);
  vec2 res = uResolution * invPixelSize;
  float invResX = 1.0 / res.x;

  vec3 ray = normalize(vec3((fragCoord - res * 0.5) * invResX, 1.0));
  ray = ray.x * camI + ray.y * camJ + ray.z * camK;

  float timeSpeed = uTime * uSpeed;
  float windX = cos(uDirection) * 0.4;
  float windY = sin(uDirection) * 0.4;
  vec3 camPos = (windX * camI + windY * camJ + 0.1 * camK) * timeSpeed;
  vec3 pos = camPos;

  vec3 absRay = max(abs(ray), vec3(0.001));
  vec3 strides = 1.0 / absRay;
  vec3 raySign = step(ray, vec3(0.0));
  vec3 phase = fract(pos) * strides;
  phase = mix(strides - phase, phase, raySign);

  float rayDotCamK = dot(ray, camK);
  float invRayDotCamK = 1.0 / rayDotCamK;
  float invDepthFade = 1.0 / uDepthFade;
  float halfInvResX = 0.5 * invResX;
  vec3 timeAnim = timeSpeed * 0.1 * vec3(7.0, 8.0, 5.0);

  float t = 0.0;
  for (int i = 0; i < 128; i++) {
    if (t >= uFarPlane) break;

    vec3 fpos = floor(pos);
    uint cellCoord = coord3(fpos);
    float cellHash = hash3(cellCoord).x;

    if (cellHash < uDensity) {
      vec3 h = hash3(cellCoord);
      vec3 sinArg1 = fpos.yzx * 0.073;
      vec3 sinArg2 = fpos.zxy * 0.27;
      vec3 flakePos = 0.5 - 0.5 * cos(4.0 * sin(sinArg1) + 4.0 * sin(sinArg2) + 2.0 * h + timeAnim);
      flakePos = flakePos * 0.8 + 0.1 + fpos;

      float toIntersection = dot(flakePos - pos, camK) * invRayDotCamK;
      if (toIntersection > 0.0) {
        vec3 testPos = pos + ray * toIntersection - flakePos;
        float testX = dot(testPos, camI);
        float testY = dot(testPos, camJ);
        vec2 testUV = abs(vec2(testX, testY));
        float depth = dot(flakePos - camPos, camK);
        float flakeSize = max(uFlakeSize, uMinFlakeSize * depth * halfInvResX);
        float dist;
        if (uVariant < 0.5) {
          dist = max(testUV.x, testUV.y);
        } else if (uVariant < 1.5) {
          dist = length(testUV);
        } else {
          float invFlakeSize = 1.0 / flakeSize;
          dist = snowflakeDist(vec2(testX, testY) * invFlakeSize) * flakeSize;
        }

        if (dist < flakeSize) {
          float flakeSizeRatio = uFlakeSize / flakeSize;
          float intensity = exp2(-(t + toIntersection) * invDepthFade) * min(1.0, flakeSizeRatio * flakeSizeRatio) * uBrightness;
          outColor = vec4(uColor * pow(vec3(intensity), vec3(uGamma)), 1.0);
          return;
        }
      }
    }

    float nextStep = min(min(phase.x, phase.y), phase.z);
    vec3 sel = step(phase, vec3(nextStep));
    phase = phase - nextStep + strides * sel;
    t += nextStep;
    pos = mix(pos + ray * nextStep, floor(pos + ray * nextStep + 0.5), sel);
  }

  outColor = vec4(0.0);
}`;

const DEFAULTS = Object.freeze({
    brightness: 1,
    color: '#ffffff',
    density: .3,
    depthFade: 5,
    direction: 125,
    farPlane: 20,
    flakeSize: .015,
    gamma: .4545,
    minFlakeSize: 1.25,
    pixelResolution: 500,
    speed: 1.25,
    variant: 'snowflake',
});

function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(error || 'PixelSnow shader compilation failed.');
    }
    return shader;
}

function createProgram(gl) {
    const program = gl.createProgram();
    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const error = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(error || 'PixelSnow program link failed.');
    }
    return program;
}

function colorVector(value) {
    const normalized = String(value).replace('#', '');
    const hex = normalized.length === 3
        ? normalized.split('').map((part) => part + part).join('')
        : normalized;
    return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255 || 0);
}

function variantValue(variant) {
    return variant === 'round' ? 1 : variant === 'snowflake' ? 2 : 0;
}

/**
 * Framework-free runtime for the supplied React Bits PixelSnow shader.
 * The scene math and uniforms match the supplied component; only React lifecycle code is replaced.
 */
export function createPixelSnow(canvas, options = {}) {
    if (!(canvas instanceof HTMLCanvasElement)) {
        throw new TypeError('PixelSnow requires a canvas element.');
    }
    const settings = { ...DEFAULTS, ...options };
    {
    if (typeof Worker === 'undefined' || typeof canvas.transferControlToOffscreen !== 'function') {
        throw new Error('PixelSnow requires OffscreenCanvas worker support.');
    }
    const worker = new Worker(import.meta.url, { type: 'module' });
    const offscreen = canvas.transferControlToOffscreen();
    const resize = () => {
        const container = canvas.parentElement;
        if (!container) {
            return;
        }
        worker.postMessage({
            type: 'resize',
            width: Math.max(1, Math.round(container.offsetWidth)),
            height: Math.max(1, Math.round(container.offsetHeight)),
            ratio: Math.min(window.devicePixelRatio, 2),
        });
    };
    let resizeTimer = null;
    const scheduleResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(resize, 100);
    };
    const visibilityObserver = new IntersectionObserver(([entry]) => {
        worker.postMessage({ type: 'visibility', visible: entry.isIntersecting });
    }, { threshold: 0 });
    const resizeObserver = new ResizeObserver(scheduleResize);
    visibilityObserver.observe(canvas);
    resizeObserver.observe(canvas.parentElement || canvas);
    worker.postMessage({
        type: 'init',
        canvas: offscreen,
        options: settings,
        width: Math.max(1, Math.round((canvas.parentElement || canvas).offsetWidth)),
        height: Math.max(1, Math.round((canvas.parentElement || canvas).offsetHeight)),
        ratio: Math.min(window.devicePixelRatio, 2),
    }, [offscreen]);
    return {
        destroy() {
            window.clearTimeout(resizeTimer);
            visibilityObserver.disconnect();
            resizeObserver.disconnect();
            worker.postMessage({ type: 'destroy' });
            worker.terminate();
        },
    };
    }

    const gl = canvas.getContext('webgl2', {
        alpha: true,
        antialias: false,
        depth: false,
        premultipliedAlpha: false,
        powerPreference: 'high-performance',
        stencil: false,
    });
    if (!gl) {
        throw new Error('PixelSnow requires WebGL2.');
    }

    const program = createProgram(gl);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW);
    gl.useProgram(program);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms = Object.fromEntries([
        'uTime', 'uResolution', 'uFlakeSize', 'uMinFlakeSize', 'uPixelResolution', 'uSpeed',
        'uDepthFade', 'uFarPlane', 'uColor', 'uBrightness', 'uGamma', 'uDensity', 'uVariant', 'uDirection',
    ].map((name) => [name, gl.getUniformLocation(program, name)]));
    const setUniforms = () => {
        gl.uniform1f(uniforms.uFlakeSize, settings.flakeSize);
        gl.uniform1f(uniforms.uMinFlakeSize, settings.minFlakeSize);
        gl.uniform1f(uniforms.uPixelResolution, settings.pixelResolution);
        gl.uniform1f(uniforms.uSpeed, settings.speed);
        gl.uniform1f(uniforms.uDepthFade, settings.depthFade);
        gl.uniform1f(uniforms.uFarPlane, settings.farPlane);
        gl.uniform3fv(uniforms.uColor, colorVector(settings.color));
        gl.uniform1f(uniforms.uBrightness, settings.brightness);
        gl.uniform1f(uniforms.uGamma, settings.gamma);
        gl.uniform1f(uniforms.uDensity, settings.density);
        gl.uniform1f(uniforms.uVariant, variantValue(settings.variant));
        gl.uniform1f(uniforms.uDirection, settings.direction * Math.PI / 180);
    };
    setUniforms();

    let animationFrame = 0;
    let isVisible = true;
    let resizeTimer = null;
    const startTime = performance.now();
    const resize = () => {
        const container = canvas.parentElement;
        if (!container) {
            return;
        }
        const width = Math.max(1, Math.round(container.offsetWidth));
        const height = Math.max(1, Math.round(container.offsetHeight));
        const ratio = Math.min(window.devicePixelRatio, 2);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(program);
        gl.uniform2f(uniforms.uResolution, width, height);
    };
    const scheduleResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(resize, 100);
    };
    const visibilityObserver = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
    }, { threshold: 0 });
    visibilityObserver.observe(canvas);
    window.addEventListener('resize', scheduleResize);
    resize();

    const animate = () => {
        animationFrame = requestAnimationFrame(animate);
        if (!isVisible) {
            return;
        }
        gl.useProgram(program);
        gl.uniform1f(uniforms.uTime, (performance.now() - startTime) * .001);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    animate();

    return {
        destroy() {
            cancelAnimationFrame(animationFrame);
            window.clearTimeout(resizeTimer);
            visibilityObserver.disconnect();
            window.removeEventListener('resize', scheduleResize);
            gl.deleteBuffer(positionBuffer);
            gl.deleteProgram(program);
            gl.getExtension('WEBGL_lose_context')?.loseContext();
        },
    };
}

function startPixelSnowWorker() {
    let animationFrame = 0;
    let gl = null;
    let isVisible = true;
    let program = null;
    let startTime = 0;
    let uniforms = null;
    const scheduleFrame = typeof self.requestAnimationFrame === 'function'
        ? self.requestAnimationFrame.bind(self)
        : (callback) => self.setTimeout(() => callback(performance.now()), 16);

    const resize = ({ width, height, ratio }) => {
        if (!gl || !uniforms) {
            return;
        }
        gl.canvas.width = Math.round(width * ratio);
        gl.canvas.height = Math.round(height * ratio);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.useProgram(program);
        gl.uniform2f(uniforms.uResolution, width, height);
    };
    const render = () => {
        animationFrame = scheduleFrame(render);
        if (!isVisible || !gl || !uniforms) {
            return;
        }
        gl.useProgram(program);
        gl.uniform1f(uniforms.uTime, (performance.now() - startTime) * .001);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    self.onmessage = ({ data }) => {
        if (data.type === 'visibility') {
            isVisible = data.visible;
            return;
        }
        if (data.type === 'resize') {
            resize(data);
            return;
        }
        if (data.type === 'destroy') {
            self.cancelAnimationFrame?.(animationFrame);
            gl?.getExtension('WEBGL_lose_context')?.loseContext();
            return;
        }
        if (data.type !== 'init') {
            return;
        }
        try {
            gl = data.canvas.getContext('webgl2', {
                alpha: true,
                antialias: false,
                depth: false,
                premultipliedAlpha: false,
                powerPreference: 'high-performance',
                stencil: false,
            });
            if (!gl) {
                throw new Error('PixelSnow requires WebGL2.');
            }
            const settings = { ...DEFAULTS, ...data.options };
            program = createProgram(gl);
            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -1, -1, 1, -1, -1, 1,
                -1, 1, 1, -1, 1, 1,
            ]), gl.STATIC_DRAW);
            gl.useProgram(program);
            const position = gl.getAttribLocation(program, 'position');
            gl.enableVertexAttribArray(position);
            gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
            uniforms = Object.fromEntries([
                'uTime', 'uResolution', 'uFlakeSize', 'uMinFlakeSize', 'uPixelResolution', 'uSpeed',
                'uDepthFade', 'uFarPlane', 'uColor', 'uBrightness', 'uGamma', 'uDensity', 'uVariant', 'uDirection',
            ].map((name) => [name, gl.getUniformLocation(program, name)]));
            gl.uniform1f(uniforms.uFlakeSize, settings.flakeSize);
            gl.uniform1f(uniforms.uMinFlakeSize, settings.minFlakeSize);
            gl.uniform1f(uniforms.uPixelResolution, settings.pixelResolution);
            gl.uniform1f(uniforms.uSpeed, settings.speed);
            gl.uniform1f(uniforms.uDepthFade, settings.depthFade);
            gl.uniform1f(uniforms.uFarPlane, settings.farPlane);
            gl.uniform3fv(uniforms.uColor, colorVector(settings.color));
            gl.uniform1f(uniforms.uBrightness, settings.brightness);
            gl.uniform1f(uniforms.uGamma, settings.gamma);
            gl.uniform1f(uniforms.uDensity, settings.density);
            gl.uniform1f(uniforms.uVariant, variantValue(settings.variant));
            gl.uniform1f(uniforms.uDirection, settings.direction * Math.PI / 180);
            resize(data);
            startTime = performance.now();
            render();
        } catch (error) {
            self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
        }
    };
}

if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
    startPixelSnowWorker();
}
