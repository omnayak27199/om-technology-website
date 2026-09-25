// Hotel Jay Palace – Hero Scene Animation
// Car → stops → books → enters hotel → night/sleep → morning/wakeup → exits → drives away → loop
(function () {
  'use strict';

  const LOOP_MS = 30000; // 30-second loop

  // ── Polyfill roundRect for Safari/Firefox fallback ──────────────────
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      r = Array.isArray(r) ? r[0] : (r || 0);
      r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  function eIO(t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
  function eOut(t) { t = Math.min(1, Math.max(0, t)); return 1 - (1 - t) * (1 - t); }
  function eIn(t)  { t = Math.min(1, Math.max(0, t)); return t * t; }
  function clamp(t) { return Math.min(1, Math.max(0, t)); }
  function norm(t, a, b) { return clamp((t - a) / (b - a)); }
  function lerp(a, b, t) { return a + (b - a) * clamp(t); }
  function lerpRGB(a, b, t) {
    return [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))];
  }
  function rgb(c)     { return `rgb(${c[0]},${c[1]},${c[2]})`; }
  function rgba(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

  // ── Sky palette ──────────────────────────────────────────────────────
  const SKY = {
    morning: { top: [100, 180, 255], bot: [180, 220, 255] },
    sunset:  { top: [255, 130, 60],  bot: [255, 190, 110] },
    dusk:    { top: [40,  30,  90],  bot: [80,  50,  120] },
    night:   { top: [8,   10,  35],  bot: [15,  20,  55] },
    dawn:    { top: [255, 155, 80],  bot: [255, 210, 150] },
  };

  function getSky(t) {
    if (t < 0.38)  return SKY.morning;
    if (t < 0.52)  return { top: lerpRGB(SKY.morning.top, SKY.sunset.top,  eIO(norm(t, 0.38, 0.52))),
                             bot: lerpRGB(SKY.morning.bot, SKY.sunset.bot,  eIO(norm(t, 0.38, 0.52))) };
    if (t < 0.62)  return { top: lerpRGB(SKY.sunset.top,  SKY.dusk.top,    eIO(norm(t, 0.52, 0.62))),
                             bot: lerpRGB(SKY.sunset.bot,  SKY.dusk.bot,    eIO(norm(t, 0.52, 0.62))) };
    if (t < 0.68)  return { top: lerpRGB(SKY.dusk.top,    SKY.night.top,   eIO(norm(t, 0.62, 0.68))),
                             bot: lerpRGB(SKY.dusk.bot,    SKY.night.bot,   eIO(norm(t, 0.62, 0.68))) };
    if (t < 0.75)  return SKY.night;
    if (t < 0.82)  return { top: lerpRGB(SKY.night.top,   SKY.dawn.top,    eIO(norm(t, 0.75, 0.82))),
                             bot: lerpRGB(SKY.night.bot,   SKY.dawn.bot,    eIO(norm(t, 0.75, 0.82))) };
    if (t < 0.92)  return { top: lerpRGB(SKY.dawn.top,    SKY.morning.top, eIO(norm(t, 0.82, 0.92))),
                             bot: lerpRGB(SKY.dawn.bot,    SKY.morning.bot, eIO(norm(t, 0.82, 0.92))) };
    return SKY.morning;
  }

  function nightF(t) { // 0 = day, 1 = full night
    if (t < 0.55) return 0;
    if (t < 0.68) return eIO(norm(t, 0.55, 0.68));
    if (t < 0.74) return 1;
    if (t < 0.86) return 1 - eIO(norm(t, 0.74, 0.86));
    return 0;
  }

  // ── Draw: Sky ───────────────────────────────────────────────────────
  function drawSky(ctx, t, W, H) {
    const sky = getSky(t);
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.70);
    g.addColorStop(0, rgb(sky.top));
    g.addColorStop(1, rgb(sky.bot));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H * 0.70);
  }

  // ── Draw: Stars ─────────────────────────────────────────────────────
  const STAR_PTS = [[0.09,0.05],[0.20,0.10],[0.31,0.06],[0.43,0.14],[0.14,0.20],
                    [0.56,0.08],[0.62,0.18],[0.71,0.05],[0.82,0.13],[0.91,0.08],
                    [0.25,0.27],[0.47,0.24],[0.77,0.22],[0.04,0.30],[0.38,0.32],
                    [0.67,0.29],[0.50,0.16],[0.85,0.25],[0.12,0.35]];

  function drawStars(ctx, t, W, H) {
    const nf = nightF(t);
    if (nf <= 0) return;
    ctx.fillStyle = `rgba(255,255,255,${nf * 0.95})`;
    STAR_PTS.forEach(([fx, fy]) => {
      ctx.beginPath();
      ctx.arc(fx * W, fy * H, 1.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ── Draw: Sun / Moon ────────────────────────────────────────────────
  function drawSun(ctx, t, W, H) {
    const nf = nightF(t);
    const sunAlpha = clamp(1 - nf * 2); // hides at dusk
    if (sunAlpha <= 0) return;
    const gY = H * 0.70;
    let sx, sy;
    if (t < 0.55) {
      sx = lerp(W * 0.12, W * 0.88, t / 0.55);
      sy = gY * 0.22 + Math.sin(Math.PI * (t / 0.55)) * (-gY * 0.10);
    } else {
      sx = W * 0.92; sy = gY * 0.20;
    }
    // Dawn sun rising
    if (t > 0.80 && t < 1.00) {
      const tt = norm(t, 0.80, 0.96);
      sx = lerp(-W * 0.04, W * 0.30, eOut(tt));
      sy = lerp(gY + 10, gY * 0.18, eOut(tt));
    }
    const r = W * 0.055;
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 1.8);
    g.addColorStop(0,   `rgba(255,245,80,${sunAlpha})`);
    g.addColorStop(0.5, `rgba(255,210,40,${sunAlpha * 0.7})`);
    g.addColorStop(1,   'rgba(255,180,20,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx, sy, r * 1.8, 0, Math.PI * 2);
    ctx.fill();
    // solid core
    ctx.fillStyle = `rgba(255,255,160,${sunAlpha * 0.9})`;
    ctx.beginPath();
    ctx.arc(sx, sy, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMoon(ctx, t, W, H) {
    const nf = nightF(t);
    if (nf <= 0) return;
    const gY = H * 0.70;
    const mx = lerp(W * 0.18, W * 0.55, norm(t, 0.63, 0.80));
    const my = lerp(gY * 0.42, gY * 0.12, eOut(norm(t, 0.63, 0.73)));
    // Moon disk
    ctx.fillStyle = `rgba(240,240,220,${nf * 0.95})`;
    ctx.beginPath();
    ctx.arc(mx, my, W * 0.038, 0, Math.PI * 2);
    ctx.fill();
    // Crescent shadow using sky color
    const sky = getSky(t);
    ctx.fillStyle = rgba(sky.top, nf * 0.92);
    ctx.beginPath();
    ctx.arc(mx + W * 0.022, my - H * 0.018, W * 0.028, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Draw: Hills & Ground ────────────────────────────────────────────
  function drawGround(ctx, t, W, H) {
    const gY = H * 0.70;
    const nf = nightF(t);
    // Back hills
    ctx.fillStyle = rgb(lerpRGB([90, 145, 75], [25, 45, 22], nf));
    ctx.beginPath();
    ctx.moveTo(0, gY);
    ctx.bezierCurveTo(W*.12, gY-H*.13, W*.30, gY-H*.18, W*.48, gY-H*.09);
    ctx.bezierCurveTo(W*.62, gY-H*.03, W*.78, gY-H*.15, W, gY-H*.07);
    ctx.lineTo(W, gY); ctx.closePath(); ctx.fill();
    // Grass ground
    ctx.fillStyle = rgb(lerpRGB([68, 130, 50], [22, 42, 15], nf));
    ctx.fillRect(0, gY, W, H - gY);
  }

  // ── Draw: Road ──────────────────────────────────────────────────────
  function drawRoad(ctx, t, W, H, carX, carMoving) {
    const gY = H * 0.70;
    const rTop = gY + H * 0.04;
    const rBot = gY + H * 0.22;
    const rMid = (rTop + rBot) / 2;
    const nf   = nightF(t);

    // Asphalt
    ctx.fillStyle = rgb(lerpRGB([58, 58, 60], [35, 35, 38], nf));
    ctx.fillRect(0, rTop, W, rBot - rTop);

    // Road edges
    ctx.fillStyle = rgba([220, 210, 160], 0.7 - nf * 0.3);
    ctx.fillRect(0, rTop, W, 2);
    ctx.fillRect(0, rBot - 2, W, 2);

    // Dashes — animate offset when car is moving
    const dashW = W * 0.058, gap = W * 0.045, stride = dashW + gap;
    const dashOff = carMoving ? (Date.now() * 0.25) % stride : 0;
    ctx.fillStyle = rgba([255, 255, 200], 0.85 - nf * 0.25);
    for (let x = -stride + dashOff % stride; x < W + stride; x += stride) {
      ctx.fillRect(x, rMid - 2.5, dashW, 5);
    }

    // Road sign — "Saraipali →" — appears early
    if (t > 0.06 && t < 0.28) {
      const alpha = Math.min(1, norm(t, 0.06, 0.13)) * Math.max(0, 1 - norm(t, 0.22, 0.28));
      const signX = W * 0.30, signY = gY - H * 0.04;
      ctx.globalAlpha = alpha;
      // pole
      ctx.fillStyle = '#888';
      ctx.fillRect(signX - 1.5, signY, 3, H * 0.10);
      // board
      ctx.fillStyle = '#27ae60';
      ctx.beginPath();
      ctx.roundRect(signX - W*0.07, signY - H*0.052, W*0.14, H*0.042, 4);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.font = `bold ${Math.round(H*0.022)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📍 Saraipali →', signX, signY - H*0.030);
      ctx.textBaseline = 'alphabetic';
      ctx.globalAlpha = 1;
    }
  }

  // ── Draw: Trees (pine + round lollipop) ────────────────────────────
  function drawTrees(ctx, t, W, H) {
    const gY = H * 0.70;
    const nf = nightF(t);

    function drawPine(tx, sc) {
      const tH = H * 0.22 * sc, trH = tH * 0.28, trW = W * 0.010;
      ctx.fillStyle = rgb(lerpRGB([82, 58, 20], [32, 20, 7], nf));
      ctx.fillRect(tx - trW/2, gY - trH, trW, trH);
      ctx.fillStyle = rgb(lerpRGB([28, 95, 26], [10, 35, 9], nf));
      ctx.beginPath(); ctx.moveTo(tx, gY - tH);
      ctx.lineTo(tx - W*0.028, gY - trH); ctx.lineTo(tx + W*0.028, gY - trH);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = rgb(lerpRGB([38, 112, 35], [14, 42, 12], nf));
      ctx.beginPath(); ctx.moveTo(tx, gY - tH * 0.66);
      ctx.lineTo(tx - W*0.038, gY - trH * 0.65); ctx.lineTo(tx + W*0.038, gY - trH * 0.65);
      ctx.closePath(); ctx.fill();
    }

    function drawLollipop(tx, sc, cr) {
      const tH = H * 0.36 * sc, trH = tH * 0.45, trW = W * 0.010;
      ctx.fillStyle = rgb(lerpRGB([100, 65, 20], [40, 24, 7], nf));
      ctx.fillRect(tx - trW/2, gY - trH, trW, trH);
      ctx.fillStyle = rgba(lerpRGB([30, 100, 28], [10, 38, 10], nf), 0.30);
      ctx.beginPath(); ctx.arc(tx + cr*0.12, gY - tH + cr*0.42, cr*0.80, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = rgb(lerpRGB([45, 145, 42], [16, 55, 15], nf));
      ctx.beginPath(); ctx.arc(tx, gY - tH + cr*0.32, cr, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = rgba(lerpRGB([72, 178, 68], [26, 68, 24], nf*0.5), 0.48);
      ctx.beginPath(); ctx.arc(tx - cr*0.20, gY - tH - cr*0.06, cr*0.52, 0, Math.PI*2); ctx.fill();
    }

    // Far-left pine trees
    [[0.025, 1.0], [0.075, 1.25], [0.132, 0.90]].forEach(([fx, sc]) => drawPine(fx * W, sc));
    // Centre-left lollipop round trees
    [[0.215, 1.0, W*0.068], [0.285, 0.88, W*0.058], [0.355, 0.95, W*0.063]].forEach(([fx, sc, cr]) => drawLollipop(fx * W, sc, cr));
    // Far-right pine trees
    [[0.965, 0.85], [1.005, 1.02]].forEach(([fx, sc]) => drawPine(fx * W, sc));
  }

  // ── Hotel window helper (arched frame + glass) ───────────────────────
  function drawHotelWindow(ctx, wx, wy, wW, wH, nf) {
    const archH = wW * 0.38;
    ctx.fillStyle = rgb(lerpRGB([195, 178, 145], [65, 55, 38], nf*0.65));
    ctx.beginPath();
    ctx.moveTo(wx - 3, wy + archH); ctx.lineTo(wx - 3, wy + wH + 3);
    ctx.lineTo(wx + wW + 3, wy + wH + 3); ctx.lineTo(wx + wW + 3, wy + archH);
    ctx.quadraticCurveTo(wx + wW + 3, wy - 3, wx + wW/2, wy - 3);
    ctx.quadraticCurveTo(wx - 3, wy - 3, wx - 3, wy + archH);
    ctx.closePath(); ctx.fill();
    if (nf > 0) {
      const gl = ctx.createRadialGradient(wx+wW/2, wy+wH/2, 0, wx+wW/2, wy+wH/2, wW*0.9);
      gl.addColorStop(0, rgba([255, 218, 70], nf * 0.40)); gl.addColorStop(1, rgba([255, 218, 70], 0));
      ctx.fillStyle = gl; ctx.fillRect(wx - wW*0.6, wy - wH*0.5, wW*2.2, wH*2.2);
    }
    ctx.fillStyle = nf > 0 ? rgba([255, 222, 80], Math.min(1, nf * 1.1)) : rgba([125, 185, 215], 0.72);
    ctx.beginPath();
    ctx.moveTo(wx, wy + archH); ctx.lineTo(wx, wy + wH);
    ctx.lineTo(wx + wW, wy + wH); ctx.lineTo(wx + wW, wy + archH);
    ctx.quadraticCurveTo(wx + wW, wy, wx + wW/2, wy);
    ctx.quadraticCurveTo(wx, wy, wx, wy + archH);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(lerpRGB([85, 65, 38], [35, 28, 18], nf*0.5), 0.52);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(wx + wW/2, wy); ctx.lineTo(wx + wW/2, wy + wH);
    ctx.moveTo(wx, wy + wH*0.50); ctx.lineTo(wx + wW, wy + wH*0.50);
    ctx.stroke();
  }

  // ── Draw: Hotel (ornate 3-story colonial) ───────────────────────────
  function drawHotel(ctx, t, W, H) {
    const gY    = H * 0.70;
    const nf    = nightF(t);
    const HW    = W * 0.28, HH = H * 0.44;
    const HX    = W * 0.67, HY = gY - HH;
    const wallC = lerpRGB([238, 222, 188], [82, 68, 50], nf * 0.75);
    const trimC = lerpRGB([215, 195, 158], [68, 56, 40], nf * 0.75);
    const goldC = lerpRGB([200, 158, 52], [88, 68, 22], nf * 0.60);
    const roofC = lerpRGB([158, 88, 42], [55, 30, 14], nf * 0.70);
    const colC  = lerpRGB([225, 208, 175], [78, 64, 46], nf * 0.65);

    // Building shadow
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.beginPath(); ctx.roundRect(HX + 6, HY + 6, HW, HH, [5, 5, 0, 0]); ctx.fill();

    // Main facade
    ctx.fillStyle = rgb(wallC);
    ctx.beginPath(); ctx.roundRect(HX, HY, HW, HH, [5, 5, 0, 0]); ctx.fill();

    // Roofline band (terracotta)
    const roofBH = HH * 0.105;
    ctx.fillStyle = rgb(roofC);
    ctx.beginPath(); ctx.roundRect(HX, HY, HW, roofBH, [5, 5, 0, 0]); ctx.fill();
    ctx.fillStyle = rgb(lerpRGB([148, 82, 38], [50, 28, 12], nf * 0.70));
    ctx.fillRect(HX - 4, HY + roofBH - 8, HW + 8, 8);

    // Crown / finial
    const crH = H * 0.052, crW = HW * 0.38;
    const crX = HX + (HW - crW) / 2, crY = HY - crH + 2;
    ctx.fillStyle = rgb(goldC);
    ctx.beginPath(); ctx.roundRect(crX, crY, crW, crH * 0.55, 3); ctx.fill();
    [-1, 0, 1].forEach(i => {
      ctx.beginPath();
      ctx.moveTo(HX + HW*0.50 + i*crW*0.30, crY);
      ctx.lineTo(HX + HW*0.50 + i*crW*0.30 - crW*0.072, crY - crH*0.54);
      ctx.lineTo(HX + HW*0.50 + i*crW*0.30 + crW*0.072, crY - crH*0.54);
      ctx.closePath(); ctx.fill();
    });
    ctx.fillRect(crX, crY + crH*0.55 - 4, crW, 4);

    // Sign band — "Hotel Jay Palace"
    const sgnH = HH * 0.068, sgnY = HY + roofBH;
    ctx.fillStyle = rgb(lerpRGB([178, 138, 48], [68, 52, 18], nf*0.60));
    ctx.fillRect(HX + HW*0.04, sgnY, HW*0.92, sgnH);
    ctx.fillStyle = rgba(lerpRGB([255, 255, 255], [192, 168, 112], nf*0.50), 0.96);
    ctx.font = `bold ${Math.round(sgnH * 0.62)}px Georgia, serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✦ Hotel Jay Palace ✦', HX + HW/2, sgnY + sgnH/2);
    ctx.textBaseline = 'alphabetic';

    // Floor layout
    const bodyTop = sgnY + sgnH, bodyH = gY - bodyTop;
    const bandH   = bodyH * 0.030;
    const f3H     = bodyH * 0.290, f2H = bodyH * 0.290;
    const f1H     = bodyH - f3H - f2H - 2 * bandH;
    const f3Top   = bodyTop, sep1Y = f3Top + f3H;
    const f2Top   = sep1Y + bandH, sep2Y = f2Top + f2H;
    const f1Top   = sep2Y + bandH;

    // Floor separator bands
    ctx.fillStyle = rgb(lerpRGB([195, 175, 138], [65, 55, 38], nf*0.65));
    ctx.fillRect(HX, sep1Y, HW, bandH); ctx.fillRect(HX, sep2Y, HW, bandH);

    // 3rd floor — 4 arched windows
    const w3W = HW * 0.155, w3H = f3H * 0.72;
    const w3xs = [0.085, 0.285, 0.535, 0.735].map(fx => HX + fx * HW);
    const w3y  = f3Top + (f3H - w3H) * 0.50;
    w3xs.forEach(wx => drawHotelWindow(ctx, wx, w3y, w3W, w3H, nf));

    // ZZZ at night from 2nd window
    if (nf > 0.60) {
      const zAlpha = clamp(nf - 0.20) * 0.88;
      const zt = (Date.now() % 3000) / 3000;
      ctx.globalAlpha = zAlpha * clamp(1 - zt);
      ctx.fillStyle = 'white'; ctx.font = `bold ${Math.round(H*0.024)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('z', w3xs[1] + w3W*0.60 + zt*w3W*0.10, w3y - H*0.018 - zt * H*0.06);
      ctx.font = `bold ${Math.round(H*0.016)}px Arial`;
      ctx.fillText('z', w3xs[1] + w3W*0.88 + zt*w3W*0.08, w3y - H*0.048 - zt * H*0.05);
      ctx.globalAlpha = 1;
    }
    // Morning person at 2nd window
    if (t > 0.76 && t < 0.86) {
      const wpa = Math.min(1, norm(t, 0.76, 0.79)) * Math.max(0, 1 - norm(t, 0.83, 0.86));
      ctx.globalAlpha = wpa;
      ctx.fillStyle = '#FDBCB4';
      ctx.beginPath(); ctx.arc(w3xs[1] + w3W/2, w3y + w3H*0.48, w3W*0.26, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#FDBCB4'; ctx.lineWidth = 2;
      const ha = Math.sin(Date.now() * 0.006) * 0.5;
      ctx.beginPath();
      ctx.moveTo(w3xs[1] + w3W*0.70, w3y + w3H*0.40);
      ctx.lineTo(w3xs[1] + w3W*0.70 + Math.cos(ha)*w3W*0.18, w3y + w3H*0.28 + Math.sin(ha)*w3H*0.18);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 2nd floor — 4 arched windows + flower boxes
    const w2W = HW * 0.155, w2H = f2H * 0.68;
    const w2xs = [0.085, 0.285, 0.535, 0.735].map(fx => HX + fx * HW);
    const w2y  = f2Top + (f2H - w2H) * 0.35;
    w2xs.forEach((wx, i) => {
      drawHotelWindow(ctx, wx, w2y, w2W, w2H, nf);
      ctx.fillStyle = rgb(lerpRGB([155, 58, 28], [58, 22, 9], nf*0.60));
      ctx.fillRect(wx - 3, w2y + w2H, w2W + 6, H*0.016);
      if (nf < 0.50) {
        const fCols = [[218,72,72],[255,175,48],[172,218,72],[218,72,218]];
        for (let f = 0; f < 3; f++) {
          ctx.fillStyle = rgba(fCols[(i+f) % 4], 0.88);
          ctx.beginPath(); ctx.arc(wx + w2W*(0.20 + f*0.30), w2y + w2H + H*0.006, H*0.007, 0, Math.PI*2); ctx.fill();
        }
      }
      ctx.fillStyle = rgb(trimC); ctx.fillRect(wx - 3, f2Top, w2W + 6, 4);
    });

    // Ground floor — corner pilasters
    ctx.fillStyle = rgb(colC);
    ctx.fillRect(HX, f1Top, HW*0.075, f1H);
    ctx.fillRect(HX + HW - HW*0.075, f1Top, HW*0.075, f1H);
    ctx.fillStyle = rgba([0,0,0], 0.06);
    ctx.fillRect(HX + HW*0.075, f1Top, 4, f1H);
    ctx.fillRect(HX + HW - HW*0.075 - 4, f1Top, 4, f1H);

    // Centre columns flanking entrance
    const colW = HW * 0.050, colH = f1H;
    [[HX + HW*0.200], [HX + HW*0.750 - colW]].forEach(([cx]) => {
      ctx.fillStyle = rgb(colC); ctx.fillRect(cx, f1Top, colW, colH);
      ctx.fillStyle = rgb(lerpRGB([228, 212, 178], [80, 66, 48], nf*0.65));
      ctx.fillRect(cx - 4, f1Top, colW + 8, H*0.014);
      ctx.fillRect(cx - 4, gY - H*0.014, colW + 8, H*0.014);
    });

    // Side windows on ground floor
    const wgW = HW * 0.132, wgH = f1H * 0.68;
    const wgy = f1Top + (f1H - wgH) * 0.25;
    [[HX + HW*0.085], [HX + HW*0.783]].forEach(([wx]) => drawHotelWindow(ctx, wx, wgy, wgW, wgH, nf));

    // Grand arched entrance
    const dW = HW * 0.26, dH = f1H * 0.92;
    const dX  = HX + (HW - dW) / 2, dY = gY - dH;
    const archR = dW / 2;
    const enterT = eOut(norm(t, 0.44, 0.50));
    const exitT  = eOut(norm(t, 0.83, 0.89));
    const openF  = Math.max(enterT, exitT);

    ctx.fillStyle = rgb(lerpRGB([128, 92, 48], [46, 32, 16], nf*0.70));
    ctx.beginPath();
    ctx.moveTo(dX - 6, gY); ctx.lineTo(dX - 6, dY + archR);
    ctx.quadraticCurveTo(dX - 6, dY - 6, dX + archR, dY - 6);
    ctx.quadraticCurveTo(dX + dW + 6, dY - 6, dX + dW + 6, dY + archR);
    ctx.lineTo(dX + dW + 6, gY); ctx.closePath(); ctx.fill();

    ctx.fillStyle = rgb(lerpRGB([38, 28, 18], [15, 10, 6], nf*0.5));
    ctx.beginPath();
    ctx.moveTo(dX, gY); ctx.lineTo(dX, dY + archR);
    ctx.quadraticCurveTo(dX, dY, dX + archR, dY);
    ctx.quadraticCurveTo(dX + dW, dY, dX + dW, dY + archR);
    ctx.lineTo(dX + dW, gY); ctx.closePath(); ctx.fill();

    const leafW = dW * 0.495, leafH = dH * 0.86;
    ctx.fillStyle = rgb(lerpRGB([162, 112, 62], [58, 38, 18], nf*0.70));
    ctx.fillRect(dX, dY + dH - leafH, leafW * (1-openF), leafH);
    ctx.fillRect(dX + dW - leafW*(1-openF), dY + dH - leafH, leafW*(1-openF), leafH);

    // Arch top stained glass
    ctx.fillStyle = nf > 0 ? rgba([255, 210, 70], Math.min(1, nf * 1.1)) : rgba([125, 188, 225], 0.62);
    ctx.beginPath();
    ctx.moveTo(dX, dY + archR);
    ctx.quadraticCurveTo(dX, dY, dX + archR, dY);
    ctx.quadraticCurveTo(dX + dW, dY, dX + dW, dY + archR);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba([80, 55, 28], 0.52); ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(dX + archR, dY); ctx.lineTo(dX + archR, dY + archR);
    ctx.moveTo(dX + archR*0.50, dY + archR*0.28); ctx.lineTo(dX + archR, dY + archR);
    ctx.moveTo(dX + archR*1.50, dY + archR*0.28); ctx.lineTo(dX + archR, dY + archR);
    ctx.stroke();

    // Topiary pots flanking entrance
    [dX - HW*0.090, dX + dW + HW*0.020].forEach(px => {
      const potW = W*0.030, potH = H*0.050;
      ctx.fillStyle = rgb(lerpRGB([172, 84, 40], [65, 30, 14], nf*0.65));
      ctx.beginPath();
      ctx.moveTo(px - potW*0.36, gY); ctx.lineTo(px - potW*0.50, gY - potH*0.58);
      ctx.lineTo(px + potW*0.50, gY - potH*0.58); ctx.lineTo(px + potW*0.36, gY);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = rgb(lerpRGB([88, 58, 26], [36, 22, 9], nf*0.5));
      ctx.fillRect(px - potW*0.50, gY - potH*0.58 - 3, potW, 6);
      ctx.strokeStyle = rgb(lerpRGB([88, 58, 26], [36, 22, 9], nf*0.5));
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(px, gY - potH*0.55); ctx.lineTo(px, gY - potH*0.55 - H*0.038); ctx.stroke();
      const br = W*0.024;
      ctx.fillStyle = rgb(lerpRGB([46, 145, 42], [17, 55, 15], nf*0.85));
      ctx.beginPath(); ctx.arc(px, gY - potH*0.55 - H*0.038 - br*0.60, br, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = rgba(lerpRGB([70, 182, 65], [25, 70, 22], nf*0.5), 0.46);
      ctx.beginPath(); ctx.arc(px - br*0.22, gY - potH*0.55 - H*0.038 - br*0.78, br*0.50, 0, Math.PI*2); ctx.fill();
    });
  }

  // ── Draw: Car ───────────────────────────────────────────────────────
  function drawCar(ctx, t, W, H) {
    const gY   = H * 0.70;
    const rTop = gY + H * 0.04;
    const rBot = gY + H * 0.22;
    const rMid = (rTop + rBot) / 2;
    const nf   = nightF(t);

    // Parked position = just left of hotel door
    const parkX = W * 0.535;

    let carX, moving = false;
    if (t < 0.18) {
      carX = lerp(-W * 0.18, parkX, eOut(norm(t, 0, 0.18)));
      moving = true;
    } else if (t > 0.90) {
      carX = lerp(parkX, W * 1.20, eIn(norm(t, 0.90, 1.00)));
      moving = true;
    } else {
      carX = parkX;
    }

    const cW = W * 0.145, cH = cW * 0.44;
    const cY = rMid - cH * 0.6;
    const wheelR = cH * 0.27;
    const wheelY = cY + cH * 0.96;

    // Car body — red in day, darker at night
    const bodyCol = lerpRGB([225, 45, 45], [130, 30, 30], nf*0.6);
    ctx.fillStyle = rgb(bodyCol);
    // Lower body
    ctx.beginPath();
    ctx.roundRect(carX, cY + cH*0.35, cW, cH*0.65, 5);
    ctx.fill();
    // Cabin
    ctx.beginPath();
    ctx.roundRect(carX + cW*0.22, cY, cW*0.58, cH*0.50, [7,7,0,0]);
    ctx.fill();

    // Windshields
    ctx.fillStyle = rgba(lerpRGB([150, 210, 240], [40, 70, 120], nf*0.7), 0.85);
    ctx.beginPath();
    ctx.roundRect(carX + cW*0.24, cY + cH*0.04, cW*0.54, cH*0.38, [5,5,0,0]);
    ctx.fill();
    // Windshield divider
    ctx.strokeStyle = rgba(bodyCol, 0.6);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(carX + cW*0.51, cY + cH*0.04);
    ctx.lineTo(carX + cW*0.51, cY + cH*0.42);
    ctx.stroke();

    // Wheel shadow
    [carX + cW*0.21, carX + cW*0.79].forEach(wx => {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(wx, wheelY + wheelR * 0.6, wheelR * 1.1, wheelR * 0.35, 0, 0, Math.PI*2);
      ctx.fill();
    });

    // Wheels (rotating when moving)
    const rot = moving ? (Date.now() * 0.008) : 0;
    [carX + cW*0.21, carX + cW*0.79].forEach(wx => {
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(wx, wheelY, wheelR, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#bbb';
      ctx.beginPath();
      ctx.arc(wx, wheelY, wheelR*0.50, 0, Math.PI*2);
      ctx.fill();
      // spokes
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const a = rot + (i * Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(wx + Math.cos(a)*wheelR*0.15, wheelY + Math.sin(a)*wheelR*0.15);
        ctx.lineTo(wx + Math.cos(a)*wheelR*0.85, wheelY + Math.sin(a)*wheelR*0.85);
        ctx.stroke();
      }
    });

    // Headlights (night)
    if (nf > 0.2) {
      const ha = nf * 0.7;
      const hx = carX + cW, hy = cY + cH * 0.50;
      const lg = ctx.createConicalGradient ? null :
        ctx.createRadialGradient(hx, hy, 0, hx + W*0.14, hy, W*0.18);
      if (lg) {
        lg.addColorStop(0, `rgba(255,250,200,${ha * 0.55})`);
        lg.addColorStop(1, 'rgba(255,250,200,0)');
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.moveTo(hx, hy - cH*0.10);
        ctx.lineTo(hx + W*0.18, hy - W*0.055);
        ctx.lineTo(hx + W*0.18, hy + W*0.055);
        ctx.lineTo(hx, hy + cH*0.10);
        ctx.closePath(); ctx.fill();
      }
      // headlight lens
      ctx.fillStyle = `rgba(255,250,180,${nf * 0.9})`;
      ctx.beginPath();
      ctx.ellipse(carX + cW - 2, cY + cH*0.50, 4, 4, 0, 0, Math.PI*2);
      ctx.fill();
    }

    // Tail lights
    ctx.fillStyle = `rgba(255,40,40,${0.5 + nf*0.4})`;
    ctx.fillRect(carX, cY + cH*0.45, 4, cH*0.28);
    ctx.fillStyle = `rgba(255,120,0,${0.5 + nf*0.3})`;
    ctx.fillRect(carX, cY + cH*0.72, 4, cH*0.15);

    // Exhaust puffs when moving
    if (moving) {
      for (let i = 0; i < 3; i++) {
        const px = carX - W*0.018 - i * W*0.02;
        const py = cY + cH*0.80 + Math.sin(Date.now()*0.004 + i) * 2;
        const pa = (0.25 - i*0.07) * clamp(1 - norm(t, 0, 0.04)) * clamp(norm(t, 0.90, 0.94));
        if (pa <= 0) continue;
        ctx.fillStyle = `rgba(200,200,200,${pa})`;
        ctx.beginPath();
        ctx.arc(px, py, W*0.008 + i*W*0.005, 0, Math.PI*2);
        ctx.fill();
      }
    }

    // Phone booking animation
    if (t > 0.30 && t < 0.44) {
      const ba = Math.min(1, norm(t, 0.30, 0.35)) * Math.max(0, 1 - norm(t, 0.40, 0.44));
      const lift = eOut(norm(t, 0.30, 0.35)) * H * 0.08;
      const bx = carX + cW * 0.5, by = cY - lift;
      ctx.globalAlpha = ba;
      // Phone
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath();
      ctx.roundRect(bx - W*0.022, by - H*0.06, W*0.044, H*0.075, 4);
      ctx.fill();
      ctx.fillStyle = rgba([135,206,235], 0.9);
      ctx.beginPath();
      ctx.roundRect(bx - W*0.018, by - H*0.056, W*0.036, H*0.065, 3);
      ctx.fill();
      // Checkmark
      if (t > 0.34) {
        const ca = clamp(norm(t, 0.34, 0.38));
        ctx.strokeStyle = `rgba(0,200,80,${ca})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx - W*0.008, by - H*0.024);
        ctx.lineTo(bx - W*0.002, by - H*0.014);
        ctx.lineTo(bx + W*0.012, by - H*0.038);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    return { carX, cW, cH, cY };
  }

  // ── Draw: Person walking ─────────────────────────────────────────────
  function drawPerson(ctx, t, W, H) {
    const gY   = H * 0.70;
    const rBot = gY + H * 0.22;
    const nf   = nightF(t);

    const parkX    = W * 0.535;
    const hotelDX  = W * 0.67 + W*0.28*0.50; // hotel door centre
    const cW       = W * 0.145;

    let px, alpha = 1, visible = false;

    if (t >= 0.42 && t < 0.56) {
      // Walking from car to hotel
      const wt = norm(t, 0.42, 0.53);
      px = lerp(parkX + cW*0.88, hotelDX, eIO(wt));
      alpha = Math.max(0, 1 - norm(t, 0.50, 0.56));
      visible = true;
    } else if (t >= 0.83 && t < 0.96) {
      // Walking out of hotel to the right
      const wt = norm(t, 0.83, 0.94);
      px = lerp(hotelDX, W * 0.92, eIO(wt));
      alpha = Math.min(1, norm(t, 0.83, 0.86)) * Math.max(0, 1 - norm(t, 0.92, 0.96));
      visible = true;
    }

    if (!visible || alpha <= 0) return;

    ctx.globalAlpha = alpha;
    const frame = Math.floor(Date.now() / 180) % 2;
    const pS = H * 0.09;
    const footY = rBot - H*0.025;
    const headY = footY - pS;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(px, footY + 2, pS*0.22, pS*0.07, 0, 0, Math.PI*2);
    ctx.fill();

    // Legs
    const legA = frame ? 0.38 : -0.38;
    ctx.strokeStyle = nf > 0.5 ? '#aac' : '#1E40AF';
    ctx.lineWidth = pS * 0.12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(px, footY - pS*0.28);
    ctx.lineTo(px - pS*0.15*Math.sin(legA),  footY - pS*0.02);
    ctx.moveTo(px, footY - pS*0.28);
    ctx.lineTo(px + pS*0.15*Math.sin(legA),  footY - pS*0.02);
    ctx.stroke();

    // Body
    ctx.strokeStyle = nf > 0.5 ? '#ccf' : '#2563EB';
    ctx.lineWidth = pS * 0.13;
    ctx.beginPath();
    ctx.moveTo(px, footY - pS*0.28);
    ctx.lineTo(px, headY + pS*0.22);
    ctx.stroke();

    // Arms
    const armA = frame ? -0.42 : 0.42;
    ctx.lineWidth = pS * 0.10;
    ctx.beginPath();
    ctx.moveTo(px, headY + pS*0.38);
    ctx.lineTo(px - pS*0.18*Math.cos(armA), headY + pS*0.38 + pS*0.18*Math.sin(Math.abs(armA)));
    ctx.moveTo(px, headY + pS*0.38);
    ctx.lineTo(px + pS*0.18*Math.cos(armA), headY + pS*0.38 + pS*0.18*Math.sin(Math.abs(armA)));
    ctx.stroke();

    // Head
    ctx.fillStyle = '#FDBCB4';
    ctx.beginPath();
    ctx.arc(px, headY + pS*0.13, pS*0.19, 0, Math.PI*2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  // ── Draw: Popup bubbles ──────────────────────────────────────────────
  function drawBubble(ctx, text, cx, cy, W, H, bgCol, alpha) {
    const pw = Math.min(W*0.21, 190), ph = H*0.058;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.roundRect(cx - pw/2 + 2, cy - ph/2 + 3, pw, ph, 8);
    ctx.fill();
    ctx.fillStyle = bgCol;
    ctx.beginPath();
    ctx.roundRect(cx - pw/2, cy - ph/2, pw, ph, 8);
    ctx.fill();
    // tail
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy + ph/2);
    ctx.lineTo(cx + 7, cy + ph/2);
    ctx.lineTo(cx, cy + ph/2 + H*0.018);
    ctx.closePath(); ctx.fill();
    // text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.round(ph*0.44)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
    ctx.textBaseline = 'alphabetic';
    ctx.globalAlpha = 1;
  }

  function drawPopups(ctx, t, W, H) {
    const gY = H * 0.70;
    const hotelCX = W*0.67 + W*0.28*0.5;

    // Hotel Jay Palace popup
    if (t > 0.18 && t < 0.42) {
      const a = Math.min(1, norm(t, 0.18, 0.24)) * Math.max(0, 1 - norm(t, 0.36, 0.42));
      const bounce = Math.sin(Date.now()*0.003) * H*0.008;
      drawBubble(ctx, '🏨 Hotel Jay Palace', hotelCX, gY - H*0.50 + bounce, W, H, '#1D4ED8', eOut(a));
    }

    // Booked confirmation
    if (t > 0.34 && t < 0.45) {
      const a = Math.min(1, norm(t, 0.34, 0.39)) * Math.max(0, 1 - norm(t, 0.41, 0.45));
      drawBubble(ctx, '✅ Room Booked!', W*0.535 + W*0.072, gY - H*0.30, W, H, '#16a34a', eOut(a));
    }

    // Good Morning
    if (t > 0.79 && t < 0.88) {
      const a = Math.min(1, norm(t, 0.79, 0.82)) * Math.max(0, 1 - norm(t, 0.85, 0.88));
      const bounce = Math.sin(Date.now()*0.003) * H*0.006;
      drawBubble(ctx, '☀️ Good Morning!', hotelCX, gY - H*0.50 + bounce, W, H, '#d97706', eOut(a));
    }
  }

  // ── Draw: Inn Sign Post with Hanging Board ──────────────────────────
  function drawHangingBoard(ctx, t, W, H) {
    const gY      = H * 0.70;
    const nf      = nightF(t);
    const postX   = W * 0.19;
    const barTop  = gY - H * 0.40;
    const armLen  = W * 0.14;
    const armEndX = postX + armLen;
    const postW   = W * 0.013;

    // Post shadow
    ctx.fillStyle = 'rgba(0,0,0,0.09)';
    ctx.fillRect(postX + 3, barTop + 3, postW, gY - barTop);

    // Vertical post
    ctx.fillStyle = rgb(lerpRGB([126, 82, 32], [50, 31, 11], nf * 0.70));
    ctx.beginPath();
    ctx.roundRect(postX - postW / 2, barTop, postW, gY - barTop, 3);
    ctx.fill();

    // Horizontal arm
    const armH = postW * 0.75;
    ctx.fillStyle = rgb(lerpRGB([115, 75, 28], [44, 27, 9], nf * 0.70));
    ctx.fillRect(postX - postW / 2, barTop, armLen + postW / 2, armH);

    // Cap on post top
    ctx.fillStyle = rgb(lerpRGB([92, 58, 22], [36, 22, 7], nf * 0.70));
    ctx.beginPath();
    ctx.roundRect(postX - postW * 1.2, barTop - postW * 0.85, postW * 2.4, postW * 0.75, 2);
    ctx.fill();

    // Cap at arm end
    ctx.beginPath();
    ctx.roundRect(armEndX - armH, barTop - postW * 0.25, armH * 1.1, postW * 1.1, 2);
    ctx.fill();

    // Board pivot at arm end
    const bW      = W * 0.18;
    const bH      = H * 0.26;
    const ropeLen = H * 0.036;
    const rSpan   = bW * 0.68;
    const swing   = Math.sin(Date.now() * 0.00065) * 0.022;

    ctx.save();
    ctx.translate(armEndX, barTop + armH);
    ctx.rotate(swing);

    // Ropes
    ctx.strokeStyle = rgba(lerpRGB([88, 58, 22], [36, 22, 7], nf * 0.70), 0.88);
    ctx.lineWidth = 2.0; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-rSpan / 2, 0); ctx.lineTo(-rSpan / 2, ropeLen);
    ctx.moveTo( rSpan / 2, 0); ctx.lineTo( rSpan / 2, ropeLen);
    ctx.stroke();

    // Board shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.roundRect(-bW / 2 + 3, ropeLen + 3, bW, bH, 9);
    ctx.fill();

    // Board body gradient
    const wg = ctx.createLinearGradient(0, ropeLen, 0, ropeLen + bH);
    wg.addColorStop(0, rgb(lerpRGB([170, 120, 52], [70, 44, 16], nf * 0.68)));
    wg.addColorStop(1, rgb(lerpRGB([145, 100, 40], [56, 35, 11], nf * 0.68)));
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.roundRect(-bW / 2, ropeLen, bW, bH, 9);
    ctx.fill();

    // Wood grain lines
    ctx.strokeStyle = rgba(lerpRGB([118, 80, 28], [46, 29, 9], nf * 0.5), 0.18);
    ctx.lineWidth = 0.7;
    for (let i = 1; i <= 7; i++) {
      const ly = ropeLen + bH * i / 8;
      ctx.beginPath();
      ctx.moveTo(-bW / 2 + 9, ly); ctx.lineTo(bW / 2 - 9, ly);
      ctx.stroke();
    }

    // Outer border
    ctx.strokeStyle = rgba(lerpRGB([80, 50, 16], [30, 18, 5], nf * 0.60), 0.90);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-bW / 2, ropeLen, bW, bH, 9);
    ctx.stroke();

    // Inner decorative frame
    ctx.strokeStyle = rgba(lerpRGB([80, 50, 16], [30, 18, 5], nf * 0.50), 0.30);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-bW / 2 + 8, ropeLen + 8, bW - 16, bH - 16, 5);
    ctx.stroke();

    // Corner nails
    const nc = rgba(lerpRGB([168, 168, 168], [68, 68, 68], nf * 0.40), 0.70);
    [[-bW/2+10, ropeLen+10],[bW/2-10, ropeLen+10],[-bW/2+10, ropeLen+bH-10],[bW/2-10, ropeLen+bH-10]].forEach(([nx, ny]) => {
      ctx.fillStyle = nc; ctx.beginPath(); ctx.arc(nx, ny, 3, 0, Math.PI * 2); ctx.fill();
    });

    // Text alpha (dim at night)
    const ta = Math.max(0.18, 0.95 - nf * 0.64);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';

    // Top ornament line
    ctx.strokeStyle = rgba(lerpRGB([212, 162, 70], [118, 86, 28], nf * 0.40), ta * 0.55);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-bW / 2 + 16, ropeLen + 20); ctx.lineTo(bW / 2 - 16, ropeLen + 20);
    ctx.stroke();

    // "Your Perfect Stay at"
    ctx.fillStyle = rgba(lerpRGB([240, 215, 165], [152, 122, 78], nf * 0.50), ta);
    ctx.font = `italic ${Math.round(bH * 0.090)}px Georgia, serif`;
    ctx.fillText('Your Perfect Stay at', 0, ropeLen + 24);

    // "Hotel Jay Palace"
    ctx.fillStyle = rgba(lerpRGB([255, 210, 58], [175, 140, 38], nf * 0.40), ta);
    ctx.font = `bold ${Math.round(bH * 0.150)}px Georgia, serif`;
    ctx.fillText('Hotel Jay Palace', 0, ropeLen + bH * 0.188);

    // Middle divider
    ctx.strokeStyle = rgba(lerpRGB([195, 150, 56], [92, 70, 20], nf * 0.40), ta * 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-bW / 2 + 24, ropeLen + bH * 0.385); ctx.lineTo(bW / 2 - 24, ropeLen + bH * 0.385);
    ctx.stroke();

    // Description lines
    ctx.fillStyle = rgba(lerpRGB([226, 202, 156], [135, 106, 66], nf * 0.40), ta * 0.90);
    ctx.font = `${Math.round(bH * 0.078)}px Arial, sans-serif`;
    ['Experience warm hospitality,', 'comfortable rooms &', 'world-class service', 'in the heart of Saraipali.'].forEach((ln, i) => {
      ctx.fillText(ln, 0, ropeLen + bH * 0.402 + i * bH * 0.115);
    });

    // Bottom ornament line
    ctx.strokeStyle = rgba(lerpRGB([212, 162, 70], [118, 86, 28], nf * 0.40), ta * 0.55);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-bW / 2 + 16, ropeLen + bH - 15); ctx.lineTo(bW / 2 - 16, ropeLen + bH - 15);
    ctx.stroke();

    ctx.textBaseline = 'alphabetic';

    // Bird on top-right corner of board
    drawBirdOnBoard(ctx, nf, bW, ropeLen, H);
    ctx.restore();
  }

  function drawBirdOnBoard(ctx, nf, bW, ropeLen, H) {
    const bx  = 0;             // centred on arm end = sitting on crossbar
    const by  = -(H * 0.034); // above board pivot = on the arm
    const bs  = H * 0.030;
    const wUp = Math.sin(Date.now() * 0.007) > 0.65;

    if (nf > 0.72) {
      // Sleeping — puffed ball, head tucked
      const sa = Math.max(0.20, 0.88 - nf * 0.55);
      ctx.fillStyle = rgba(lerpRGB([70, 115, 192], [34, 56, 96], nf * 0.5), sa);
      ctx.beginPath();
      ctx.ellipse(bx, by + bs * 0.25, bs * 0.72, bs * 0.58, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(lerpRGB([52, 95, 175], [26, 48, 88], nf * 0.5), sa);
      ctx.beginPath();
      ctx.arc(bx - bs * 0.30, by + bs * 0.36, bs * 0.35, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const a = Math.max(0.55, 0.98 - nf * 0.40);

    // Wings
    [[-bs*0.12, -0.28, wUp ? -0.52 : -0.12], [bs*0.12, 0.28, wUp ? 0.52 : 0.12]].forEach(([dx, ex, rot]) => {
      ctx.save();
      ctx.translate(bx + dx, by);
      ctx.rotate(rot);
      ctx.fillStyle = rgba(lerpRGB([46, 96, 186], [20, 46, 92], nf * 0.40), a);
      ctx.beginPath();
      ctx.ellipse(Math.sign(ex) * bs * 0.38, 0, bs * 0.60, bs * 0.20, Math.sign(ex) * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Body
    ctx.fillStyle = rgba(lerpRGB([62, 125, 205], [30, 62, 102], nf * 0.40), a);
    ctx.beginPath();
    ctx.ellipse(bx, by + bs * 0.08, bs * 0.50, bs * 0.40, -0.12, 0, Math.PI * 2);
    ctx.fill();

    // Breast — warm orange
    ctx.fillStyle = rgba(lerpRGB([250, 138, 46], [155, 76, 17], nf * 0.40), a * 0.92);
    ctx.beginPath();
    ctx.ellipse(bx + bs * 0.10, by + bs * 0.22, bs * 0.30, bs * 0.26, 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = rgba(lerpRGB([50, 100, 190], [24, 50, 94], nf * 0.40), a);
    ctx.beginPath();
    ctx.arc(bx + bs * 0.40, by - bs * 0.16, bs * 0.34, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(bx + bs * 0.55, by - bs * 0.23, bs * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a0a18';
    ctx.beginPath(); ctx.arc(bx + bs * 0.57, by - bs * 0.24, bs * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(bx + bs * 0.60, by - bs * 0.26, bs * 0.03, 0, Math.PI * 2); ctx.fill();

    // Beak
    ctx.fillStyle = rgba(lerpRGB([250, 206, 46], [155, 126, 26], nf * 0.30), a);
    ctx.beginPath();
    ctx.moveTo(bx + bs * 0.70, by - bs * 0.18);
    ctx.lineTo(bx + bs * 1.00, by - bs * 0.24);
    ctx.lineTo(bx + bs * 0.70, by - bs * 0.10);
    ctx.closePath(); ctx.fill();

    // Feet
    ctx.strokeStyle = rgba(lerpRGB([92, 70, 28], [42, 32, 11], nf * 0.40), a * 0.80);
    ctx.lineWidth = 1.2; ctx.lineCap = 'round';
    ctx.beginPath();
    // left foot
    ctx.moveTo(bx - bs*0.08, by+bs*0.42); ctx.lineTo(bx - bs*0.08, by+bs*0.58);
    ctx.moveTo(bx - bs*0.08, by+bs*0.58); ctx.lineTo(bx - bs*0.28, by+bs*0.70);
    ctx.moveTo(bx - bs*0.08, by+bs*0.58); ctx.lineTo(bx - bs*0.04, by+bs*0.73);
    ctx.moveTo(bx - bs*0.08, by+bs*0.58); ctx.lineTo(bx + bs*0.10, by+bs*0.68);
    // right foot
    ctx.moveTo(bx + bs*0.12, by+bs*0.42); ctx.lineTo(bx + bs*0.12, by+bs*0.58);
    ctx.moveTo(bx + bs*0.12, by+bs*0.58); ctx.lineTo(bx - bs*0.06, by+bs*0.70);
    ctx.moveTo(bx + bs*0.12, by+bs*0.58); ctx.lineTo(bx + bs*0.18, by+bs*0.73);
    ctx.moveTo(bx + bs*0.12, by+bs*0.58); ctx.lineTo(bx + bs*0.30, by+bs*0.66);
    ctx.stroke();
  }

  // ── Draw: Monkey with Rock Signs ────────────────────────────────────
  function drawMonkeyRock(ctx, t, W, H) {
    const gY  = H * 0.70;
    const nf  = nightF(t);
    const rCX = W * 0.50;
    const rRX = W * 0.112;
    const bY  = gY - H * 0.004;
    const rH  = H * 0.245;       // total rock height

    // Boulder silhouette — mix of lineTo (flat planes) + small curves (worn edges)
    // This combination is what makes it read as "rock" rather than a blob.
    function boulderPath() {
      ctx.beginPath();
      ctx.moveTo(rCX - rRX*0.80, bY);                        // ground-left
      ctx.lineTo(rCX - rRX*1.05, bY - rH*0.26);             // left-lower face ◄ straight = flat stone plane
      ctx.quadraticCurveTo(
        rCX - rRX*1.08, bY - rH*0.48,
        rCX - rRX*0.96, bY - rH*0.62);                       // left-mid (slightly worn)
      ctx.lineTo(rCX - rRX*0.66, bY - rH*0.84);             // upper-left face ◄ straight
      ctx.quadraticCurveTo(
        rCX - rRX*0.38, bY - rH*1.02,
        rCX - rRX*0.04, bY - rH*1.04);                       // top shoulder (rounded)
      ctx.lineTo(rCX + rRX*0.40, bY - rH*0.95);             // top-right slope ◄ straight
      ctx.quadraticCurveTo(
        rCX + rRX*0.76, bY - rH*0.83,
        rCX + rRX*1.00, bY - rH*0.58);                       // right shoulder
      ctx.lineTo(rCX + rRX*1.05, bY - rH*0.36);             // right face ◄ straight + steep
      ctx.quadraticCurveTo(
        rCX + rRX*1.02, bY - rH*0.12,
        rCX + rRX*0.80, bY);                                  // ground-right
      ctx.closePath();
    }

    // Ridge / fulcrum point — where planes meet on the front face
    const rdgX = rCX - rRX * 0.04;
    const rdgY = bY - rH * 0.63;

    // Cast shadow on ground
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.beginPath();
    ctx.ellipse(rCX + W*0.014, bY + H*0.010, rRX * 0.86, H * 0.022, 0, 0, Math.PI*2);
    ctx.fill();

    // ── Base fill (shadow / darkest tone) ──────────────────────────────
    ctx.fillStyle = rgb(lerpRGB([100, 104, 110], [38, 40, 46], nf*0.70));
    boulderPath(); ctx.fill();

    // ── Left face (medium lit — side light from left sky) ──────────────
    ctx.fillStyle = rgb(lerpRGB([148, 152, 158], [56, 60, 66], nf*0.65));
    ctx.beginPath();
    ctx.moveTo(rCX - rRX*0.78, bY);
    ctx.lineTo(rCX - rRX*1.05, bY - rH*0.26);
    ctx.lineTo(rCX - rRX*0.96, bY - rH*0.62);
    ctx.lineTo(rCX - rRX*0.66, bY - rH*0.84);
    ctx.lineTo(rdgX, rdgY);
    ctx.lineTo(rdgX, bY - rH*0.08);
    ctx.closePath(); ctx.fill();

    // ── Top cap face (brightest — direct sunlight from above) ──────────
    ctx.fillStyle = rgb(lerpRGB([195, 200, 206], [78, 82, 90], nf*0.62));
    ctx.beginPath();
    ctx.moveTo(rCX - rRX*0.66, bY - rH*0.84);
    ctx.lineTo(rCX - rRX*0.04, bY - rH*1.04);
    ctx.lineTo(rCX + rRX*0.40, bY - rH*0.95);
    ctx.lineTo(rCX + rRX*0.18, bY - rH*0.70);
    ctx.lineTo(rdgX, rdgY);
    ctx.closePath(); ctx.fill();

    // ── Top-left edge highlight (sky catchlight) ────────────────────────
    ctx.fillStyle = rgba(lerpRGB([222, 226, 232], [88, 92, 100], nf*0.50), 0.48);
    ctx.beginPath();
    ctx.moveTo(rCX - rRX*0.66, bY - rH*0.84);
    ctx.quadraticCurveTo(rCX - rRX*0.38, bY - rH*1.02, rCX - rRX*0.04, bY - rH*1.04);
    ctx.lineTo(rCX - rRX*0.08, bY - rH*0.92);
    ctx.quadraticCurveTo(rCX - rRX*0.36, bY - rH*0.90, rCX - rRX*0.62, bY - rH*0.80);
    ctx.closePath(); ctx.fill();

    // ── Face-plane seam lines (crisp boundary = stone cleavage look) ────
    ctx.strokeStyle = rgba(lerpRGB([68, 72, 78], [26, 28, 34], nf*0.55), 0.52);
    ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath();
    // Central vertical ridge (top → centre → base)
    ctx.moveTo(rCX - rRX*0.04, bY - rH*1.04);
    ctx.lineTo(rdgX, rdgY);
    ctx.lineTo(rdgX, bY - rH*0.08);
    // Left-face upper boundary
    ctx.moveTo(rCX - rRX*0.66, bY - rH*0.84);
    ctx.lineTo(rdgX, rdgY);
    // Top-right boundary
    ctx.moveTo(rCX + rRX*0.40, bY - rH*0.95);
    ctx.lineTo(rCX + rRX*0.18, bY - rH*0.70);
    ctx.stroke();

    // ── Surface crack lines ─────────────────────────────────────────────
    ctx.strokeStyle = rgba(lerpRGB([80, 84, 90], [30, 32, 38], nf*0.50), 0.30);
    ctx.lineWidth = 1; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(rCX - rRX*0.48, bY - rH*0.40);
    ctx.quadraticCurveTo(rCX - rRX*0.15, bY - rH*0.48, rCX + rRX*0.12, bY - rH*0.38);
    ctx.moveTo(rCX + rRX*0.25, bY - rH*0.24);
    ctx.quadraticCurveTo(rCX + rRX*0.44, bY - rH*0.18, rCX + rRX*0.58, bY - rH*0.26);
    ctx.stroke();

    // ── Boulder outline (strong edge) ───────────────────────────────────
    ctx.strokeStyle = rgba(lerpRGB([62, 66, 72], [22, 24, 30], nf*0.65), 0.85);
    ctx.lineWidth = 2.5;
    boulderPath(); ctx.stroke();

    // ── Grass/dirt at base (rock sits in the ground) ────────────────────
    ctx.fillStyle = rgba(lerpRGB([52, 108, 40], [20, 40, 14], nf*0.65), 0.40);
    ctx.beginPath();
    ctx.ellipse(rCX - rRX*0.08, bY - rH*0.04, rRX*0.62, rH*0.06, 0, 0, Math.PI*2);
    ctx.fill();

    // ── TEXT PAINTED ON FRONT FACE ──────────────────────────────────────
    const ta = Math.max(0.32, 0.96 - nf * 0.62);
    // Chalk/painted text colour: off-white for contrast on stone
    const textC = lerpRGB([22, 16, 8], [10, 7, 3], nf * 0.50);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba(textC, ta);

    // "BOOK" — top half of face
    ctx.font = `bold ${Math.max(14, Math.round(rH * 0.178))}px Arial Black, Arial, sans-serif`;
    ctx.fillText('BOOK', rCX - rRX*0.04, bY - rH*0.720);

    // "YOUR STAY!"
    ctx.font = `bold ${Math.max(12, Math.round(rH * 0.148))}px Arial Black, Arial, sans-serif`;
    ctx.fillText('YOUR STAY!', rCX - rRX*0.04, bY - rH*0.548);

    // Divider
    ctx.strokeStyle = rgba(textC, ta * 0.36);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rCX - rRX*0.66, bY - rH*0.438);
    ctx.lineTo(rCX + rRX*0.58, bY - rH*0.438);
    ctx.stroke();

    // "VIEW ROOMS"
    ctx.fillStyle = rgba(textC, ta * 0.88);
    ctx.font = `bold ${Math.max(11, Math.round(rH * 0.122))}px Arial, sans-serif`;
    ctx.fillText('VIEW ROOMS', rCX - rRX*0.04, bY - rH*0.302);
    ctx.textBaseline = 'alphabetic';

    // Monkey beside rock
    drawMonkeyAtRock(ctx, nf, rCX + rRX * 1.10, gY, H);
  }

  function drawMonkeyAtRock(ctx, nf, mx, gY, H) {
    const mS  = H * 0.082;
    const bob = Math.sin(Date.now() * 0.0022) * H * 0.004;
    const my  = gY - mS * 0.52;

    // Tail curled behind
    ctx.save();
    ctx.strokeStyle = rgba(lerpRGB([132, 85, 40], [52, 33, 13], nf*0.55), 0.90);
    ctx.lineWidth = mS * 0.175; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(mx - mS*0.16, my + mS*0.58 + bob);
    ctx.bezierCurveTo(mx - mS*0.78, my + mS*1.05, mx - mS*1.02, my + mS*0.28, mx - mS*0.70, my - mS*0.05);
    ctx.stroke();
    ctx.restore();

    // Legs (seated)
    ctx.strokeStyle = rgb(lerpRGB([145, 96, 46], [58, 36, 14], nf*0.55));
    ctx.lineWidth = mS * 0.19; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mx - mS*0.18, my + mS*0.60 + bob);
    ctx.quadraticCurveTo(mx - mS*0.45, my + mS*0.82, mx - mS*0.26, my + mS*1.06);
    ctx.moveTo(mx + mS*0.16, my + mS*0.60 + bob);
    ctx.quadraticCurveTo(mx + mS*0.40, my + mS*0.82, mx + mS*0.20, my + mS*1.06);
    ctx.stroke();

    // Body
    ctx.fillStyle = rgb(lerpRGB([150, 100, 50], [62, 40, 15], nf*0.55));
    ctx.beginPath();
    ctx.ellipse(mx, my + mS*0.17 + bob, mS*0.44, mS*0.50, 0, 0, Math.PI*2);
    ctx.fill();

    // Belly patch
    ctx.fillStyle = rgba(lerpRGB([220, 175, 120], [95, 68, 36], nf*0.50), 0.70);
    ctx.beginPath();
    ctx.ellipse(mx, my + mS*0.24 + bob, mS*0.25, mS*0.32, 0, 0, Math.PI*2);
    ctx.fill();

    // Left arm (leaning on rock)
    ctx.strokeStyle = rgb(lerpRGB([140, 92, 44], [56, 34, 13], nf*0.55));
    ctx.lineWidth = mS * 0.20; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mx - mS*0.36, my - mS*0.02 + bob);
    ctx.quadraticCurveTo(mx - mS*0.70, my - mS*0.04, mx - mS*0.88, my + mS*0.08);
    ctx.stroke();

    // Right arm (pointing at rock signs)
    ctx.beginPath();
    ctx.moveTo(mx + mS*0.36, my - mS*0.02 + bob);
    ctx.quadraticCurveTo(mx + mS*0.08, my - mS*0.44, mx - mS*0.26, my - mS*0.58);
    ctx.stroke();

    // Head
    ctx.fillStyle = rgb(lerpRGB([150, 100, 50], [62, 40, 15], nf*0.55));
    ctx.beginPath(); ctx.arc(mx, my - mS*0.54 + bob, mS*0.43, 0, Math.PI*2); ctx.fill();

    // Ears
    [[mx - mS*0.41, mS*0.17], [mx + mS*0.41, mS*0.17]].forEach(([ex, er]) => {
      ctx.fillStyle = rgb(lerpRGB([150, 100, 50], [62, 40, 15], nf*0.55));
      ctx.beginPath(); ctx.arc(ex, my - mS*0.54 + bob, er, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = rgba(lerpRGB([220, 172, 115], [95, 60, 26], nf*0.45), 0.60);
      ctx.beginPath(); ctx.arc(ex, my - mS*0.54 + bob, er*0.55, 0, Math.PI*2); ctx.fill();
    });

    // Face patch
    ctx.fillStyle = rgba(lerpRGB([220, 172, 115], [95, 60, 26], nf*0.45), 0.76);
    ctx.beginPath(); ctx.ellipse(mx, my - mS*0.48 + bob, mS*0.26, mS*0.29, 0, 0, Math.PI*2); ctx.fill();

    // Eyes
    if (nf > 0.72) {
      ctx.strokeStyle = rgba([52, 32, 14], 0.82); ctx.lineWidth = mS * 0.082; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(mx - mS*0.148, my - mS*0.60 + bob, mS*0.095, Math.PI, 0, true);
      ctx.arc(mx + mS*0.148, my - mS*0.60 + bob, mS*0.095, Math.PI, 0, true);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(mx - mS*0.150, my - mS*0.61 + bob, mS*0.115, 0, Math.PI*2);
      ctx.arc(mx + mS*0.150, my - mS*0.61 + bob, mS*0.115, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#180800';
      ctx.beginPath();
      ctx.arc(mx - mS*0.130, my - mS*0.625 + bob, mS*0.075, 0, Math.PI*2);
      ctx.arc(mx + mS*0.170, my - mS*0.625 + bob, mS*0.075, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.beginPath();
      ctx.arc(mx - mS*0.108, my - mS*0.648 + bob, mS*0.038, 0, Math.PI*2);
      ctx.arc(mx + mS*0.192, my - mS*0.648 + bob, mS*0.038, 0, Math.PI*2);
      ctx.fill();
    }

    // Nose
    ctx.fillStyle = rgba([100, 58, 22], 0.84);
    ctx.beginPath(); ctx.ellipse(mx, my - mS*0.42 + bob, mS*0.085, mS*0.060, 0, 0, Math.PI*2); ctx.fill();

    // Smile / sleep
    ctx.strokeStyle = rgba([72, 40, 14], 0.82); ctx.lineWidth = mS * 0.060; ctx.lineCap = 'round';
    ctx.beginPath();
    if (nf < 0.65) {
      ctx.arc(mx, my - mS*0.31 + bob, mS*0.135, 0.14, Math.PI - 0.14, false);
    } else {
      ctx.moveTo(mx - mS*0.09, my - mS*0.34 + bob); ctx.lineTo(mx + mS*0.09, my - mS*0.34 + bob);
    }
    ctx.stroke();
  }

  // ── Draw: Location Pin (bouncing above hotel) ────────────────────────
  function drawLocationPin(ctx, t, W, H) {
    const gY  = H * 0.70;
    const nf  = nightF(t);
    const HX  = W * 0.67, HW = W * 0.28, HH = H * 0.44;
    const pX  = HX + HW * 0.50;
    const pY0 = gY - HH - H * 0.068;
    const pY  = pY0 + Math.sin(Date.now() * 0.0020) * H * 0.010;
    const pS  = H * 0.058;

    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(pX + 2, pY0 + 2, pS*0.24, pS*0.09, 0, 0, Math.PI*2);
    ctx.fill();

    const pinC = rgba(lerpRGB([34, 115, 228], [16, 55, 110], nf*0.55), 0.96);
    ctx.fillStyle = pinC;
    ctx.beginPath(); ctx.arc(pX, pY, pS * 0.40, 0, Math.PI*2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(pX - pS*0.25, pY + pS*0.20);
    ctx.quadraticCurveTo(pX, pY + pS*0.88, pX, pY + pS*0.88);
    ctx.quadraticCurveTo(pX, pY + pS*0.88, pX + pS*0.25, pY + pS*0.20);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.90)';
    ctx.beginPath(); ctx.arc(pX, pY, pS * 0.20, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = rgba(lerpRGB([80, 155, 255], [30, 72, 148], nf*0.40), 0.48);
    ctx.beginPath(); ctx.arc(pX - pS*0.14, pY - pS*0.14, pS*0.14, 0, Math.PI*2); ctx.fill();
  }

  // ── Main ─────────────────────────────────────────────────────────────
  function init() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'heroScene';
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;cursor:default;';
    hero.insertBefore(canvas, hero.firstChild);

    const ctx = canvas.getContext('2d');
    let W = 0, H = 0;

    function resize() {
      W = canvas.width  = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight;
    }
    resize();
    new ResizeObserver(resize).observe(hero);

    // ── Sign hit-testing (matches drawMonkeyRock boulder positions) ──
    function signBounds() {
      const rCX = W * 0.50, rRX = W * 0.112;
      const bY  = H * 0.70 - H * 0.004;
      const rH  = H * 0.245;
      return {
        book:  { l: rCX - rRX*0.78, r: rCX + rRX*0.62, t: bY - rH*0.84, b: bY - rH*0.44 },
        rooms: { l: rCX - rRX*0.74, r: rCX + rRX*0.58, t: bY - rH*0.44, b: bY - rH*0.14 },
      };
    }
    function hitSign(ex, ey) {
      const rect = canvas.getBoundingClientRect();
      const x = (ex - rect.left) * (W / rect.width);
      const y = (ey - rect.top)  * (H / rect.height);
      const b = signBounds();
      if (x >= b.book.l  && x <= b.book.r  && y >= b.book.t  && y <= b.book.b)  return 'book';
      if (x >= b.rooms.l && x <= b.rooms.r && y >= b.rooms.t && y <= b.rooms.b) return 'rooms';
      return null;
    }
    function fireHit(cx, cy) {
      const hit = hitSign(cx, cy);
      if (hit === 'book'  && typeof openBookingModal === 'function') openBookingModal();
      if (hit === 'rooms') { const el = document.getElementById('rooms'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
    }
    canvas.addEventListener('mousemove', function(e) {
      canvas.style.cursor = hitSign(e.clientX, e.clientY) ? 'pointer' : 'default';
    });
    canvas.addEventListener('click', function(e) { fireHit(e.clientX, e.clientY); });
    canvas.addEventListener('touchend', function(e) {
      e.preventDefault();
      const t = e.changedTouches[0];
      fireHit(t.clientX, t.clientY);
    }, { passive: false });

    let start = null;
    function frame(ts) {
      if (!start) start = ts;
      const t = ((ts - start) % LOOP_MS) / LOOP_MS;

      ctx.clearRect(0, 0, W, H);
      drawSky(ctx, t, W, H);
      drawStars(ctx, t, W, H);
      drawSun(ctx, t, W, H);
      drawMoon(ctx, t, W, H);
      drawGround(ctx, t, W, H);
      drawTrees(ctx, t, W, H);
      drawHangingBoard(ctx, t, W, H);

      const moving = t < 0.18 || t > 0.90;
      drawRoad(ctx, t, W, H, null, moving);
      drawHotel(ctx, t, W, H);
      drawLocationPin(ctx, t, W, H);
      drawMonkeyRock(ctx, t, W, H);
      drawCar(ctx, t, W, H);
      drawPerson(ctx, t, W, H);
      drawPopups(ctx, t, W, H);

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
