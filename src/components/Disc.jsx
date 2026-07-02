import { useEffect, useRef, useState } from 'react';

const VERT = `#version 300 es
void main() {
  // Fullscreen triangle, no vertex buffer needed
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

// Raymarched CD with thin-film diffraction, adapted from a Shadertoy shader.
// Shadertoy's iChannel0 cubemap is replaced by a procedural warm environment,
// and missed rays output alpha 0 so the page background shows through.
const FRAG = `#version 300 es
precision highp float;

uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;

out vec4 outColor;

#define MAX_STEPS 100
#define MAX_DIST 20.0
#define SURFACE_DIST 0.001
#define WAVELENGTH_MULT 500.0

#define AA 2

// Rotation matrix around the X axis.
mat3 rotateX(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(1, 0, 0),
        vec3(0, c, s),
        vec3(0, -s, c)
    );
}

// Rotation matrix around the Y axis.
mat3 rotateY(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(c, 0, s),
        vec3(0, 1, 0),
        vec3(-s, 0, c)
    );
}

// 3D SDFs from https://iquilezles.org/articles/distfunctions
float sdCylinder(vec3 p, vec3 a, vec3 b, float r)
{
    vec3  ba = b - a;
    vec3  pa = p - a;
    float baba = dot(ba,ba);
    float paba = dot(pa,ba);
    float x = length(pa*baba-ba*paba) - r*baba;
    float y = abs(paba-baba*0.5)-baba*0.5;
    float x2 = x*x;
    float y2 = y*y*baba;

    float d = (max(x,y)<0.0)?-min(x2,y2):(((x>0.0)?x2:0.0)+((y>0.0)?y2:0.0));

    return sign(d)*sqrt(abs(d))/baba;
}

vec2 surfaceMin(vec2 a, vec2 b)
{
    return (a.x>b.x) ? b : a;
}

vec2 getDist(vec3 p) {

    vec3 diskPos = vec3(0,0,3);
    mat3 rot = iMouse.z < 1.0 ? rotateY(iTime*0.5) : rotateX(iMouse.y*6.28/iResolution.y) * rotateY(-(iMouse.x*6.28)/iResolution.x);
    vec3 diskPosRot = (p-diskPos)*rot+diskPos; // position with Y rotation

    float outerDisk = sdCylinder(
        diskPosRot,
        diskPos + vec3(0, 0, 0.01), // disk surface a
        diskPos - vec3(0, 0, 0.01), // disk surface b
        1.015 // disk radius
    );

    float outerDiskSubtract = sdCylinder(
        diskPosRot,
        diskPos + vec3(0, 0, 0.1), // disk surface a
        diskPos - vec3(0, 0, 0.1), // disk surface b
        1.0 // disk radius
    );

    float disk = sdCylinder(
        diskPosRot,
        diskPos + vec3(0, 0, 0.01), // disk surface a
        diskPos - vec3(0, 0, 0.01), // disk surface b
        1.0 // disk radius
    );

    float diskSubtract = sdCylinder(
        diskPosRot,
        diskPos + vec3(0, 0, 0.1), // disk surface a
        diskPos - vec3(0, 0, 0.1), // disk surface b
        0.35 // disk radius
    );

    float mirrorBand = sdCylinder(
        diskPosRot,
        diskPos + vec3(0, 0, 0.01), // disk surface a
        diskPos - vec3(0, 0, 0.01), // disk surface b
        0.5 // disk radius
    );

    float mirrorBandSubtract = sdCylinder(
        diskPosRot,
        diskPos + vec3(0, 0, 0.1), // disk surface a
        diskPos - vec3(0, 0, 0.1), // disk surface b
        0.295 // disk radius
    );

    float plasticHub = sdCylinder(
        diskPosRot,
        diskPos + vec3(0, 0, 0.01), // disk surface a
        diskPos - vec3(0, 0, 0.01), // disk surface b
        0.295 // disk radius
    );

    float plasticHubDivot = sdCylinder(
        diskPosRot,
        diskPos + vec3(0, 0, 0.1), // disk surface a
        diskPos - vec3(0, 0, 0.1), // disk surface b
        0.26 // disk radius
    );

    float plasticHubDivotSubtract0 = sdCylinder(
        diskPosRot,
        diskPos + vec3(0, 0, 0.1), // disk surface a
        diskPos - vec3(0, 0, 0.1), // disk surface b
        0.2575 // disk radius
    );

    float plasticHubDivotSubtract1 = sdCylinder(
        diskPosRot,
        diskPos + vec3(0, 0, 0.008), // disk surface a
        diskPos - vec3(0, 0, 0.008), // disk surface b
        0.5 // disk radius
    );

    float hole = sdCylinder(
        diskPosRot,
        diskPos + vec3(0,0,1), // disk surface a
        diskPos - vec3(0,0,1), // disk surface b
        0.115 // disk radius
    );

    vec2 outerDiskM = vec2(max(outerDisk, -outerDiskSubtract), 0.0);
    vec2 diskM = vec2(max(disk, -diskSubtract), 1.0);
    vec2 mirrorBandM = vec2(max(mirrorBand, -mirrorBandSubtract), 2.0);

    plasticHubDivot = max(plasticHubDivot, -min(plasticHubDivotSubtract0, plasticHubDivotSubtract1));
    float plasticHubSubtract = min(plasticHubDivot, hole);
    vec2 plasticHubM = vec2(max(plasticHub, -plasticHubSubtract), 0.0);

    return surfaceMin(surfaceMin(surfaceMin(outerDiskM, diskM), mirrorBandM), plasticHubM);

}

