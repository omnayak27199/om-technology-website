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
    [[0.04, 1.0], [0.10, 1.2], [0.17, 0.85]].forEach(([fx, sc]) => {
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

  // ── Main ─────────────────────────────────────────────────────────────
  function init() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'heroScene';
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;';
    hero.insertBefore(canvas, hero.firstChild);

    const ctx = canvas.getContext('2d');
    let W = 0, H = 0;

    function resize() {
      W = canvas.width  = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight;
    }
    resize();
    new ResizeObserver(resize).observe(hero);

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
