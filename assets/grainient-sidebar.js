const GRAINIENT_PARAMETERS = Object.freeze({
    timeSpeed: 1.6,
    colorBalance: 0.0,
    warpStrength: 1.0,
    warpFrequency: 5.0,
    warpSpeed: 2.0,
    warpAmplitude: 50.0,
    blendAngle: 0.0,
    blendSoftness: 0.05,
    rotationAmount: 500.0,
    noiseScale: 2.0,
    grainAmount: 0.1,
    grainScale: 2.0,
    grainAnimated: false,
    contrast: 1.5,
    gamma: 1.0,
    saturation: 1.0,
    centerX: 0.0,
    centerY: 0.0,
    zoom: 0.9,
});

const SIDEBAR_GRAINIENT_PRESET = Object.freeze({
    ...GRAINIENT_PARAMETERS,
    color1: '#8199A2',
    color2: '#45636F',
    color3: '#6E9285',
});

const TOGGLE_GRAINIENT_PRESET = Object.freeze({
    ...GRAINIENT_PARAMETERS,
    color1: '#74909B',
    color2: '#3A5B68',
    color3: '#A7C4B6',
});

const VERTEX_SHADER = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uTimeSpeed;
uniform float uColorBalance;
uniform float uWarpStrength;
uniform float uWarpFrequency;
uniform float uWarpSpeed;
uniform float uWarpAmplitude;
uniform float uBlendAngle;
uniform float uBlendSoftness;
uniform float uRotationAmount;
uniform float uNoiseScale;
uniform float uGrainAmount;
uniform float uGrainScale;
uniform float uGrainAnimated;
uniform float uContrast;
uniform float uGamma;
uniform float uSaturation;
uniform vec2 uCenterOffset;
uniform float uZoom;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
out vec4 fragColor;
#define S(a,b,t) smoothstep(a,b,t)
mat2 Rot(float a) { float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }
vec2 hash(vec2 p) { p = vec2(dot(p, vec2(2127.1, 81.17)), dot(p, vec2(1269.5, 283.37))); return fract(sin(p) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f); float n = mix(mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)), dot(-1.0 + 2.0 * hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x), mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(-1.0 + 2.0 * hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y); return 0.5 + 0.5 * n; }
void mainImage(out vec4 o, vec2 C) {
    float t = iTime * uTimeSpeed;
    vec2 uv = C / iResolution.xy;
    float ratio = iResolution.x / iResolution.y;
    vec2 tuv = uv - 0.5 + uCenterOffset;
    tuv /= max(uZoom, 0.001);
    float degree = noise(vec2(t * 0.1, tuv.x * tuv.y) * uNoiseScale);
    tuv.y *= 1.0 / ratio;
    tuv *= Rot(radians((degree - 0.5) * uRotationAmount + 180.0));
    tuv.y *= ratio;
    float amplitude = uWarpAmplitude / max(uWarpStrength, 0.001);
    float warpTime = t * uWarpSpeed;
    tuv.x += sin(tuv.y * uWarpFrequency + warpTime) / amplitude;
    tuv.y += sin(tuv.x * (uWarpFrequency * 1.5) + warpTime) / (amplitude * 0.5);
    float balance = uColorBalance, softness = max(uBlendSoftness, 0.0);
    float blendX = (tuv * Rot(radians(uBlendAngle))).x;
    float edge0 = -0.3 - balance - softness, edge1 = 0.2 - balance + softness;
    vec3 layer1 = mix(uColor3, uColor2, S(edge0, edge1, blendX));
    vec3 layer2 = mix(uColor2, uColor1, S(edge0, edge1, blendX));
    vec3 color = mix(layer1, layer2, S(0.5 - balance + softness, -0.3 - balance - softness, tuv.y));
    vec2 grainUv = uv * max(uGrainScale, 0.001);
    if (uGrainAnimated > 0.5) grainUv += vec2(iTime * 0.05);
    float grain = fract(sin(dot(grainUv, vec2(12.9898, 78.233))) * 43758.5453);
    color += (grain - 0.5) * uGrainAmount;
    color = (color - 0.5) * uContrast + 0.5;
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(luma), color, uSaturation);
    color = pow(max(color, 0.0), vec3(1.0 / max(uGamma, 0.001)));
    o = vec4(clamp(color, 0.0, 1.0), 1.0);
}
void main() { vec4 outputColor = vec4(0.0); mainImage(outputColor, gl_FragCoord.xy); fragColor = outputColor; }
`;

const UNIFORM_NAMES = [
    'iResolution', 'iTime', 'uTimeSpeed', 'uColorBalance', 'uWarpStrength',
    'uWarpFrequency', 'uWarpSpeed', 'uWarpAmplitude', 'uBlendAngle',
    'uBlendSoftness', 'uRotationAmount', 'uNoiseScale', 'uGrainAmount',
    'uGrainScale', 'uGrainAnimated', 'uContrast', 'uGamma', 'uSaturation',
    'uCenterOffset', 'uZoom', 'uColor1', 'uColor2', 'uColor3',
];

const hexToRgb = (hex) => [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);

const compileShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) || 'Grainient shader compilation failed.');
    }
    return shader;
};

function createRenderer(canvas) {
    const gl = canvas.getContext('webgl2', {
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
    });
    if (!gl) {
        return null;
    }

    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'Grainient program linking failed.');
    }

    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    return {
        gl,
        program,
        uniforms: Object.fromEntries(UNIFORM_NAMES.map((name) => [name, gl.getUniformLocation(program, name)])),
    };
}

function mountGrainient(target, { canvasId, className, preset, stateKey }) {
    const canvas = document.createElement('canvas');
    canvas.id = canvasId;
    canvas.className = className;
    canvas.setAttribute('aria-hidden', 'true');
    target.prepend(canvas);

    {
        if (typeof Worker === 'undefined' || typeof canvas.transferControlToOffscreen !== 'function') {
            console.warn('[玄尘渡] Grainient requires OffscreenCanvas worker support.');
            canvas.remove();
            return;
        }
        const worker = new Worker(import.meta.url, { type: 'module' });
        const offscreen = canvas.transferControlToOffscreen();
        const resize = () => worker.postMessage({
            type: 'resize',
            width: Math.max(1, Math.floor(target.getBoundingClientRect().width)),
            height: Math.max(1, Math.floor(target.getBoundingClientRect().height)),
        });
        const resizeObserver = new ResizeObserver(resize);
        const intersectionObserver = new IntersectionObserver(([entry]) => {
            worker.postMessage({ type: 'visibility', visible: entry.isIntersecting });
        });
        const onVisibilityChange = () => worker.postMessage({ type: 'page-visibility', visible: !document.hidden });
        resizeObserver.observe(target);
        intersectionObserver.observe(target);
        document.addEventListener('visibilitychange', onVisibilityChange);
        worker.postMessage({
            type: 'init',
            canvas: offscreen,
            preset,
            width: Math.max(1, Math.floor(target.getBoundingClientRect().width)),
            height: Math.max(1, Math.floor(target.getBoundingClientRect().height)),
            animated: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            visible: true,
        }, [offscreen]);
        target[stateKey] = {
            destroy() {
                resizeObserver.disconnect();
                intersectionObserver.disconnect();
                document.removeEventListener('visibilitychange', onVisibilityChange);
                worker.postMessage({ type: 'destroy' });
                worker.terminate();
                canvas.remove();
            },
        };
        return;
    }

    let renderer;
    try {
        renderer = createRenderer(canvas);
    } catch (error) {
        console.warn('[玄尘渡] Grainient 初始化失败。', error);
        canvas.remove();
        return;
    }
    if (!renderer) {
        canvas.remove();
        return;
    }

    const { gl, program, uniforms } = renderer;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startTime = performance.now();
    let frame = 0;
    let visible = true;
    let pageVisible = !document.hidden;

    const resize = () => {
        const rect = target.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));
        if (canvas.width === width && canvas.height === height) {
            return;
        }
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
    };

    const draw = (now) => {
        gl.useProgram(program);
        gl.uniform2f(uniforms.iResolution, canvas.width, canvas.height);
        gl.uniform1f(uniforms.iTime, (now - startTime) * 0.001);
        gl.uniform1f(uniforms.uTimeSpeed, preset.timeSpeed);
        gl.uniform1f(uniforms.uColorBalance, preset.colorBalance);
        gl.uniform1f(uniforms.uWarpStrength, preset.warpStrength);
        gl.uniform1f(uniforms.uWarpFrequency, preset.warpFrequency);
        gl.uniform1f(uniforms.uWarpSpeed, preset.warpSpeed);
        gl.uniform1f(uniforms.uWarpAmplitude, preset.warpAmplitude);
        gl.uniform1f(uniforms.uBlendAngle, preset.blendAngle);
        gl.uniform1f(uniforms.uBlendSoftness, preset.blendSoftness);
        gl.uniform1f(uniforms.uRotationAmount, preset.rotationAmount);
        gl.uniform1f(uniforms.uNoiseScale, preset.noiseScale);
        gl.uniform1f(uniforms.uGrainAmount, preset.grainAmount);
        gl.uniform1f(uniforms.uGrainScale, preset.grainScale);
        gl.uniform1f(uniforms.uGrainAnimated, preset.grainAnimated ? 1 : 0);
        gl.uniform1f(uniforms.uContrast, preset.contrast);
        gl.uniform1f(uniforms.uGamma, preset.gamma);
        gl.uniform1f(uniforms.uSaturation, preset.saturation);
        gl.uniform2f(uniforms.uCenterOffset, preset.centerX, preset.centerY);
        gl.uniform1f(uniforms.uZoom, preset.zoom);
        gl.uniform3fv(uniforms.uColor1, hexToRgb(preset.color1));
        gl.uniform3fv(uniforms.uColor2, hexToRgb(preset.color2));
        gl.uniform3fv(uniforms.uColor3, hexToRgb(preset.color3));
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const stop = () => {
        if (frame) {
            cancelAnimationFrame(frame);
            frame = 0;
        }
    };
    const render = (now) => {
        draw(now);
        if (!reducedMotion && visible && pageVisible) {
            frame = requestAnimationFrame(render);
        } else {
            frame = 0;
        }
    };
    const start = () => {
        if (!frame && !reducedMotion && visible && pageVisible) {
            frame = requestAnimationFrame(render);
        }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(target);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        visible ? start() : stop();
    });
    intersectionObserver.observe(target);
    const onVisibilityChange = () => {
        pageVisible = !document.hidden;
        pageVisible ? start() : stop();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    resize();
    draw(performance.now());
    start();
    target[stateKey] = {
        destroy() {
            stop();
            resizeObserver.disconnect();
            intersectionObserver.disconnect();
            document.removeEventListener('visibilitychange', onVisibilityChange);
            gl.deleteProgram(program);
            canvas.remove();
        },
    };
}

export function ensureSidebarGrainient() {
    const holder = document.querySelector('#top-settings-holder.xy-sidebar-holder');
    const toggle = holder?.querySelector('#xy-sidebar-toggle');
    if (!(holder instanceof HTMLElement) || !(toggle instanceof HTMLElement)) {
        return;
    }
    if (!holder.__xySidebarGrainient) {
        mountGrainient(holder, {
            canvasId: 'xy-sidebar-grainient',
            className: 'xy-sidebar-grainient',
            preset: SIDEBAR_GRAINIENT_PRESET,
            stateKey: '__xySidebarGrainient',
        });
    }
    if (!toggle.__xyToggleGrainient) {
        mountGrainient(toggle, {
            canvasId: 'xy-sidebar-toggle-grainient',
            className: 'xy-sidebar-toggle-grainient',
            preset: TOGGLE_GRAINIENT_PRESET,
            stateKey: '__xyToggleGrainient',
        });
    }
}

function startGrainientWorker() {
    let animated = true;
    let canvas = null;
    let frame = 0;
    let pageVisible = true;
    let preset = null;
    let renderer = null;
    let startTime = 0;
    let visible = true;
    const scheduleFrame = typeof self.requestAnimationFrame === 'function'
        ? self.requestAnimationFrame.bind(self)
        : (callback) => self.setTimeout(() => callback(performance.now()), 16);

    const resize = ({ width, height }) => {
        if (!canvas || !renderer) {
            return;
        }
        canvas.width = width;
        canvas.height = height;
        renderer.gl.viewport(0, 0, width, height);
    };
    const draw = (now) => {
        const { gl, program, uniforms } = renderer;
        gl.useProgram(program);
        gl.uniform2f(uniforms.iResolution, canvas.width, canvas.height);
        gl.uniform1f(uniforms.iTime, (now - startTime) * .001);
        gl.uniform1f(uniforms.uTimeSpeed, preset.timeSpeed);
        gl.uniform1f(uniforms.uColorBalance, preset.colorBalance);
        gl.uniform1f(uniforms.uWarpStrength, preset.warpStrength);
        gl.uniform1f(uniforms.uWarpFrequency, preset.warpFrequency);
        gl.uniform1f(uniforms.uWarpSpeed, preset.warpSpeed);
        gl.uniform1f(uniforms.uWarpAmplitude, preset.warpAmplitude);
        gl.uniform1f(uniforms.uBlendAngle, preset.blendAngle);
        gl.uniform1f(uniforms.uBlendSoftness, preset.blendSoftness);
        gl.uniform1f(uniforms.uRotationAmount, preset.rotationAmount);
        gl.uniform1f(uniforms.uNoiseScale, preset.noiseScale);
        gl.uniform1f(uniforms.uGrainAmount, preset.grainAmount);
        gl.uniform1f(uniforms.uGrainScale, preset.grainScale);
        gl.uniform1f(uniforms.uGrainAnimated, preset.grainAnimated ? 1 : 0);
        gl.uniform1f(uniforms.uContrast, preset.contrast);
        gl.uniform1f(uniforms.uGamma, preset.gamma);
        gl.uniform1f(uniforms.uSaturation, preset.saturation);
        gl.uniform2f(uniforms.uCenterOffset, preset.centerX, preset.centerY);
        gl.uniform1f(uniforms.uZoom, preset.zoom);
        gl.uniform3fv(uniforms.uColor1, hexToRgb(preset.color1));
        gl.uniform3fv(uniforms.uColor2, hexToRgb(preset.color2));
        gl.uniform3fv(uniforms.uColor3, hexToRgb(preset.color3));
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const render = (now) => {
        frame = scheduleFrame(render);
        if (renderer && animated && visible && pageVisible) {
            draw(now);
        }
    };
    self.onmessage = ({ data }) => {
        if (data.type === 'visibility') {
            visible = data.visible;
            return;
        }
        if (data.type === 'page-visibility') {
            pageVisible = data.visible;
            return;
        }
        if (data.type === 'resize') {
            resize(data);
            return;
        }
        if (data.type === 'destroy') {
            self.cancelAnimationFrame?.(frame);
            renderer?.gl.getExtension('WEBGL_lose_context')?.loseContext();
            return;
        }
        if (data.type !== 'init') {
            return;
        }
        try {
            canvas = data.canvas;
            preset = data.preset;
            animated = data.animated;
            visible = data.visible;
            renderer = createRenderer(canvas);
            if (!renderer) {
                throw new Error('Grainient requires WebGL2.');
            }
            resize(data);
            startTime = performance.now();
            draw(startTime);
            if (animated) {
                render(startTime);
            }
        } catch (error) {
            self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
        }
    };
}

if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
    startGrainientWorker();
}