vec3 getNormal(vec3 p) {
    float d = getDist(p).x;
    vec2 e = vec2(0.01, 0);

    vec3 n = d - vec3(
        getDist(p-e.xyy).x,
        getDist(p-e.yxy).x,
        getDist(p-e.yyx).x);

    return normalize(n);
}

vec2 rayMarch(vec3 ro, vec3 rd) {

    float dO = 0.0;

    vec3 p;
    vec2 distCol;

    for (int i=0; i<MAX_STEPS; i++){
        p = ro + rd*dO;
        distCol = getDist(p);
        float dS = distCol.x;
        dO += dS;
        if (dO>MAX_DIST || abs(dS)<SURFACE_DIST) break;
    }

    return vec2(dO, distCol.y);
}

vec3 getLight(vec3 p, vec3 n, vec3 c, vec3 lp) {
    vec3 l = normalize(lp - p);

    float diff = dot(n, l);
    return clamp(diff * c, 0.0, 1.0);
}

vec3 getSpecular(vec3 p, vec3 n, vec3 c, vec3 lp, vec3 ro, float sp) {

    vec3 l = normalize(lp - p);
    vec3 h = normalize(l + normalize(ro - p));

    return c * pow(max(0.0, dot(n, h)), sp);
}

// Procedural warm-studio environment, standing in for Shadertoy's iChannel0
// cubemap. Returns linear-space color; palette matches the app's paper theme.
vec3 envMap(vec3 d) {
    d = normalize(d);
    // Cream above fading to warm tan below
    vec3 env = mix(vec3(0.30, 0.24, 0.16), vec3(0.92, 0.86, 0.72), smoothstep(-0.7, 0.6, d.y));
    // Key light matching the scene light position
    env += vec3(1.4, 1.3, 1.1) * pow(max(dot(d, normalize(vec3(2.0, 1.0, -6.0))), 0.0), 20.0);
    // Burnt-orange bounce from below-left
    env += vec3(0.63, 0.19, 0.05) * 0.3 * pow(max(dot(d, normalize(vec3(-1.0, -0.35, 0.3))), 0.0), 5.0);
    return env;
}

// Based on GPU Gems
// Optimised by Alan Zucconi
vec3 bump3y(vec3 x, vec3 yoffset) {

    vec3 y = vec3(1.0) - x*x;
    y = clamp(y - yoffset, 0.0, 1.0);
    return y;
}

vec3 spectralZucconi6(float w) {
    //w: [400, 700]
    //x: [0, 1]
    //Mapping waves to RGB modularly
    float x = clamp(((w - 400.0) / 300.0), 0.0, 1.0);

    const vec3 c1 = vec3(3.54585104, 2.93225262, 2.41593945);
    const vec3 x1 = vec3(0.69549072, 0.49228336, 0.27699880);
    const vec3 y1 = vec3(0.02312639, 0.15225084, 0.52607955);

    const vec3 c2 = vec3(3.90307140, 3.21182957, 3.96587128);
    const vec3 x2 = vec3(0.11748627, 0.86755042, 0.66077860);
    const vec3 y2 = vec3(0.84897130, 0.88445281, 0.73949448);

    if (w < 400.0 || w > 700.0) return vec3(0);

    return bump3y(c1 * (x - x1), y1) + bump3y(c2 * (x - x2), y2);
}

