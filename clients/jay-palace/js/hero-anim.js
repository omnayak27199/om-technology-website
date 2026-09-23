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

  // ── Draw: Trees (left scenery) ──────────────────────────────────────
  function drawTrees(ctx, t, W, H) {
    const gY = H * 0.70;
    const nf = nightF(t);
    [[0.10, 1.2], [0.17, 0.85]].forEach(([fx, sc]) => {
      const tx = fx * W, bY = gY, tH = H * 0.16 * sc, trH = tH * 0.30, trW = W * 0.011;
      ctx.fillStyle = rgb(lerpRGB([110, 75, 32], [50, 32, 12], nf));
      ctx.fillRect(tx - trW/2, bY - trH, trW, trH);
      ctx.fillStyle = rgb(lerpRGB([50, 140, 48], [18, 50, 15], nf));
      ctx.beginPath();
      ctx.moveTo(tx, bY - tH);
      ctx.lineTo(tx - W*0.032, bY - trH);
      ctx.lineTo(tx + W*0.032, bY - trH);
      ctx.closePath(); ctx.fill();
      // second tier
      ctx.beginPath();
      ctx.moveTo(tx, bY - tH * 0.72);
      ctx.lineTo(tx - W*0.040, bY - trH * 0.7);
      ctx.lineTo(tx + W*0.040, bY - trH * 0.7);
      ctx.closePath(); ctx.fill();
    });
  }

  // ── Draw: Hotel ─────────────────────────────────────────────────────
  function drawHotel(ctx, t, W, H) {
    const gY = H * 0.70;
    const nf = nightF(t);
    const HW = W * 0.22, HH = H * 0.38;
    const HX = W * 0.72, HY = gY - HH;

    // Main building
    ctx.fillStyle = rgb(lerpRGB([230, 215, 195], [80, 65, 50], nf * 0.75));
    ctx.beginPath();
    ctx.roundRect(HX, HY, HW, HH, [4, 4, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = rgba([100, 80, 55], 0.4);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(HX, HY, HW, HH, [4, 4, 0, 0]);
    ctx.stroke();

    // Roof / triangle top
    ctx.fillStyle = rgb(lerpRGB([180, 60, 40], [60, 18, 10], nf * 0.75));
    ctx.beginPath();
    ctx.moveTo(HX - 4, HY);
    ctx.lineTo(HX + HW / 2, HY - H * 0.065);
    ctx.lineTo(HX + HW + 4, HY);
    ctx.closePath(); ctx.fill();

    // Columns at base
    [0.18, 0.50, 0.82].forEach(cx => {
      ctx.fillStyle = rgb(lerpRGB([210, 200, 185], [60, 50, 38], nf * 0.6));
      ctx.fillRect(HX + cx*HW - 4, gY - HH*0.30, 8, HH*0.30);
    });

    // Windows — 3 col × 2 row
    const wW = HW * 0.18, wH = HH * 0.14;
    const padX = (HW - 3*wW) / 4, padY = HH*0.07;
    const rowSpY = (HH*0.55 - 2*wH) / 3;

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const wx = HX + padX + c*(wW + padX);
        const wy = HY + padY + r*(wH + rowSpY);
        const isMidTop = (r===0 && c===1); // special person window

        // Night glow
        if (nf > 0.1) {
          const glowColor = [255, 220, 80];
          const glow = ctx.createRadialGradient(wx+wW/2, wy+wH/2, 0, wx+wW/2, wy+wH/2, wW);
          glow.addColorStop(0, rgba(glowColor, nf * 0.5));
          glow.addColorStop(1, rgba(glowColor, 0));
          ctx.fillStyle = glow;
          ctx.fillRect(wx - wW*0.5, wy - wH*0.5, wW*2, wH*2);
        }

        // Window pane
        if (nf > 0) {
          ctx.fillStyle = rgba([255, 230, 100], Math.min(1, nf * 1.2));
        } else if (isMidTop && t > 0.76 && t < 0.86) {
          // Window opens in morning — sky blue
          ctx.fillStyle = rgba([135, 206, 235], 0.9);
        } else {
          ctx.fillStyle = rgba([130, 180, 210], 0.7);
        }
        ctx.beginPath();
        ctx.roundRect(wx, wy, wW, wH, 2);
        ctx.fill();

        // Window frame
        ctx.strokeStyle = rgba([80, 60, 40], 0.55);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(wx, wy, wW, wH, 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(wx + wW/2, wy); ctx.lineTo(wx + wW/2, wy + wH);
        ctx.moveTo(wx, wy + wH*0.45); ctx.lineTo(wx + wW, wy + wH*0.45);
        ctx.stroke();

        // Person peeking at window during morning
        if (isMidTop && t > 0.76 && t < 0.86) {
          const wpa = Math.min(1, norm(t, 0.76, 0.79)) * Math.max(0, 1 - norm(t, 0.83, 0.86));
          ctx.globalAlpha = wpa;
          ctx.fillStyle = '#FDBCB4';
          ctx.beginPath();
          ctx.arc(wx + wW/2, wy + wH*0.5, wW*0.26, 0, Math.PI*2);
          ctx.fill();
          // wave hand
          ctx.strokeStyle = '#FDBCB4';
          ctx.lineWidth = 2;
          const handAngle = Math.sin(Date.now() * 0.006) * 0.5;
          ctx.beginPath();
          ctx.moveTo(wx + wW*0.70, wy + wH*0.42);
          ctx.lineTo(wx + wW*0.70 + Math.cos(handAngle)*wW*0.18, wy + wH*0.30 + Math.sin(handAngle)*wH*0.15);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // ZZZ from window at night
        if (isMidTop && nf > 0.6) {
          const zAlpha = clamp(nf - 0.2) * 0.9;
          const zt = (Date.now() % 3000) / 3000;
          ctx.globalAlpha = zAlpha * clamp(1 - zt);
          ctx.fillStyle = 'white';
          ctx.font = `bold ${Math.round(H*0.025)}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText('z', wx + wW/2 + wW*0.4, wy - H*0.02 - zt * H*0.06);
          ctx.font = `bold ${Math.round(H*0.018)}px Arial`;
          ctx.fillText('z', wx + wW/2 + wW*0.65, wy - H*0.05 - zt * H*0.05);
          ctx.font = `bold ${Math.round(H*0.013)}px Arial`;
          ctx.fillText('z', wx + wW/2 + wW*0.85, wy - H*0.08 - zt * H*0.04);
          ctx.globalAlpha = 1;
        }
      }
    }

    // Door
    const dW = HW*0.20, dH = HH*0.24;
    const dX = HX + (HW - dW)/2, dY = gY - dH;
    const enterT = eOut(norm(t, 0.44, 0.50));
    const exitT  = eOut(norm(t, 0.83, 0.89));
    const openF  = Math.max(enterT, exitT);

    // Door frame
    ctx.fillStyle = rgb(lerpRGB([120, 85, 50], [45, 28, 14], nf*0.7));
    ctx.fillRect(dX - 3, dY - 3, dW + 6, dH + 3);

    // Door panels (split open)
    const half = dW / 2;
    ctx.fillStyle = rgb(lerpRGB([170, 120, 75], [60, 40, 20], nf*0.7));
    ctx.fillRect(dX,                dY, half * (1-openF), dH);  // left leaf
    ctx.fillRect(dX + half + half*openF, dY, half * (1-openF), dH);  // right leaf

    // Hotel name sign above door
    const signH = H * 0.035, signY = HY - H * 0.005;
    ctx.fillStyle = rgb(lerpRGB([30, 80, 200], [10, 28, 80], nf*0.5));
    ctx.beginPath();
    ctx.roundRect(HX, signY - signH, HW, signH, [3,3,0,0]);
    ctx.fill();
    ctx.fillStyle = rgba([255,255,255], 0.95);
    ctx.font = `bold ${Math.round(signH * 0.55)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Hotel Jay Palace', HX + HW/2, signY - signH/2);
    ctx.textBaseline = 'alphabetic';
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
    const hotelDX  = W * 0.72 + W*0.22*0.50; // hotel door center
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
    const hotelCX = W*0.72 + W*0.22*0.5;

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
    const postX   = W * 0.26;
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
    const bx  = bW * 0.28;
    const by  = ropeLen - H * 0.027;
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

  // ── Draw: Monkey Tree with Signs ────────────────────────────────────
  function drawMonkeyTree(ctx, t, W, H) {
    const gY  = H * 0.70;
    const nf  = nightF(t);
    const tx  = W * 0.46;
    const tH  = H * 0.48;
    const trH = tH * 0.28;
    const trW = W * 0.013;

    // Trunk shadow
    ctx.fillStyle = 'rgba(0,0,0,0.09)';
    ctx.beginPath();
    ctx.moveTo(tx + 3, gY);
    ctx.quadraticCurveTo(tx + 4, gY - trH * 0.5, tx + trW * 0.5 + 3, gY - trH);
    ctx.quadraticCurveTo(tx + trW * 0.8 + 3, gY - trH, tx + trW + 3, gY);
    ctx.closePath(); ctx.fill();

    // Trunk
    ctx.fillStyle = rgb(lerpRGB([106, 68, 24], [40, 25, 8], nf * 0.72));
    ctx.beginPath();
    ctx.moveTo(tx - trW, gY);
    ctx.quadraticCurveTo(tx - trW * 0.4, gY - trH * 0.55, tx - trW * 0.3, gY - trH);
    ctx.quadraticCurveTo(tx,              gY - trH * 1.04,  tx + trW * 0.3, gY - trH);
    ctx.quadraticCurveTo(tx + trW * 0.4,  gY - trH * 0.55, tx + trW, gY);
    ctx.closePath(); ctx.fill();

    const branchY = gY - trH - H * 0.02;

    // Main branch right (monkey sits here)
    ctx.strokeStyle = rgb(lerpRGB([96, 60, 20], [36, 23, 7], nf * 0.72));
    ctx.lineWidth = W * 0.013; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx + trW * 0.3, branchY + H * 0.02);
    ctx.quadraticCurveTo(tx + W * 0.07, branchY - H * 0.015, tx + W * 0.16, branchY + H * 0.008);
    ctx.stroke();

    // Lower branch (for second sign)
    ctx.lineWidth = W * 0.009;
    ctx.beginPath();
    ctx.moveTo(tx + trW * 0.3, branchY + H * 0.06);
    ctx.quadraticCurveTo(tx + W * 0.055, branchY + H * 0.048, tx + W * 0.125, branchY + H * 0.066);
    ctx.stroke();

    // Small branch upper-left (decorative)
    ctx.lineWidth = W * 0.007;
    ctx.beginPath();
    ctx.moveTo(tx - trW * 0.3, branchY + H * 0.02);
    ctx.quadraticCurveTo(tx - W * 0.042, branchY - H * 0.022, tx - W * 0.075, branchY - H * 0.010);
    ctx.stroke();

    // Foliage — layered circles
    const lc1 = lerpRGB([40, 136, 38], [13, 48, 12], nf * 0.88);
    const lc2 = lerpRGB([26, 105, 24], [9, 34, 9],   nf * 0.88);
    [
      [tx,            gY - tH,           W * 0.075],
      [tx + W * 0.050, gY - tH + H*0.055, W * 0.060],
      [tx - W * 0.055, gY - tH + H*0.062, W * 0.055],
      [tx + W * 0.020, gY - tH + H*0.118, W * 0.052],
      [tx - W * 0.025, gY - tH + H*0.105, W * 0.048],
      [tx - W * 0.074, gY - tH + H*0.022, W * 0.038], // left-branch bunch
    ].forEach(([lx, ly, lr]) => {
      ctx.fillStyle = rgb(lc1);
      ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.fill();
    });
    [[tx + W*0.018, gY - tH + H*0.058, W*0.030],[tx - W*0.022, gY - tH + H*0.085, W*0.026]].forEach(([lx, ly, lr]) => {
      ctx.fillStyle = rgb(lc2);
      ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.fill();
    });

    // "Book Your Stay!" sign at end of upper branch
    drawHangingSign(ctx, nf, tx + W*0.158, branchY + H*0.008, 'Book Your Stay!', W*0.148, H*0.062, [37, 99, 235], 0.83);

    // "View Rooms" sign at end of lower branch
    drawHangingSign(ctx, nf, tx + W*0.122, branchY + H*0.066, 'View Rooms →', W*0.128, H*0.055, [124, 58, 237], 1.55);

    // Monkey on upper branch
    drawMonkey(ctx, nf, tx + W * 0.064, branchY + H * 0.008, H);
  }

  function drawHangingSign(ctx, nf, cx, cy, text, sW, sH, colorArr, phaseOff) {
    const swing = Math.sin(Date.now() * 0.00085 + phaseOff) * 0.030;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(swing);

    const ropeLen = sH * 0.52;

    // Ropes
    ctx.strokeStyle = rgba(lerpRGB([102, 50, 24], [40, 25, 8], nf * 0.70), 0.82);
    ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-sW * 0.30, 0); ctx.lineTo(-sW * 0.30, ropeLen);
    ctx.moveTo( sW * 0.30, 0); ctx.lineTo( sW * 0.30, ropeLen);
    ctx.stroke();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath();
    ctx.roundRect(-sW / 2 + 3, ropeLen + 3, sW, sH, 6);
    ctx.fill();

    // Board wood
    ctx.fillStyle = rgb(lerpRGB([188, 140, 65], [74, 46, 17], nf * 0.65));
    ctx.beginPath();
    ctx.roundRect(-sW / 2, ropeLen, sW, sH, 6);
    ctx.fill();

    // Color header strip
    ctx.fillStyle = rgba(colorArr, Math.max(0.10, 0.85 - nf * 0.56));
    ctx.beginPath();
    ctx.roundRect(-sW / 2, ropeLen, sW, sH * 0.28, 6);
    ctx.fill();

    // Border
    ctx.strokeStyle = rgba(lerpRGB([102, 68, 24], [40, 25, 8], nf * 0.65), 0.72);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-sW / 2, ropeLen, sW, sH, 6);
    ctx.stroke();

    // Text
    const ta = Math.max(0.20, 0.92 - nf * 0.58);
    ctx.fillStyle = rgba(lerpRGB([255, 250, 226], [176, 150, 106], nf * 0.45), ta);
    ctx.font = `bold ${Math.round(sH * 0.33)}px Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, ropeLen + sH * 0.60);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  function drawMonkey(ctx, nf, mx, my, H) {
    const mS    = H * 0.080;
    const bob   = Math.sin(Date.now() * 0.0022) * H * 0.006;
    const scr   = Math.sin(Date.now() * 0.003) > 0.65;
    my += bob;

    // Tail
    ctx.save();
    ctx.strokeStyle = rgba(lerpRGB([130, 82, 38], [50, 31, 12], nf * 0.55), 0.92);
    ctx.lineWidth = mS * 0.19; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(mx - mS*0.20, my + mS*0.58);
    ctx.bezierCurveTo(mx - mS*0.82, my + mS*1.05, mx - mS*1.05, my + mS*0.28, mx - mS*0.72, my - mS*0.08);
    ctx.stroke();
    ctx.restore();

    // Body
    ctx.fillStyle = rgb(lerpRGB([150, 100, 50], [62, 40, 15], nf * 0.55));
    ctx.beginPath();
    ctx.ellipse(mx, my + mS*0.20, mS*0.47, mS*0.58, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly cream patch
    ctx.fillStyle = rgba(lerpRGB([220, 178, 125], [110, 78, 40], nf * 0.50), 0.70);
    ctx.beginPath();
    ctx.ellipse(mx, my + mS*0.28, mS*0.28, mS*0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // Arms
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // Left arm — gripping branch
    ctx.strokeStyle = rgb(lerpRGB([140, 92, 44], [56, 34, 13], nf * 0.55));
    ctx.lineWidth = mS * 0.21;
    ctx.beginPath();
    ctx.moveTo(mx - mS*0.38, my - mS*0.05);
    ctx.quadraticCurveTo(mx - mS*0.68, my - mS*0.30, mx - mS*0.60, my - mS*0.62);
    ctx.stroke();

    // Right arm — scratching head or waving
    ctx.lineWidth = mS * 0.19;
    ctx.beginPath();
    ctx.moveTo(mx + mS*0.38, my - mS*0.05);
    if (scr) {
      ctx.quadraticCurveTo(mx + mS*0.75, my - mS*0.40, mx + mS*0.28, my - mS*0.80);
    } else {
      ctx.quadraticCurveTo(mx + mS*0.78, my - mS*0.25, mx + mS*0.75, my + mS*0.25);
    }
    ctx.stroke();

    // Head
    ctx.fillStyle = rgb(lerpRGB([150, 100, 50], [62, 40, 15], nf * 0.55));
    ctx.beginPath();
    ctx.arc(mx, my - mS*0.58, mS*0.45, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.fillStyle = rgb(lerpRGB([150, 100, 50], [62, 40, 15], nf * 0.55));
    ctx.beginPath();
    ctx.arc(mx - mS*0.43, my - mS*0.56, mS*0.18, 0, Math.PI * 2);
    ctx.arc(mx + mS*0.43, my - mS*0.56, mS*0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(lerpRGB([220, 175, 120], [96, 62, 30], nf * 0.45), 0.62);
    ctx.beginPath();
    ctx.arc(mx - mS*0.43, my - mS*0.56, mS*0.10, 0, Math.PI * 2);
    ctx.arc(mx + mS*0.43, my - mS*0.56, mS*0.10, 0, Math.PI * 2);
    ctx.fill();

    // Face patch
    ctx.fillStyle = rgba(lerpRGB([220, 175, 120], [96, 62, 30], nf * 0.45), 0.78);
    ctx.beginPath();
    ctx.ellipse(mx, my - mS*0.52, mS*0.28, mS*0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    if (nf > 0.72) {
      ctx.strokeStyle = rgba([52, 32, 14], 0.80);
      ctx.lineWidth = mS * 0.085; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(mx - mS*0.155, my - mS*0.62, mS*0.10, Math.PI, 0, true);
      ctx.arc(mx + mS*0.155, my - mS*0.62, mS*0.10, Math.PI, 0, true);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#180800';
      ctx.beginPath();
      ctx.arc(mx - mS*0.155, my - mS*0.62, mS*0.095, 0, Math.PI * 2);
      ctx.arc(mx + mS*0.155, my - mS*0.62, mS*0.095, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.68)';
      ctx.beginPath();
      ctx.arc(mx - mS*0.125, my - mS*0.65, mS*0.040, 0, Math.PI * 2);
      ctx.arc(mx + mS*0.185, my - mS*0.65, mS*0.040, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nose
    ctx.fillStyle = rgba([100, 58, 24], 0.84);
    ctx.beginPath();
    ctx.ellipse(mx, my - mS*0.46, mS*0.088, mS*0.065, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = rgba([72, 40, 14], 0.82);
    ctx.lineWidth = mS * 0.062; ctx.lineCap = 'round';
    ctx.beginPath();
    if (nf < 0.65) {
      ctx.arc(mx, my - mS*0.34, mS*0.14, 0.12, Math.PI - 0.12, false);
    } else {
      ctx.moveTo(mx - mS*0.10, my - mS*0.37);
      ctx.lineTo(mx + mS*0.10, my - mS*0.37);
    }
    ctx.stroke();
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

    // ── Sign hit-testing (matches drawMonkeyTree sign positions) ──────
    function signBounds() {
      const tx      = W * 0.46;
      const branchY = H * 0.70 - H * 0.48 * 0.28 - H * 0.02; // = H * 0.5456
      const s1cy = branchY + H * 0.008, s1sH = H * 0.062;
      const s2cy = branchY + H * 0.066, s2sH = H * 0.055;
      return {
        book:  { l: tx + W*0.084, r: tx + W*0.232, t: s1cy + s1sH*0.52, b: s1cy + s1sH*1.52 },
        rooms: { l: tx + W*0.058, r: tx + W*0.186, t: s2cy + s2sH*0.52, b: s2cy + s2sH*1.52 },
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
      drawMonkeyTree(ctx, t, W, H);
      drawTrees(ctx, t, W, H);
      drawHangingBoard(ctx, t, W, H);

      const moving = t < 0.18 || t > 0.90;
      drawRoad(ctx, t, W, H, null, moving);
      drawHotel(ctx, t, W, H);
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
