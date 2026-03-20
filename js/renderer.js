/* ============================================
   RENDERER.JS — WebGL Sakura Petals Engine
   Lerp transitions douces entre moods (~2s)
   
   MOBILE FIX: canvas uses alpha:true on mobile
   so CSS body background bleeds through if the
   GPU silently fails to render. On desktop,
   alpha:false for max performance.
   ============================================ */

const cvs = document.getElementById('canvas-fx');
const _isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

// ── KEY ARCHITECTURAL FIX ──
// alpha:false = opaque canvas = CSS behind it is INVISIBLE
// If GPU fails silently → black wall, no fallback possible
// alpha:true  = transparent canvas = CSS bleeds through if GPU doesn't draw
const gl = cvs.getContext('webgl', {
    alpha: _isMobile,            // mobile: transparent safety net / desktop: opaque perf
    premultipliedAlpha: false,
    antialias: false,            // save GPU on mobile
    preserveDrawingBuffer: false
});

/* --- CSS Fallback — hides canvas, restores CSS backgrounds --- */
function activateCSSFallback(reason) {
    if (document.body.classList.contains('no-webgl')) return; // already fired
    console.warn(`[Renderer] ${reason} — CSS fallback active`);
    cvs.style.display = "none";
    document.body.style.background = "radial-gradient(ellipse at center, #8a2570 0%, #5d1a4a 100%)";
    document.body.classList.add('no-webgl');
}

if (!gl) {
    activateCSSFallback("WebGL context unavailable");
}

// bg values are linear RGB 0-1. Target base color: #5d1a4a = [0.365, 0.102, 0.29]
const MOODS = {
    INTRO:      { bg:[0.365,0.102,0.29],  glow:[0.55,0.22,0.45],  petal:[1.0,0.72,0.77],  fog:[0.365,0.102,0.29],  wind:0.2,  speedMult:1.0,  gravDir:1.0 },
    VOYAGE:     { bg:[0.06,0.08,0.18],    glow:[0.12,0.16,0.32],  petal:[0.85,0.65,0.7],  fog:[0.06,0.08,0.18],    wind:0.3,  speedMult:0.6,  gravDir:1.0 },
    DECOUVERTE: { bg:[0.08,0.14,0.08],    glow:[0.18,0.28,0.14],  petal:[1.0,0.75,0.8],   fog:[0.08,0.14,0.08],    wind:0.15, speedMult:0.8,  gravDir:1.0 },
    SACRE:      { bg:[0.1,0.04,0.18],     glow:[0.22,0.1,0.38],   petal:[1.0,0.8,0.85],   fog:[0.1,0.04,0.18],     wind:0.08, speedMult:0.4,  gravDir:1.0 },
    DARUMA:     { bg:[0.18,0.02,0.02],    glow:[0.35,0.04,0.08],  petal:[0.6,0.05,0.1],   fog:[0.14,0.01,0.01],    wind:1.5,  speedMult:4.0,  gravDir:1.0 },
    RITUEL:     { bg:[0.18,0.06,0.30],    glow:[0.32,0.14,0.48],  petal:[0.8,0.9,1.0],    fog:[0.18,0.06,0.30],    wind:0.05, speedMult:0.3,  gravDir:1.0 },
    FINAL:      { bg:[0.0,0.0,0.0],       glow:[0.0,0.0,0.0],     petal:[1.0,0.85,0.3],   fog:[0.0,0.0,0.0],       wind:0.1,  speedMult:0.6,  gravDir:1.0 },
    AUBE:       { bg:[0.12,0.06,0.16],    glow:[0.55,0.38,0.12],  petal:[1.0,0.85,0.5],   fog:[0.1,0.05,0.12],     wind:0.03, speedMult:0.15, gravDir:-1.0 },
    VICTOIRE:   { bg:[0.16,0.06,0.20],    glow:[0.5,0.35,0.2],    petal:[1.0,0.9,0.6],    fog:[0.12,0.05,0.16],    wind:0.06, speedMult:0.25, gravDir:-0.5 },
    EPILOGUE:   { bg:[0.04,0.05,0.14],    glow:[0.1,0.15,0.25],   petal:[0.85,0.88,0.95], fog:[0.04,0.05,0.12],    wind:0.02, speedMult:0.1,  gravDir:1.0 }
};