vec3 getDiffraction(vec3 l, vec3 rd, float d, vec3 difr) {

    float cos_ThetaL = dot(l, difr);
    float cos_ThetaV = dot(rd, difr);
    float u = abs(cos_ThetaL - cos_ThetaV);

    if (u == 0.0) return vec3(0);

    vec3 color = vec3(0);
    for (int i=1; i<=12; i++)
    {
        float wavelength = u * d / float(i);
        color += spectralZucconi6(wavelength*WAVELENGTH_MULT);
    }

    return clamp(pow(color, vec3(2.2)), 0.0, 1.0);

}

void getMat(in vec3 p, in float id, inout vec3 col, inout float sp, inout float refl, inout float refr, inout vec3 difr) {

    int i = int(id);
    switch(i) {
        case 0: { // Transparent plastic
            col = vec3(0.1);
            sp = 12.0;
            refl = 0.5;
            refr = 1.0;
            difr = vec3(0);
            break;
        }
        case 1: { // Disk
            col = vec3(0.012, 0.012, 0.02);
            sp = 9.0;
            refl = 1.0;
            refr = 0.0;

            vec3 diskPos = vec3(0,0,3);
            mat3 rot = iMouse.z < 1.0 ? rotateY(iTime*0.5) : rotateX(iMouse.y*6.28/iResolution.y) * rotateY(-(iMouse.x*6.28)/iResolution.x);
            vec3 diskPosRot = (p-diskPos)*rot+diskPos; // position with Y rotation

            // Values for diffraction
            vec3 tangentUV = vec3(-normalize(diskPosRot).y, 0.0, normalize(diskPosRot).x);
            difr = normalize(tangentUV);
            break;
        }
        case 2: { // Mirror band
            col = vec3(0.05);
            sp = 9.0;
            refl = 1.0;
            refr = 0.0;
            difr = vec3(0);
            break;
        }
    }
}

#ifdef AA
void mainImageRaw(out vec4 fragColor, in vec2 fragCoord)
#else
void mainImage(out vec4 fragColor, in vec2 fragCoord)
#endif
{

    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;

    //ray origin
    vec3 ro = vec3(0.0);
    //ray direction
    vec3 rd = normalize(vec3(uv.x,uv.y,1.0));

    // Raymarch and get values
    vec2 rs = rayMarch(ro, rd);

    vec3 p = (ro + rd * rs.x);
    vec3 n = getNormal(p);

    // Light position
    vec3 lp = vec3(2, 1, -6);

    // Get materials
    vec3 col = vec3(0);
    float sp = 0.0;
    float refl = 0.0;
    float refr = 0.0;
    vec3 difr = vec3(0);
    getMat(p, rs.y, col, sp, refl, refr, difr);

    // Diffuse lighting
    vec3 diff = clamp(getLight(p, n, vec3(1), lp), 0.0, 1.0);

    // Specular
    vec3 spec = clamp(getSpecular(p, n, vec3(1), lp, ro, sp), 0.0, 1.0);

    // Reflection
    float fresnel = pow(1.0-dot(n,-rd), 2.0);
    vec3 reflTex = refl * envMap(reflect(rd, n)) * max(fresnel, 0.2);

    // Refraction
    vec3 refrTex = refr * envMap(refract(rd, n, 0.99));

    // Diffraction
    vec3 diffract = getDiffraction(vec3(dot(n, normalize(-p))), rd, rs.x, vec3(difr));

    // Combine
    vec3 color = clamp(clamp(diff*spec, 0.33, 1.0) * (col + reflTex + diffract) + refrTex, 0.0, 1.0);

    // Gamma
    color = pow(color, vec3(0.4545));

    // Missed rays are transparent so the page background shows through
    float alpha = 1.0;
    if (rs.x >= MAX_DIST) {
        color = vec3(0);
        alpha = 0.0;
    }

    fragColor = vec4(color, alpha);

}

#ifdef AA
// Antialiasing "module" by FabriceNeyret2 https://www.shadertoy.com/view/WlfyW8
void mainImage(out vec4 O, vec2 U) {
    vec4 T;
    O = vec4(0);
    for (int k=0; k<AA*AA; k++, O+=T) {
        mainImageRaw(T, U + 0.33 * vec2(k%AA - AA/2, k/AA - AA/2));
    }
    O /= float(AA*AA);
}
#endif

