/* ============================================
   REVEAL.JS — Révélation et retour hub (Sprint 2)
   ============================================ */
(function () {
    function showDiscoveryScreen(idx) {
        const g = guardianData[idx];
        const color = g.color || '#ffb7c5';
        const dark = g.dark || '#ff1493';
        const kanji = g.kanji || '';
        const discoveryText = g.discovery || `L'âme de ${g.n} est libérée...`;

        const old = document.getElementById('discovery-overlay');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'discovery-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9500;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0a0010;opacity:0;transition:opacity 0.4s ease;';
        document.body.appendChild(overlay);

        const flash = document.createElement('div');
        flash.style.cssText = `position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,${color} 0%,transparent 70%);opacity:0;pointer-events:none;transition:opacity 0.3s ease;`;
        overlay.appendChild(flash);

        const kanjiEl = document.createElement('div');
        kanjiEl.textContent = kanji;
        kanjiEl.style.cssText = `position:absolute;font-family:'Ma Shan Zheng',cursive;font-size:min(55vw,340px);color:${color};opacity:0.07;pointer-events:none;user-select:none;line-height:1;`;
        overlay.appendChild(kanjiEl);

        const halo = document.createElement('div');
        halo.style.cssText = 'position:relative;width:220px;height:220px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;';
        const haloRing = document.createElement('div');
        haloRing.style.cssText = `position:absolute;inset:-20px;border-radius:50%;background:conic-gradient(${color},${dark},#fff,${color});opacity:0;animation:discoveryHaloSpin 3s linear infinite;filter:blur(8px);transition:opacity 0.8s ease;`;
        halo.appendChild(haloRing);

        const relicWrap = document.createElement('div');
        relicWrap.style.cssText = `position:relative;z-index:2;width:180px;height:180px;display:flex;align-items:center;justify-content:center;transform:scale(0);transition:transform 0.6s cubic-bezier(0.17,0.89,0.32,1.49);filter:drop-shadow(0 0 30px ${color});`;
        relicWrap.innerHTML = getRelicSVG(idx);
        const svg = relicWrap.querySelector('svg');
        if (svg) {
            svg.style.width = '180px';
            svg.style.height = '180px';
        }
        halo.appendChild(relicWrap);
        overlay.appendChild(halo);

        const nameEl = document.createElement('div');
        nameEl.textContent = g.n;
        nameEl.style.cssText = `font-family:'Ma Shan Zheng',cursive;font-size:54px;color:${color};text-shadow:0 0 30px ${color},0 0 60px ${dark};opacity:0;transform:translateY(20px);transition:opacity 0.6s ease,transform 0.6s ease;margin-bottom:8px;text-align:center;`;
        overlay.appendChild(nameEl);

        const kanjiSmall = document.createElement('div');
        kanjiSmall.textContent = kanji;
        kanjiSmall.style.cssText = `font-family:'Ma Shan Zheng',cursive;font-size:24px;color:${dark};opacity:0;transition:opacity 0.6s ease 0.2s;margin-bottom:20px;`;
        overlay.appendChild(kanjiSmall);

        const textEl = document.createElement('div');
        textEl.style.cssText = `font-family:'Ma Shan Zheng',cursive;font-size:18px;color:rgba(255,255,255,0.85);text-align:center;max-width:320px;line-height:1.7;opacity:0;transition:opacity 0.6s ease 0.4s;margin-bottom:32px;padding:0 20px;`;
        overlay.appendChild(textEl);

        const btn = document.createElement('button');
        btn.textContent = '✨ Que l\'épreuve commence...';
        btn.style.cssText = `font-family:'Ma Shan Zheng',cursive;font-size:20px;color:#fff;background:linear-gradient(135deg,${dark},${color});border:none;border-radius:50px;padding:14px 32px;cursor:pointer;opacity:0;transform:scale(0.8);transition:opacity 0.5s ease 0.6s,transform 0.5s ease 0.6s;box-shadow:0 4px 20px ${dark}88;`;
        overlay.appendChild(btn);

        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });

        setTimeout(() => {
            flash.style.opacity = '0.6';
        }, 100);
        setTimeout(() => {
            flash.style.opacity = '0';
        }, 500);

        setTimeout(() => {
            haloRing.style.opacity = '0.8';
            relicWrap.style.transform = 'scale(1)';
            try {
                playGameSFX('chime_portal');
            } catch (e) {}
            for (let i = 0; i < 12; i++) {
                const p = document.createElement('div');
                const a = (i / 12) * Math.PI * 2;
                const d = 80 + Math.random() * 120;
                p.style.cssText = `position:absolute;left:50%;top:50%;width:${4 + Math.random() * 6}px;height:${4 + Math.random() * 6}px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color};transform:translate(-50%,-50%);animation:discoveryParticle 1s ease-out forwards;--tx:${Math.cos(a) * d}px;--ty:${Math.sin(a) * d}px;animation-delay:${Math.random() * 0.3}s;pointer-events:none;`;
                overlay.appendChild(p);
                setTimeout(() => p.remove(), 1400);
            }
        }, 600);

        setTimeout(() => {
            nameEl.style.opacity = '1';
            nameEl.style.transform = 'translateY(0)';
            kanjiSmall.style.opacity = '1';
        }, 1200);

        setTimeout(() => {
            textEl.style.opacity = '1';
            let i = 0;
            const chars = discoveryText.split('');
            const tw = setInterval(() => {
                textEl.textContent += chars[i];
                i++;
                if (i >= chars.length) clearInterval(tw);
            }, 40);
        }, 1600);

        setTimeout(() => {
            btn.style.opacity = '1';
            btn.style.transform = 'scale(1)';
        }, 2400);

        btn.onclick = () => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                stopScan();
                clearInterval(heartInterval);
                setupQuiz();
            }, 400);
        };
    }

    function winGame() {
        const wonIndex = currentFound;
        foundGuardians.add(wonIndex);
        if (window.syncStateFromGlobals) syncStateFromGlobals();
        if (typeof saveProgress === 'function') saveProgress();
        window.ondevicemotion = null;
        document.body.ontouchstart = null;
        document.body.onmouseup = null;
        window._memTap = null;
        window.mem = null;
        cancelVoice();

        if (micStream) {
            micStream.getTracks().forEach(t => t.stop());
            cancelAnimationFrame(micLoop);
            document.getElementById('mic-gauge')?.style.setProperty('display', 'none');
        }

        const arena = document.getElementById('game-arena');
        if (arena) arena.innerHTML = `<div class="win-relic-icon">${getRelicSVG(wonIndex)}</div>`;
        const instr = document.getElementById('game-instr');
        if (instr) instr.innerText = 'RÉUSSI !';
        setTimeout(() => {
            if (foundGuardians.size >= 9) launchFinalCinematic();
            else animateSoulToHub(wonIndex);
        }, 1500);
    }

    function animateSoulToHub(idx) {
        transitionScreen('screen-hub');
        document.getElementById('miko-belt')?.classList.add('visible');
        setTimeout(() => {
            const grid = document.getElementById('grid-nekos');
            if (!grid) return;
            grid.innerHTML = '';
            guardianData.forEach((g, i) => {
                const isUnlocked = foundGuardians.has(i) && i !== idx;
                const svgIcon = getRelicSVG(i);
                grid.innerHTML += `<div id="slot-${i}" class="slot ${isUnlocked ? 'unlocked' : 'locked'}" onclick="handleSlotClick(${i})">${svgIcon}</div>`;
            });

            const flyingSoul = document.createElement('div');
            flyingSoul.className = 'captured-soul';
            flyingSoul.innerHTML = getRelicSVG(idx);
            flyingSoul.style.color = 'var(--gold)';
            document.body.appendChild(flyingSoul);

            setTimeout(() => {
                const targetSlot = document.getElementById(`slot-${idx}`);
                if (!targetSlot) {
                    if (window.HubModule?.enterHub) window.HubModule.enterHub();
                    return;
                }
                const rect = targetSlot.getBoundingClientRect();
                const x = rect.left + rect.width / 2 - window.innerWidth / 2;
                const y = rect.top + rect.height / 2 - window.innerHeight * 0.4;
                flyingSoul.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(0.5)`;

                setTimeout(() => {
                    flyingSoul.remove();
                    targetSlot.classList.add('unlocked', 'just-unlocked');
                    targetSlot.innerHTML = getRelicSVG(idx);
                    confetti({ particleCount: 80, colors: ['#ffd700', '#ffb7c5', '#ffffff'], origin: { x: rect.left / window.innerWidth, y: rect.top / window.innerHeight } });
                    playCorrect();
                    const foundCountEl = document.getElementById('found-count');
                    const progressBarEl = document.getElementById('hub-progress-bar');
                    if (foundCountEl) foundCountEl.innerText = foundGuardians.size;
                    if (progressBarEl) progressBarEl.style.width = (foundGuardians.size / 9 * 100) + '%';
                    document.documentElement.style.setProperty('--bg-lightness', (10 + (foundGuardians.size * 8)) + '%');
                    updateDynamicMusic();
                    hubTimer = 0;
                    document.documentElement.style.setProperty('--darkness', 0);
                    if (heartInterval) clearInterval(heartInterval);
                    heartInterval = setInterval(updateHeartBeat, 1000);
                    updateMikoBelt();
                    if (window.syncStateFromGlobals) syncStateFromGlobals();
                    if (typeof saveProgress === 'function') saveProgress();
                    setTimeout(() => targetSlot.classList.remove('just-unlocked'), 700);
                }, 1000);
            }, 100);
        }, 600);
    }

    function setOutroMood(mood) {
        if (window.setSakuraMood) window.setSakuraMood(mood);
    }

    window.RevealModule = {
        showDiscoveryScreen,
        winGame,
        animateSoulToHub,
        setOutroMood,
    };
})();