let sakuraMood = { ...MOODS.INTRO };
let targetMood = { ...MOODS.INTRO };
let lerpSpeed = 0;
let _renderFrameCount = 0; // for watchdog

function lerpVal(a, b, t) { return a + (b - a) * t; }
function lerpArr(a, b, t) { return a.map((v, i) => lerpVal(v, b[i], t)); }

window.setSakuraMood = function(moodType) {
    const m = MOODS[moodType];
    if (!m) return;
    targetMood = { ...m };
    lerpSpeed = 0.02;
};

/**
 * Bridge for ThemeManager → WebGL.
 * Accepts a CSS hex color (#rrggbb) and updates bg/glow/fog uniforms
 * without touching petal/wind/speed/gravity (those stay on current mood).
 */
window.setRendererBgHex = function(hex) {
    if (!hex || hex[0] !== '#' || hex.length < 7) return;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    targetMood.bg   = [r, g, b];
    targetMood.glow  = [Math.min(r * 1.6, 1), Math.min(g * 1.6, 1), Math.min(b * 1.6, 1)];
    targetMood.fog   = [r, g, b];
    lerpSpeed = 0.02;
};

if (gl) {
    /* --- Context loss handling --- */
    cvs.addEventListener('webglcontextlost', function(e) {
        e.preventDefault();
        activateCSSFallback("WebGL context lost");
    }, false);

    const ext = gl.getExtension('ANGLE_instanced_arrays');

    /* --- Shader compile WITH error checking --- */
    function compile(type, id) {
        const src = document.getElementById(id);
        if (!src) { console.error(`[Renderer] Shader element #${id} not found`); return null; }
        const s = gl.createShader(type);
        gl.shaderSource(s, src.text);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.error(`[Renderer] Shader ${id} failed:`, gl.getShaderInfoLog(s));
            gl.deleteShader(s);
            return null;
        }
        return s;
    }

    /* --- Program link WITH error checking --- */
    function linkProg(vs, fs) {
        if (!vs || !fs) return null;
        const p = gl.createProgram();
        gl.attachShader(p, vs);
        gl.attachShader(p, fs);
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
            console.error("[Renderer] Program link failed:", gl.getProgramInfoLog(p));
            return null;
        }
        return p;
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        cvs.width = window.innerWidth * dpr;
        cvs.height = window.innerHeight * dpr;
        gl.viewport(0, 0, cvs.width, cvs.height);
    }
    window.addEventListener('resize', resize);
    resize();

    /* --- Background quad program --- */
    const bgProg = linkProg(
        compile(gl.VERTEX_SHADER, 'bg-vs'),
        compile(gl.FRAGMENT_SHADER, 'bg-fs')
    );

    if (!bgProg) {
        activateCSSFallback("Background shader failed to compile/link");
    } else {
        const uBgCol = gl.getUniformLocation(bgProg, "uBgCol");
        const uGlowCol = gl.getUniformLocation(bgProg, "uGlowCol");
        const quadBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

        /* --- Petal program (OPTIONAL — degrades gracefully) --- */
        let petalReady = false;
        let petalProg, pInds, vBuf, nBuf, iBuf, iBuf1, iBuf2;
        let aPos, aNorm, aInst1, aInst2, uTime, uRes, uWind, uSpdM, uPetalCol, uFogCol, uGravDir;

        if (ext) {
            petalProg = linkProg(
                compile(gl.VERTEX_SHADER, 'petal-vs'),
                compile(gl.FRAGMENT_SHADER, 'petal-fs')
            );

            if (petalProg) {
                const pVerts = [], pNorms = []; const segs = 4;
                for (let i = 0; i <= segs; i++) { for (let j = 0; j <= segs; j++) { let u = i / segs, v = j / segs; let w = Math.sin(u * Math.PI) * (1.0 - v * 0.6); let x = (v - 0.5) * 2.0 * w; let y = (u - 0.5) * 2.0; let z = (x*x + y*y) * 0.3; pVerts.push(x, y, z); let len = Math.sqrt(x*x + y*y + 1.0); pNorms.push(-x/len, -y/len, 1.0/len); } }
                const pIndsArr = []; for (let i = 0; i < segs; i++) { for (let j = 0; j < segs; j++) { let p1 = i * (segs + 1) + j, p2 = p1 + 1, p3 = (i + 1) * (segs + 1) + j, p4 = p3 + 1; pIndsArr.push(p1, p2, p3, p2, p4, p3); } }
                pInds = pIndsArr;
                vBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pVerts), gl.STATIC_DRAW);
                nBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, nBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pNorms), gl.STATIC_DRAW);
                iBuf = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuf); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(pInds), gl.STATIC_DRAW);
                const numP = 300; const instData1 = new Float32Array(numP * 4); const instData2 = new Float32Array(numP * 2);
                for(let p = 0; p < numP; p++) { instData1[p*4+0] = Math.random() * 3000 - 1500; instData1[p*4+1] = Math.random() * 3000 - 1500; instData1[p*4+2] = Math.random() * 2000 - 2000; instData1[p*4+3] = 10.0 + Math.random() * 15.0; instData2[p*2+0] = Math.random() * Math.PI * 2; instData2[p*2+1] = 0.5 + Math.random() * 1.0; }
                iBuf1 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, iBuf1); gl.bufferData(gl.ARRAY_BUFFER, instData1, gl.STATIC_DRAW);
                iBuf2 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, iBuf2); gl.bufferData(gl.ARRAY_BUFFER, instData2, gl.STATIC_DRAW);
                aPos = gl.getAttribLocation(petalProg, "aPos"); aNorm = gl.getAttribLocation(petalProg, "aNorm"); aInst1 = gl.getAttribLocation(petalProg, "aInstData1"); aInst2 = gl.getAttribLocation(petalProg, "aInstData2");
                uTime = gl.getUniformLocation(petalProg, "uTime"); uRes = gl.getUniformLocation(petalProg, "uRes"); uWind = gl.getUniformLocation(petalProg, "uWind"); uSpdM = gl.getUniformLocation(petalProg, "uSpdM"); uPetalCol = gl.getUniformLocation(petalProg, "uPetalCol"); uFogCol = gl.getUniformLocation(petalProg, "uFogCol"); uGravDir = gl.getUniformLocation(petalProg, "uGravDir");
                petalReady = true;
            } else {
                console.warn("[Renderer] Petal shader failed — bg-only mode");
            }
        } else {
            console.warn("[Renderer] ANGLE_instanced_arrays unavailable — bg-only mode");
        }

        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.enable(gl.DEPTH_TEST);
        // Initial clear to theme color (not black)
        gl.clearColor(0.365, 0.102, 0.29, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        let t0 = performance.now(); let simTime = 0;

        function render(t) {
            if (gl.isContextLost()) return;
            _renderFrameCount++;

            let dt = (t - t0) * 0.001; t0 = t; simTime += dt;

            // LERP — transition douce entre moods
            if (lerpSpeed > 0) {
                sakuraMood.bg = lerpArr(sakuraMood.bg, targetMood.bg, lerpSpeed);
                sakuraMood.glow = lerpArr(sakuraMood.glow, targetMood.glow, lerpSpeed);
                sakuraMood.petal = lerpArr(sakuraMood.petal, targetMood.petal, lerpSpeed);
                sakuraMood.fog = lerpArr(sakuraMood.fog, targetMood.fog, lerpSpeed);
                sakuraMood.wind = lerpVal(sakuraMood.wind, targetMood.wind, lerpSpeed);
                sakuraMood.speedMult = lerpVal(sakuraMood.speedMult, targetMood.speedMult, lerpSpeed);
                sakuraMood.gravDir = lerpVal(sakuraMood.gravDir, targetMood.gravDir, lerpSpeed);
                const dist = Math.abs(sakuraMood.bg[0] - targetMood.bg[0]) + Math.abs(sakuraMood.petal[0] - targetMood.petal[0]);
                if (dist < 0.001) { sakuraMood = { ...targetMood }; lerpSpeed = 0; }
            }

            /* --- Background quad --- */
            gl.disable(gl.DEPTH_TEST); gl.useProgram(bgProg); gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            gl.uniform3f(uBgCol, sakuraMood.bg[0], sakuraMood.bg[1], sakuraMood.bg[2]); gl.uniform3f(uGlowCol, sakuraMood.glow[0], sakuraMood.glow[1], sakuraMood.glow[2]); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            /* --- Petals --- */
            if (petalReady) {
                gl.enable(gl.DEPTH_TEST); gl.useProgram(petalProg); gl.uniform1f(uTime, simTime);
                gl.uniform2f(uRes, cvs.width, cvs.height);
                gl.uniform1f(uWind, sakuraMood.wind); gl.uniform1f(uSpdM, sakuraMood.speedMult); gl.uniform1f(uGravDir, sakuraMood.gravDir || 1.0); gl.uniform3f(uPetalCol, sakuraMood.petal[0], sakuraMood.petal[1], sakuraMood.petal[2]); gl.uniform3f(uFogCol, sakuraMood.fog[0], sakuraMood.fog[1], sakuraMood.fog[2]);
                gl.bindBuffer(gl.ARRAY_BUFFER, vBuf); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ARRAY_BUFFER, nBuf); gl.enableVertexAttribArray(aNorm); gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, iBuf1); gl.enableVertexAttribArray(aInst1); gl.vertexAttribPointer(aInst1, 4, gl.FLOAT, false, 0, 0); ext.vertexAttribDivisorANGLE(aInst1, 1);
                gl.bindBuffer(gl.ARRAY_BUFFER, iBuf2); gl.enableVertexAttribArray(aInst2); gl.vertexAttribPointer(aInst2, 2, gl.FLOAT, false, 0, 0); ext.vertexAttribDivisorANGLE(aInst2, 1);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuf); ext.drawElementsInstancedANGLE(gl.TRIANGLES, pInds.length, gl.UNSIGNED_SHORT, 0, 300);
            }

            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);

        /* ── WATCHDOG — detect silent GPU failure on mobile ──
           After 1.5s, read center pixel. If RGBA is all zeros,
           the GPU passed all API checks but never actually drew.
           With alpha:true the user already sees CSS (not black),
           but we also hide the canvas and flag no-webgl for
           ThemeManager to stop bridging to a dead context. */
        if (_isMobile) {
            setTimeout(function() {
                if (gl.isContextLost() || document.body.classList.contains('no-webgl')) return;
                if (_renderFrameCount < 5) {
                    activateCSSFallback("Render loop stalled (" + _renderFrameCount + " frames in 1.5s)");
                    return;
                }
                try {
                    const px = new Uint8Array(4);
                    gl.readPixels(
                        Math.floor(cvs.width / 2), Math.floor(cvs.height / 2),
                        1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px
                    );
                    const brightness = px[0] + px[1] + px[2] + px[3];
                    if (brightness === 0) {
                        activateCSSFallback("GPU silent failure (watchdog pixel = 0,0,0,0)");
                    } else {
                        console.log("[Renderer] Watchdog OK — pixel:", px[0], px[1], px[2], px[3]);
                    }
                } catch(e) {
                    activateCSSFallback("Watchdog readPixels error: " + e.message);
                }
            }, 1500);
        }
    }
}