void main() {
    mainImage(outColor, gl_FragCoord.xy);
}
`;

// Static SVG fallback for when WebGL2 is unavailable or the context is lost
function DiscFallback({ className }) {
  return (
    <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="disc-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E5DFD1" />
          <stop offset="50%" stopColor="#C9C2B0" />
          <stop offset="100%" stopColor="#DDD6C6" />
        </linearGradient>
        <mask id="disc-hole">
          <rect width="200" height="200" fill="white" />
          <circle cx="100" cy="100" r="10" fill="black" />
        </mask>
      </defs>
      <g mask="url(#disc-hole)">
        <circle cx="100" cy="100" r="96" fill="url(#disc-face)" />
        <path d="M100 100 L132.8 9.8 A96 96 0 0 1 183.1 52 Z" fill="#CF5B27" fillOpacity="0.22" />
        <path d="M100 100 L59.4 187 A96 96 0 0 1 16.9 148 Z" fill="#5B8A7A" fillOpacity="0.2" />
        <path d="M100 100 L7.3 75.2 A96 96 0 0 1 32.1 32.1 Z" fill="#7A6A93" fillOpacity="0.16" />
        <path d="M100 100 L83.3 5.5 A96 96 0 0 1 116.7 5.5 Z" fill="#F7F1E3" fillOpacity="0.55" />
        <circle cx="100" cy="100" r="88" fill="none" stroke="#2B211A" strokeOpacity="0.06" strokeWidth="2" />
        <circle cx="100" cy="100" r="72" fill="none" stroke="#2B211A" strokeOpacity="0.05" strokeWidth="2" />
        <circle cx="100" cy="100" r="56" fill="none" stroke="#2B211A" strokeOpacity="0.06" strokeWidth="2" />
        <circle cx="100" cy="100" r="95" fill="none" stroke="#2B211A" strokeOpacity="0.3" strokeWidth="2.5" />
        <circle cx="100" cy="100" r="40" fill="none" stroke="#2B211A" strokeOpacity="0.12" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="34" fill="#EFE7D6" />
        <circle cx="100" cy="100" r="34" fill="none" stroke="#2B211A" strokeOpacity="0.1" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="17" fill="none" stroke="#2B211A" strokeOpacity="0.18" strokeWidth="2" />
        <circle cx="100" cy="100" r="12" fill="none" stroke="#2B211A" strokeOpacity="0.28" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function Disc({ className }) {
  const canvasRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (failed) return;
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      powerPreference: 'low-power',
    });
    if (!gl) {
      setFailed(true);
      return;
    }

    const compile = (type, src) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Disc shader:', gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      setFailed(true);
      return;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Disc shader:', gl.getProgramInfoLog(prog));
      setFailed(true);
      return;
    }
    gl.useProgram(prog);

    const uRes = gl.getUniformLocation(prog, 'iResolution');
    const uTime = gl.getUniformLocation(prog, 'iTime');
    const uMouse = gl.getUniformLocation(prog, 'iMouse');

    // The shader already supersamples (AA 2), so cap the backing resolution
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    // Shadertoy-style iMouse: xy = drag position (y up), z > 0 while pressed
    const mouse = { x: 0, y: 0, down: false };
    const setPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) * dpr;
      mouse.y = (rect.height - (e.clientY - rect.top)) * dpr;
    };
    const onPointerDown = (e) => {
      mouse.down = true;
      setPos(e);
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e) => {
      if (mouse.down) setPos(e);
    };
    const onPointerUp = () => {
      mouse.down = false;
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    let raf;
    const start = performance.now();
    const frame = (now) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform3f(uRes, canvas.width, canvas.height, 1);
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform4f(uMouse, mouse.x, mouse.y, mouse.down ? 1 : 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onContextLost = (e) => {
      e.preventDefault();
      setFailed(true);
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      // Don't lose the context here: StrictMode re-runs this effect on the
      // same canvas, and a lost context can't compile shaders again.
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [failed]);

  if (failed) return <DiscFallback className={className} />;
  return (
    <canvas
      ref={canvasRef}
      className={`block touch-none ${className ?? ''}`}
      aria-hidden="true"
    />
  );
}
