const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// An fbm noise field gives every pixel a threshold; progress sweeps past them so the
// outgoing photo tears away. The incoming photo's brightness biases the threshold, so
// its light areas burn through first.
const FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D u_from;
uniform sampler2D u_to;
uniform float u_progress;
uniform vec2 u_resolution;
uniform float u_fromAspect;
uniform float u_toAspect;
uniform float u_direction;

varying vec2 v_uv;

const float SCALE = 3.5;
const float EDGE = 0.15;
const float DRIFT = 0.5;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 v) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * snoise(v);
    v *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// Drift pushes UVs past the image edge; reflecting keeps real picture there instead
// of smearing the last row of pixels.
vec2 mirror(vec2 uv) {
  return 1.0 - abs(1.0 - mod(uv, 2.0));
}

vec2 coverUV(vec2 uv, float imageAspect) {
  float canvasAspect = u_resolution.x / u_resolution.y;
  vec2 scale = canvasAspect > imageAspect
    ? vec2(1.0, imageAspect / canvasAspect)
    : vec2(canvasAspect / imageAspect, 1.0);
  return mirror((uv - 0.5) * scale + 0.5);
}

void main() {
  float sweep = u_progress * (1.0 + 2.0 * EDGE) - EDGE;
  float noise = fbm(v_uv * SCALE + vec2(0.0, u_progress * u_direction)) * 0.5 + 0.5;
  noise = smoothstep(0.0, 2.0, length(texture2D(u_to, coverUV(v_uv, u_toAspect)).rgb) + noise);
  float mixFactor = 1.0 - smoothstep(sweep - EDGE, sweep + EDGE, noise);

  vec2 fromUV = coverUV(v_uv + vec2(0.0, noise * u_progress * DRIFT * u_direction), u_fromAspect);
  vec2 toUV = coverUV(v_uv + vec2(0.0, noise * (1.0 - u_progress) * -0.5 * DRIFT * u_direction), u_toAspect);
  gl_FragColor = mix(texture2D(u_from, fromUV), texture2D(u_to, toUV), mixFactor);
}
`;

const DURATION_MS = 1200;

export type MorphRenderer = {
  canMorph: (from: number, to: number) => boolean;
  play: (from: number, to: number, direction: 1 | -1) => Promise<void>;
  dispose: () => void;
};

const easeInOutQuint = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "Shader failed");
  return shader;
}

function link(gl: WebGLRenderingContext) {
  const program = gl.createProgram();
  if (!program) throw new Error("Could not create program");
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "Link failed");
  return program;
}

// Returns null when WebGL is unavailable; the gallery then falls back to a cross-fade.
export function createMorphRenderer(canvas: HTMLCanvasElement, sources: string[]): MorphRenderer | null {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
  if (!gl) return null;

  let program: WebGLProgram;
  try {
    program = link(gl);
  } catch {
    return null;
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const uniform = (name: string) => gl.getUniformLocation(program, `u_${name}`);
  const uniforms = {
    from: uniform("from"),
    to: uniform("to"),
    progress: uniform("progress"),
    resolution: uniform("resolution"),
    fromAspect: uniform("fromAspect"),
    toAspect: uniform("toAspect"),
    direction: uniform("direction"),
  };

  const textures: (WebGLTexture | null)[] = sources.map(() => null);
  const aspects = sources.map(() => 1);
  let lost = false;
  let frame = 0;

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frame);
  });

  sources.forEach((source, index) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (lost) return;
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      // Photos aren't powers of two, so WebGL1 only allows clamp + linear here.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      textures[index] = texture;
      aspects[index] = image.naturalWidth / Math.max(image.naturalHeight, 1);
    };
    image.src = source;
  });

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * ratio);
    canvas.height = Math.round(canvas.clientHeight * ratio);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const draw = (from: number, to: number, progress: number, direction: number) => {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures[from]);
    gl.uniform1i(uniforms.from, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures[to]);
    gl.uniform1i(uniforms.to, 1);
    gl.uniform1f(uniforms.progress, progress);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.fromAspect, aspects[from]);
    gl.uniform1f(uniforms.toAspect, aspects[to]);
    gl.uniform1f(uniforms.direction, direction);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  return {
    canMorph: (from, to) => !lost && textures[from] !== null && textures[to] !== null,
    play: (from, to, direction) =>
      new Promise((resolve) => {
        resize();
        // Drawn before the canvas is shown, so it never flashes a stale or blank frame.
        draw(from, to, 0, direction);
        const startedAt = performance.now();
        const step = (now: number) => {
          const progress = easeInOutQuint(Math.min((now - startedAt) / DURATION_MS, 1));
          if (!lost) draw(from, to, progress, direction);
          if (progress < 1 && !lost) frame = requestAnimationFrame(step);
          else resolve();
        };
        frame = requestAnimationFrame(step);
      }),
    dispose: () => {
      cancelAnimationFrame(frame);
      textures.forEach((texture) => texture && gl.deleteTexture(texture));
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}
