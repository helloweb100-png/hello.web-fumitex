/* ==========================================================================
   FUMITEX · Control de Plagas · app.js
   Capa de movimiento e interacción.

   Dependencias (CDN, con respaldo): GSAP + ScrollTrigger, Lenis.
   Si alguna no carga, la página sigue siendo 100% legible y funcional.

   ÍNDICE
   00 Utilidades          08 Manifiesto (scrub)     16 Garantía + contadores
   01 Loader              09 Zoom del lente         17 Footer
   02 Scroll suave        10 Plagas (objetivos)     18 Formulario → WhatsApp
   03 Navegación y menú   11 Tu hogar (plano)       19 WhatsApp flotante
   04 Texto dividido      12 Método (pin horiz.)    20 Botones (magnético / fill)
   05 Hero (intro/mira)   13 Seguridad (bento)      21 Arranque
   06 Campo de partículas 14 Revelados genéricos
   07 Marquesina          15 FAQ
   20b Galería de trabajos (entrada, paralaje y visor)    20c Mapa
   ========================================================================== */
(() => {
    'use strict';

    window.__fx = true; // avisa al failsafe del <head> que el script sí cargó

    /* 00 · UTILIDADES ====================================================== */
    const WA_NUMBER = '528117432138';
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const root = document.documentElement;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const hasGSAP = !!(window.gsap && window.ScrollTrigger);
    const animate = hasGSAP && !reduce;           // ¿hay movimiento completo?
    const waLink = msg => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

    let lenis = null;
    let menuOpen = false;

    const safe = (name, fn) => {
        try { fn(); } catch (err) { console.warn(`[Fumitex] módulo "${name}" falló:`, err); }
    };

    /* Todos los enlaces con mensaje prellenado de WhatsApp */
    $$('[data-wa]').forEach(a => { a.href = waLink(a.dataset.wa); });

    if (hasGSAP) {
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.config({ ignoreMobileResize: true });
    }
    if (animate) root.classList.add('anim');

    /* 01 · LOADER ========================================================== */
    function runLoader(onExit) {
        const el = $('#loader');
        if (!el) { root.classList.remove('is-loading'); onExit(); return; }

        const bar = $('#loader-bar'), pct = $('#loader-pct'), status = $('#loader-status');
        const rings = $$('.loader__ring');
        const steps = [[0, 'Inicializando sistema'], [22, 'Escaneando el entorno'], [48, 'Detectando plagas'], [74, 'Aplicando protocolo seguro'], [96, 'Hogar protegido']];
        const minMs = reduce ? 400 : 2400;
        const t0 = performance.now();
        let ready = false, shown = 0, lastMsg = -1, finished = false;

        const loaded = document.readyState === 'complete'
            ? Promise.resolve()
            : new Promise(res => addEventListener('load', res, { once: true }));
        const fonts = document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve();
        Promise.all([loaded, fonts]).then(() => { ready = true; });
        setTimeout(() => { ready = true; }, 6500); // respaldo: nunca bloquear al visitante

        const finish = () => {
            if (finished) return; finished = true;
            const done = () => { el.style.display = 'none'; root.classList.remove('is-loading'); if (lenis) lenis.start(); };
            if (hasGSAP && !reduce) {
                const tl = gsap.timeline({ onComplete: done });
                tl.to('.loader__core', { opacity: 0, scale: 1.12, duration: .55, ease: 'power2.in' })
                  .to('.loader__panel--t', { yPercent: -101, duration: 1.1, ease: 'expo.inOut' }, '-=.05')
                  .to('.loader__panel--b', { yPercent: 101, duration: 1.1, ease: 'expo.inOut' }, '<')
                  .add(onExit, '-=.75');
            } else {
                el.style.transition = 'opacity .5s'; el.style.opacity = '0';
                setTimeout(done, 520); onExit();
            }
        };

        const tick = now => {
            const t = clamp((now - t0) / minMs, 0, 1);
            let target = 1 - Math.pow(1 - t, 2.2);
            if (!ready) target = Math.min(target, .92);
            shown = Math.max(shown, target * 100);
            const v = Math.min(100, shown);
            pct.textContent = String(Math.round(v)).padStart(3, '0');
            bar.style.transform = `scaleX(${v / 100})`;
            rings.forEach(r => { r.style.strokeDashoffset = String(100 - v); });
            for (let i = steps.length - 1; i >= 0; i--) {
                if (v >= steps[i][0]) { if (i !== lastMsg) { lastMsg = i; status.textContent = steps[i][1]; } break; }
            }
            if (v >= 99.6 && ready) { pct.textContent = '100'; setTimeout(finish, 260); } else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    /* 02 · SCROLL SUAVE (Lenis) ============================================ */
    function initScroll() {
        if (!reduce && window.Lenis) {
            lenis = new Lenis({ lerp: .085, wheelMultiplier: .92, smoothWheel: true });
            lenis.stop(); // se libera al terminar el loader
            if (hasGSAP) {
                lenis.on('scroll', ScrollTrigger.update);
                gsap.ticker.add(t => lenis.raf(t * 1000));
                gsap.ticker.lagSmoothing(0);
            } else {
                const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
                requestAnimationFrame(raf);
            }
        }

        // Anclas internas con scroll animado
        $$('a[href^="#"]').forEach(a => {
            a.addEventListener('click', e => {
                const id = a.getAttribute('href');
                if (!id || id.length < 2) return;
                const target = $(id);
                if (!target) return;
                e.preventDefault();
                if (menuOpen) toggleMenu(false);
                if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.7, easing: t => 1 - Math.pow(1 - t, 4) });
                else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
                try { history.replaceState(null, '', id); } catch (_) { /* file:// */ }
            });
        });
    }

    /* 03 · NAVEGACIÓN Y MENÚ =============================================== */
    const burger = $('#burger'), menu = $('#menu'), nav = $('#nav');

    function toggleMenu(open) {
        menuOpen = typeof open === 'boolean' ? open : !menuOpen;
        menu.classList.toggle('is-open', menuOpen);
        menu.setAttribute('aria-hidden', String(!menuOpen));
        burger.setAttribute('aria-expanded', String(menuOpen));
        burger.setAttribute('aria-label', menuOpen ? 'Cerrar menú' : 'Abrir menú');
        if (menuOpen) { nav.classList.remove('is-hidden'); lenis ? lenis.stop() : (root.style.overflow = 'hidden'); }
        else { lenis ? lenis.start() : (root.style.overflow = ''); }
    }

    function initNav() {
        burger.addEventListener('click', () => toggleMenu());
        addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) { toggleMenu(false); burger.focus(); } });
        matchMedia('(min-width: 900px)').addEventListener('change', e => { if (e.matches && menuOpen) toggleMenu(false); });

        // Fondo sólido tras salir del tope (sin listener de scroll: centinela + IntersectionObserver)
        const sentinel = document.createElement('div');
        sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:48px;pointer-events:none';
        document.body.prepend(sentinel);
        new IntersectionObserver(([en]) => nav.classList.toggle('is-solid', !en.isIntersecting)).observe(sentinel);

        if (hasGSAP) {
            // Se oculta al bajar y reaparece al subir
            ScrollTrigger.create({
                start: 0, end: 'max',
                onUpdate: self => {
                    if (menuOpen) return;
                    if (self.direction === 1 && self.scroll() > 560) nav.classList.add('is-hidden');
                    else if (self.direction === -1) nav.classList.remove('is-hidden');
                }
            });
            // Barra de progreso de lectura
            if (!reduce) gsap.to('#progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .25 } });
        }
    }

    /* 04 · TEXTO DIVIDIDO ================================================== */
    function splitWords(el) {
        const out = [];
        const walk = node => {
            Array.from(node.childNodes).forEach(n => {
                if (n.nodeType === 3) {
                    const frag = document.createDocumentFragment();
                    n.textContent.split(/(\s+)/).forEach(part => {
                        if (!part) return;
                        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
                        const w = document.createElement('span'); w.className = 'w';
                        const wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = part;
                        w.appendChild(wi); frag.appendChild(w); out.push(wi);
                    });
                    n.replaceWith(frag);
                } else if (n.nodeType === 1 && !n.classList.contains('w')) walk(n);
            });
        };
        walk(el);
        return out;
    }

    /* 05 · HERO ============================================================ */
    let heroWords = [];

    function prepHero() {
        heroWords = $$('.hero__line').flatMap(splitWords);
        if (animate) {
            gsap.set(heroWords, { yPercent: 115 });
            gsap.set('.scope__tilt', { opacity: 0, scale: .62, rotation: -28 });
            gsap.set('.nav', { yPercent: -100 });
        }
    }

    function heroIntro() {
        root.classList.add('is-ready');
        if (!animate) { heroWords.forEach(w => { w.style.transform = 'none'; }); $$('.js-hide').forEach(e => { e.style.opacity = 1; e.style.transform = 'none'; }); return; }
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.to('.nav', { yPercent: 0, duration: 1.2 }, 0)
          .to('.scope__tilt', { opacity: 1, scale: 1, rotation: 0, duration: 2.1 }, 0)
          .to(heroWords, { yPercent: 0, duration: 1.25, stagger: .075 }, .15)
          .fromTo('[data-hero="in"]', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.1, stagger: .13, ease: 'power3.out' }, .35);
    }

    function initHeroMotion() {
        const hero = $('.hero');
        const tilt = $('#scope-tilt');
        if (!hero || !tilt || !animate) return;

        gsap.set(tilt, { transformPerspective: 1100 });

        if (finePointer) {
            const rx = gsap.quickTo(tilt, 'rotationY', { duration: 1, ease: 'power3' });
            const ry = gsap.quickTo(tilt, 'rotationX', { duration: 1, ease: 'power3' });
            const ret = $('#hero-reticle'), xy = $('#reticle-xy');
            const rtx = gsap.quickTo(ret, 'x', { duration: .45, ease: 'power3' });
            const rty = gsap.quickTo(ret, 'y', { duration: .45, ease: 'power3' });
            let lastTxt = 0;

            hero.addEventListener('pointermove', e => {
                const r = hero.getBoundingClientRect();
                const nx = (e.clientX - r.left) / r.width - .5;
                const ny = (e.clientY - r.top) / r.height - .5;
                rx(nx * 14); ry(-ny * 12);
                rtx(e.clientX - r.left); rty(e.clientY - r.top);
                const now = performance.now();
                if (now - lastTxt > 60) {
                    lastTxt = now;
                    xy.textContent = `X ${String(Math.round(e.clientX)).padStart(3, '0')} Y ${String(Math.round(e.clientY)).padStart(3, '0')}`;
                }
            });
            hero.addEventListener('pointerenter', () => gsap.to(ret, { opacity: 1, duration: .4 }));
            hero.addEventListener('pointerleave', () => { gsap.to(ret, { opacity: 0, duration: .4 }); rx(0); ry(0); });
        } else {
            // Táctil: oscilación constante para que la mira siempre esté viva
            gsap.to(tilt, { rotationY: 9, rotationX: -6, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        }

        // Al salir del hero: el contenido se desvanece y la mira se aleja
        gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
            .to('.hero__copy', { y: -70, opacity: .15, ease: 'none' }, 0)
            .to('.scope', { y: 90, scale: .9, opacity: .25, ease: 'none' }, 0)
            .to('.hero__bgword', { yPercent: -18, ease: 'none' }, 0);
    }

    /* 06 · CAMPO DE PARTÍCULAS (canvas) ==================================== */
    function createField(canvas, opts) {
        const ctx = canvas.getContext('2d');
        const host = canvas.parentElement;
        const cfg = Object.assign({ density: 15000, max: 90, link: 112, speed: .26, red: .38 }, opts);
        const m = { x: 0, y: 0, on: false };
        let w = 0, h = 0, dpr = 1, parts = [], raf = 0, running = false, inView = true;

        const spawn = init => ({
            x: Math.random() * w, y: init ? Math.random() * h : h + 12,
            vx: (Math.random() - .5) * cfg.speed, vy: -(Math.random() * cfg.speed + .08),
            r: Math.random() * 1.7 + .5, a: Math.random() * .5 + .18,
            red: Math.random() < cfg.red, ph: Math.random() * 6.28
        });

        const build = () => {
            const n = Math.round(clamp((w * h) / cfg.density, 22, cfg.max));
            parts = Array.from({ length: n }, () => spawn(true));
        };

        const resize = () => {
            const r = host.getBoundingClientRect();
            w = r.width; h = r.height;
            dpr = Math.min(window.devicePixelRatio || 1, 1.75);
            canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            build(); if (!running) draw(false);
        };

        function draw(move = true) {
            ctx.clearRect(0, 0, w, h);
            for (const p of parts) {
                if (move) {
                    p.ph += .012; p.x += p.vx + Math.sin(p.ph) * .12; p.y += p.vy;
                    if (m.on) {
                        const dx = p.x - m.x, dy = p.y - m.y, d2 = dx * dx + dy * dy;
                        if (d2 < 16900) { const d = Math.sqrt(d2) || 1, f = (1 - d / 130) * 1.7; p.x += dx / d * f; p.y += dy / d * f; }
                    }
                    if (p.y < -12 || p.x < -12 || p.x > w + 12) Object.assign(p, spawn(false));
                }
            }
            ctx.lineWidth = .6;
            const L2 = cfg.link * cfg.link;
            for (let i = 0; i < parts.length; i++) {
                const a = parts[i];
                for (let j = i + 1; j < parts.length; j++) {
                    const b = parts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
                    if (d2 < L2) {
                        const al = (1 - Math.sqrt(d2) / cfg.link) * .24;
                        ctx.strokeStyle = (a.red || b.red) ? `rgba(255,76,64,${al})` : `rgba(255,255,255,${al * .65})`;
                        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                    }
                }
                if (m.on) {
                    const dx = a.x - m.x, dy = a.y - m.y, d2 = dx * dx + dy * dy;
                    if (d2 < 24000) {
                        ctx.strokeStyle = `rgba(255,70,58,${(1 - Math.sqrt(d2) / 155) * .5})`;
                        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(m.x, m.y); ctx.stroke();
                    }
                }
            }
            for (const p of parts) {
                const tw = .72 + .28 * Math.sin(p.ph * 3);
                ctx.fillStyle = p.red ? `rgba(255,70,58,${p.a * tw + .12})` : `rgba(255,255,255,${p.a * tw})`;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
            }
        }

        const loop = () => { draw(true); raf = requestAnimationFrame(loop); };
        const start = () => { if (running || reduce) return; running = true; raf = requestAnimationFrame(loop); };
        const stop = () => { running = false; cancelAnimationFrame(raf); };
        const sync = () => (inView && !document.hidden ? start() : stop());

        host.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); m.x = e.clientX - r.left; m.y = e.clientY - r.top; m.on = true; });
        host.addEventListener('pointerleave', () => { m.on = false; });
        new IntersectionObserver(([en]) => { inView = en.isIntersecting; sync(); }, { threshold: 0 }).observe(host);
        document.addEventListener('visibilitychange', sync);
        let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(resize, 120); }).observe(host);
        resize(); sync();
    }

    /* 07 · MARQUESINA (reacciona a la velocidad del scroll) ================ */
    function initStrip() {
        const track = $('#strip-track');
        if (!track) return;
        const list = track.firstElementChild;
        const clone = list.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
        if (!animate) return;

        let x = 0, vel = 0, dir = 1, visible = false;
        new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { rootMargin: '200px' }).observe(track.parentElement);
        ScrollTrigger.create({ onUpdate: self => { vel = Math.abs(self.getVelocity()); if (self.direction) dir = self.direction; } });
        gsap.ticker.add((_, dt) => {
            if (!visible) return;
            vel *= .94;
            const half = track.scrollWidth / 2;
            const speed = 70 + clamp(vel * .09, 0, 520);       // px/s
            x -= speed * dir * (dt / 1000);
            if (x <= -half) x += half;
            if (x > 0) x -= half;
            track.style.transform = `translate3d(${x}px,0,0)`;
        });
    }

    /* 08 · MANIFIESTO (las palabras se encienden con el scroll) ============ */
    function initManifesto() {
        const el = $('#manifesto-text');
        if (!el) return;
        const words = splitWords(el);
        if (!animate) return;
        const cs = getComputedStyle(el);
        const dim = cs.getPropertyValue('--scrub-dim').trim() || 'rgba(247,242,240,.16)';
        const on = cs.getPropertyValue('--scrub-on').trim() || '#F7F2F0';
        const hl = cs.getPropertyValue('--scrub-hl').trim() || '#FF5C50';
        gsap.set(words, { color: dim });
        gsap.to(words, {
            color: (_, w) => (w.closest('.hl') ? hl : on),
            ease: 'none', duration: 3, stagger: 1,
            scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 48%', scrub: .5 }
        });
    }

    /* 09 · ZOOM DEL LENTE (la imagen se abre en pantalla completa) ========= */
    function initIris() {
        const sec = $('#tecnicos');
        if (!sec || !animate) return;
        const pin = $('#iris-pin'), img = $('#iris-img'), ring = $('#iris-ring'), copy = $('#iris-copy');
        const shade = $('.iris__shade'), giant = $('.iris__giant');
        // FACE: centro de la cabeza del técnico dentro de la foto (0 a 1). POS debe coincidir con object-position del CSS.
        const IMG_W = 853, IMG_H = 446, FACE = [.55, .27];
        const st = { p: 0 };
        let vw, vh, cx, cy, r0, rMax, fx, fy, kStart;

        const measure = () => {
            vw = pin.clientWidth; vh = pin.clientHeight;
            const desk = vw >= 1024;
            const POS = desk ? [.15, .4] : [.55, .4];   // espejo del object-position en CSS
            r0 = clamp(Math.min(vw * .43, vh * .3), 128, 196);   // radio inicial del lente
            const ringW = r0 / (.485 * .97);                        // el anillo se dimensiona a ese radio
            ring.style.width = ring.style.height = ringW + 'px';
            ring.style.margin = `${-ringW / 2}px 0 0 ${-ringW / 2}px`;
            cx = vw / 2; cy = vh * (desk ? .5 : .46);
            const s = Math.max(vw / IMG_W, vh / IMG_H);
            const dw = IMG_W * s, dh = IMG_H * s;
            fx = (vw - dw) * POS[0] + FACE[0] * dw;
            fy = (vh - dh) * POS[1] + FACE[1] * dh;
            kStart = 1.08;
            rMax = Math.hypot(Math.max(cx, vw - cx), Math.max(cy, vh - cy)) * 1.03;
            pin.style.setProperty('--cx', cx + 'px');
            pin.style.setProperty('--cy', cy + 'px');
            gsap.set(img, { transformOrigin: `${fx}px ${fy}px` });
        };

        const apply = () => {
            const p = st.p;
            const pe = clamp(p / .8, 0, 1);
            const e = easeIO(pe);
            const r = lerp(r0, rMax, e);
            pin.style.setProperty('--r', r.toFixed(1) + 'px');
            gsap.set(img, { scale: lerp(kStart, 1, e), x: (cx - fx) * (1 - e), y: (cy - fy) * (1 - e) });
            gsap.set(ring, { scale: r / r0, opacity: 1 - smooth(.55, .9, pe) });
            gsap.set(giant, { opacity: 1 - smooth(0, .5, pe), scale: 1 + pe * .25 });
            gsap.set(shade, { opacity: smooth(.5, .85, p) });
            const q = smooth(.78, 1, p);
            gsap.set(copy, { opacity: q, y: (1 - q) * 46 });
        };

        measure(); apply();
        gsap.timeline({
            scrollTrigger: {
                trigger: sec, start: 'top top', end: () => '+=' + Math.round(innerHeight * 1.9),
                pin: true, scrub: .4, anticipatePin: 1, invalidateOnRefresh: true,
                onRefresh: () => { measure(); apply(); }
            }
        }).to(st, { p: 1, duration: 1, ease: 'none', onUpdate: apply });
    }

    /* 10 · PLAGAS: SISTEMA DE OBJETIVOS ==================================== */
    function initTargets() {
        const rows = $$('.trow'), sils = $$('.stage__sil');
        const stage = $('#stage'), lock = $('#stage-lock'), nameEl = $('#stage-name'), stateEl = $('#stage-state');
        if (!rows.length || !stage) return;
        const names = ['Cucarachas', 'Hormigas', 'Chinches', 'Polillas', 'Roedores', 'Moscas', 'Alacranes'];
        let cur = -1, timer = 0;

        const set = i => {
            if (i === cur) return; cur = i;
            rows.forEach((r, j) => r.classList.toggle('is-active', j === i));
            sils.forEach((s, j) => s.classList.toggle('is-on', j === i));
            nameEl.textContent = names[i];
            stage.classList.remove('is-dead');
            stateEl.textContent = 'Detectado';
            lock.classList.remove('is-snap'); void lock.getBoundingClientRect(); lock.classList.add('is-snap');
            clearTimeout(timer);
            timer = setTimeout(() => { stage.classList.add('is-dead'); stateEl.textContent = 'Eliminado'; }, 1000);
        };

        const io = new IntersectionObserver(entries => {
            entries.forEach(en => { if (en.isIntersecting) set(+en.target.dataset.i); });
        }, { rootMargin: '-42% 0px -42% 0px' });
        rows.forEach(r => io.observe(r));
        rows.forEach((r, i) => r.addEventListener('click', e => { if (!e.target.closest('a')) set(i); }));
        set(0);
    }

    /* 11 · TU HOGAR: PLANO INTERACTIVO ===================================== */
    function initHouse() {
        const plan = $('#plan');
        if (!plan) return;
        const PEST = {
            cucarachas: ['Cucarachas', 'p-cucaracha'], hormigas: ['Hormigas', 'p-hormiga'], chinches: ['Chinches', 'p-chinche'],
            polillas: ['Polillas', 'p-polilla'], roedores: ['Roedores', 'p-roedor'], moscas: ['Moscas', 'p-mosca'], alacranes: ['Alacranes', 'p-alacran']
        };
        const ROOMS = {
            cocina: { t: 'Cocina', d: 'Comida, humedad y rincones oscuros: la puerta de entrada favorita de las plagas.', p: ['cucarachas', 'hormigas', 'moscas', 'roedores'], cta: 'Clic aquí y protege mi cocina', msg: 'Hola Fumitex, necesito proteger mi cocina de plagas (cucarachas, hormigas, moscas o roedores).' },
            sala: { t: 'Sala', d: 'Sillones y alfombras son refugio de chinches y polillas, y casi nunca los revisas.', p: ['chinches', 'polillas', 'hormigas'], cta: 'Quiero revisar mi sala', msg: 'Hola Fumitex, quiero que revisen y protejan mi sala de plagas (chinches, polillas u hormigas).' },
            recamara: { t: 'Recámara', d: 'Colchones, burós y ropa de cama son el hábitat ideal de las chinches.', p: ['chinches', 'polillas'], cta: 'Quiero dormir sin chinches', msg: 'Hola Fumitex, quiero eliminar las chinches o polillas de mi recámara.' },
            bano: { t: 'Baño', d: 'Drenajes y humedad atraen cucarachas y moscas durante todo el año.', p: ['cucarachas', 'moscas'], cta: 'Proteger mi baño ahora', msg: 'Hola Fumitex, necesito eliminar cucarachas o moscas de mi baño.' },
            bodega: { t: 'Bodega y closet', d: 'La oscuridad y el desorden esconden roedores, alacranes y polillas.', p: ['roedores', 'alacranes', 'polillas'], cta: 'Quiero revisar mi bodega', msg: 'Hola Fumitex, necesito revisar mi bodega o closet por roedores, alacranes o polillas.' },
            patio: { t: 'Patio y jardín', d: 'Es la primera línea de entrada de alacranes, hormigas y moscas.', p: ['alacranes', 'hormigas', 'moscas'], cta: 'Cuidar mi patio y jardín', msg: 'Hola Fumitex, quiero proteger mi patio y jardín de alacranes, hormigas y moscas.' }
        };
        const panel = $('#rpanel'), title = $('#rp-title'), text = $('#rp-text'), chips = $('#rp-chips'), cta = $('#rp-cta'), ctaT = $('#rp-cta-t');
        const spots = $$('.spot', plan), rects = $$('.room[data-room]', plan);
        const keys = Object.keys(ROOMS);
        let cur = '', touched = false;

        const select = (key, user) => {
            if (!ROOMS[key] || key === cur) { if (user) touched = true; return; }
            if (user) touched = true;
            cur = key;
            const r = ROOMS[key];
            spots.forEach(s => { const on = s.dataset.room === key; s.classList.toggle('is-active', on); s.setAttribute('aria-pressed', String(on)); });
            rects.forEach(s => s.classList.toggle('is-active', s.dataset.room === key));
            title.textContent = r.t; text.textContent = r.d; ctaT.textContent = r.cta; cta.href = waLink(r.msg);
            chips.innerHTML = r.p.map(k => `<li><svg aria-hidden="true"><use href="#${PEST[k][1]}"/></svg>${PEST[k][0]}</li>`).join('');
            $('#rp-art').setAttribute('href', '#' + PEST[r.p[0]][1]);
            panel.classList.remove('is-swap'); void panel.offsetWidth; panel.classList.add('is-swap');
        };

        spots.forEach(s => {
            s.setAttribute('aria-pressed', 'false');
            s.addEventListener('click', () => select(s.dataset.room, true));
            if (finePointer) s.addEventListener('pointerenter', () => select(s.dataset.room, true));
        });
        rects.forEach(r => r.addEventListener('click', () => select(r.dataset.room, true)));
        select('cocina', false);

        // Recorrido automático mientras el plano está en pantalla y nadie lo toca
        let inView = false, idx = 0;
        new IntersectionObserver(([en]) => { inView = en.isIntersecting; }, { threshold: .35 }).observe(plan);
        if (!reduce) setInterval(() => { if (inView && !touched && !document.hidden) { idx = (idx + 1) % keys.length; select(keys[idx], false); } }, 4200);

        // El mobiliario se "dibuja" al entrar
        if (animate) {
            const parts = $$('.plan__furn > *', plan).filter(el => !el.hasAttribute('stroke-dasharray') && el.getTotalLength);
            parts.forEach(el => { const L = el.getTotalLength(); el.style.strokeDasharray = L; el.style.strokeDashoffset = L; });
            gsap.to(parts, {
                strokeDashoffset: 0, duration: 1.6, ease: 'power2.out', stagger: .018,
                onComplete: () => parts.forEach(el => { el.style.strokeDasharray = ''; el.style.strokeDashoffset = ''; }),
                scrollTrigger: { trigger: plan, start: 'top 75%', once: true }
            });
            gsap.from('.room', { opacity: 0, duration: 1.2, stagger: .08, scrollTrigger: { trigger: plan, start: 'top 75%', once: true } });
        }
    }

    /* 12 · MÉTODO (el scroll vertical se vuelve recorrido horizontal) ====== */
    function initProtocol() {
        const pin = $('#protocol-pin');
        if (!pin || !animate) return;
        const track = $('#protocol-track'), fill = $('#protocol-fill');
        const steps = $$('.pstep[data-step]'), nodes = $$('.protocol__node');
        const mm = gsap.matchMedia();

        mm.add('(min-width: 1024px)', () => {
            root.classList.add('pin-x');
            const dist = () => Math.max(0, track.scrollWidth - innerWidth);
            gsap.to(track, {
                x: () => -dist(), ease: 'none',
                scrollTrigger: {
                    trigger: pin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .7,
                    anticipatePin: 1, invalidateOnRefresh: true,
                    onUpdate: self => {
                        const shift = self.progress * dist();
                        gsap.set(fill, { scaleX: self.progress });
                        steps.forEach((s, i) => {
                            const on = s.offsetLeft - shift < innerWidth * .6;
                            s.classList.toggle('is-on', on);
                            nodes[i] && nodes[i].classList.toggle('is-on', on);
                        });
                    }
                }
            });
            return () => root.classList.remove('pin-x');
        });

        // Móvil / tablet: tarjetas que entran una a una
        mm.add('(max-width: 1023px)', () => {
            gsap.from('.pstep', {
                opacity: 0, y: 40, duration: 1, ease: 'expo.out', stagger: .12, clearProps: 'opacity,transform',
                scrollTrigger: { trigger: track, start: 'top 82%', once: true }
            });
        });
    }

    /* 13 · SEGURIDAD (bento) =============================================== */
    function initBento() {
        $$('.cell').forEach(c => {
            c.addEventListener('pointermove', e => {
                const r = c.getBoundingClientRect();
                c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                c.style.setProperty('--my', (e.clientY - r.top) + 'px');
            });
        });
        const fam = $('.cell--family');
        if (!fam) return;
        if (!animate) { fam.classList.add('is-in'); return; }
        ScrollTrigger.create({ trigger: fam, start: 'top 75%', once: true, onEnter: () => fam.classList.add('is-in') });
    }

    /* 14 · REVELADOS GENÉRICOS ============================================= */
    function initReveals() {
        if (!animate) return;
        $$('[data-split]:not(.hero__line)').forEach(el => {
            const words = splitWords(el);
            gsap.set(words, { yPercent: 115 });
            gsap.to(words, {
                yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: .055,
                scrollTrigger: { trigger: el, start: 'top 88%', once: true }
            });
        });
        ScrollTrigger.batch('[data-reveal]', {
            start: 'top 90%', once: true,
            onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1.15, ease: 'expo.out', stagger: .09, overwrite: true, clearProps: 'transform' })
        });
    }

    /* 15 · FAQ ============================================================= */
    function initFaq() {
        const items = $$('.acc__item');
        const setOpen = (item, open) => {
            item.classList.toggle('is-open', open);
            $('.acc__q', item).setAttribute('aria-expanded', String(open));
        };
        items.forEach(item => {
            $('.acc__q', item).addEventListener('click', () => {
                const willOpen = !item.classList.contains('is-open');
                items.forEach(o => setOpen(o, false));
                setOpen(item, willOpen);
                if (hasGSAP) setTimeout(() => ScrollTrigger.refresh(), 700);
            });
        });
        if (items[0]) setOpen(items[0], true);
    }

    /* 16 · GARANTÍA + CONTADORES =========================================== */
    function initGuarantee() {
        const sec = $('.guarantee');
        if (!sec) return;
        const counters = $$('[data-count]');
        if (!animate) return;

        counters.forEach(el => {
            const target = +el.dataset.count;
            el.textContent = '0';
            const o = { v: 0 };
            ScrollTrigger.create({
                trigger: el, start: 'top 92%', once: true,
                onEnter: () => gsap.to(o, { v: target, duration: 2.2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); } })
            });
        });

        // El bloque rojo se abre como una tarjeta que se expande al ancho completo
        gsap.fromTo(sec, { clipPath: 'inset(7% 4% 7% 4% round 38px)' }, {
            clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
            scrollTrigger: { trigger: sec, start: 'top 96%', end: 'top 18%', scrub: true }
        });
        gsap.fromTo('.seal', { scale: .74, rotation: -24 }, {
            scale: 1, rotation: 0, ease: 'none',
            scrollTrigger: { trigger: '.guarantee__layout', start: 'top 92%', end: 'top 34%', scrub: true }
        });
        gsap.to('.guarantee__bg', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
    }

    /* 17 · FOOTER ========================================================== */
    function initFooter() {
        const g = $('#footer-giant');
        if (!g || !animate) return;
        g.innerHTML = Array.from(g.textContent).map(c => `<span class="ch">${c}</span>`).join('');
        const chars = $$('.ch', g);
        gsap.from(chars, { yPercent: 70, opacity: 0, duration: 1.4, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: g, start: 'top 95%', once: true } });
        gsap.to(chars, {
            color: '#E50F0B', webkitTextStrokeColor: '#E50F0B', ease: 'none', duration: 3, stagger: 1,
            scrollTrigger: { trigger: g, start: 'top 98%', end: 'bottom 62%', scrub: .6 }
        });
    }

    /* 18 · FORMULARIO → WHATSAPP =========================================== */
    function initForm() {
        const form = $('#wa-form');
        if (!form) return;
        const rules = [
            { id: 'f-name', err: 'e-name', msg: 'Escribe tu nombre para saber cómo llamarte.', ok: v => v.trim().length >= 2 },
            { id: 'f-pest', err: 'e-pest', msg: 'Elige qué plaga tienes.', ok: v => !!v },
            { id: 'f-place', err: 'e-place', msg: 'Dinos dónde está el problema.', ok: v => !!v }
        ];
        const show = (r, bad) => {
            const input = document.getElementById(r.id), err = document.getElementById(r.err);
            err.textContent = bad ? r.msg : '';
            input.setAttribute('aria-invalid', String(bad));
            input.closest('.field').classList.toggle('has-error', bad);
        };
        rules.forEach(r => {
            const input = document.getElementById(r.id);
            input.addEventListener('input', () => { if (r.ok(input.value)) show(r, false); });
            input.addEventListener('change', () => { if (r.ok(input.value)) show(r, false); });
        });

        form.addEventListener('submit', e => {
            e.preventDefault();
            let firstBad = null;
            rules.forEach(r => {
                const input = document.getElementById(r.id);
                const bad = !r.ok(input.value);
                show(r, bad);
                if (bad && !firstBad) firstBad = input;
            });
            if (firstBad) { firstBad.focus(); return; }

            const name = $('#f-name').value.trim(), pest = $('#f-pest').value, place = $('#f-place').value, extra = $('#f-msg').value.trim();
            const msg = [`Hola Fumitex, soy ${name}.`, `Plaga: ${pest}`, `Lugar: ${place}`, extra ? `Detalle: ${extra}` : '', 'Quiero mi cotización y agendar el servicio.'].filter(Boolean).join('\n');
            const url = waLink(msg);
            $('#f-ok').hidden = false;
            const w = window.open(url, '_blank', 'noopener');
            if (!w) location.href = url;
        });
    }

    /* 19 · WHATSAPP FLOTANTE =============================================== */
    function initFloat() {
        const wa = $('#wa-float');
        if (!wa) return;
        setTimeout(() => wa.classList.add('is-visible'), 1200);
        let seen = false;
        try { seen = sessionStorage.getItem('fx-tip') === '1'; } catch (_) { /* privado */ }
        if (!seen) {
            setTimeout(() => wa.classList.add('show-tip'), 5200);
            setTimeout(() => { wa.classList.remove('show-tip'); try { sessionStorage.setItem('fx-tip', '1'); } catch (_) { /* nada */ } }, 11500);
        }
    }

    /* 20 · BOTONES (relleno direccional + efecto imán) ===================== */
    function initButtons() {
        if (!finePointer) return;
        const setPos = (btn, e) => {
            const r = btn.getBoundingClientRect();
            btn.style.setProperty('--bx', (e.clientX - r.left) + 'px');
            btn.style.setProperty('--by', (e.clientY - r.top) + 'px');
        };
        $$('.btn').forEach(b => { b.addEventListener('pointerenter', e => setPos(b, e)); b.addEventListener('pointerleave', e => setPos(b, e)); });

        if (!animate) return;
        $$('[data-magnetic]').forEach(b => {
            const qx = gsap.quickTo(b, 'x', { duration: .5, ease: 'power3' });
            const qy = gsap.quickTo(b, 'y', { duration: .5, ease: 'power3' });
            b.addEventListener('pointermove', e => {
                const r = b.getBoundingClientRect();
                qx((e.clientX - (r.left + r.width / 2)) * .22);
                qy((e.clientY - (r.top + r.height / 2)) * .32);
            });
            b.addEventListener('pointerleave', () => { qx(0); qy(0); });
        });
    }

    /* 20b · GALERÍA DE TRABAJOS ============================================ */
    function initWork() {
        const grid = $('#gallery');
        if (!grid) return;
        const shots = $$('.shot', grid);

        // Entrada escalonada (la mira se cierra sobre cada foto) + paralaje suave dentro de cada marco
        if (animate) {
            gsap.set(shots, { opacity: 0, y: 56 });
            ScrollTrigger.batch(shots, {
                start: 'top 92%', once: true,
                onEnter: els => {
                    els.forEach(el => el.classList.add('is-in'));
                    gsap.to(els, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: .09, overwrite: true, clearProps: 'transform' });
                }
            });
            shots.forEach(s => {
                gsap.fromTo($('img', s), { yPercent: -4.5 }, {
                    yPercent: 4.5, ease: 'none',
                    scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true }
                });
            });
        }

        // Visor. Sin <dialog> (o sin JS) cada foto simplemente abre su imagen grande.
        const lb = $('#lb');
        if (!lb || typeof lb.showModal !== 'function') return;
        const img = $('#lb-img'), stage = $('#lb-stage');
        const nEl = $('#lb-n'), tagEl = $('#lb-tag'), titleEl = $('#lb-title');
        const items = shots.map(s => {
            const link = $('.shot__link', s);
            return { link, href: link.getAttribute('href'), alt: $('img', s).alt, tag: $('.shot__tag', s).textContent, title: $('.shot__title', s).textContent };
        });
        const total = items.length;
        const pad = n => String(n).padStart(2, '0');
        let cur = 0;
        $('#lb-total').textContent = pad(total);

        const show = i => {
            cur = (i + total) % total;
            const it = items[cur], mine = cur;
            nEl.textContent = pad(cur + 1);
            tagEl.textContent = it.tag;
            titleEl.textContent = it.title;
            const fade = img.classList.contains('is-in') ? 180 : 0;   // deja salir la foto anterior
            img.classList.remove('is-in');
            const next = new Image();
            next.src = it.href;
            const ready = next.decode ? next.decode().catch(() => {}) : Promise.resolve();
            Promise.all([ready, new Promise(r => setTimeout(r, fade))]).then(() => {
                if (mine !== cur) return;
                img.src = it.href; img.alt = it.alt;
                img.classList.add('is-in');
            });
            [cur + 1, cur - 1].forEach(j => { new Image().src = items[(j + total) % total].href; });   // precarga vecinas
        };

        // El bloqueo de scroll se libera desde "cancel" (Esc / atrás), "close" y los botones: cualquiera que llegue primero
        let locked = false;
        const lock = () => {
            if (locked) return;
            locked = true;
            lenis ? lenis.stop() : (root.style.overflow = 'hidden');
        };
        const unlock = () => {
            if (!locked) return;
            locked = false;
            img.classList.remove('is-in');
            if (!menuOpen) lenis ? lenis.start() : (root.style.overflow = '');
        };
        const closeLb = () => { unlock(); if (lb.open) lb.close(); };
        const open = i => {
            if (!lb.open) { lb.showModal(); lock(); }
            show(i);
        };
        lb.addEventListener('cancel', unlock);
        lb.addEventListener('close', () => { if (!lb.open) unlock(); });   // un "close" tardío no debe soltar un visor ya reabierto

        items.forEach((it, i) => it.link.addEventListener('click', e => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;   // abrir en pestaña nueva sigue funcionando
            e.preventDefault();
            open(i);
        }));
        $('#lb-close').addEventListener('click', closeLb);
        $('#lb-prev').addEventListener('click', () => show(cur - 1));
        $('#lb-next').addEventListener('click', () => show(cur + 1));
        lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
        lb.addEventListener('keydown', e => {
            if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
        });

        // Deslizar con el dedo para cambiar de foto
        let sx = 0, sy = 0, tracking = false;
        stage.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; sx = e.clientX; sy = e.clientY; tracking = true; });
        stage.addEventListener('pointercancel', () => { tracking = false; });
        stage.addEventListener('pointerup', e => {
            if (!tracking) return;
            tracking = false;
            const dx = e.clientX - sx, dy = e.clientY - sy;
            if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) show(cur + (dx < 0 ? 1 : -1));
        });
    }

    /* 20c · MAPA (bloqueado hasta tocarlo: así no atrapa el scroll de la página) */
    function initMap() {
        const frame = $('#map-frame');
        if (!frame) return;
        const set = on => frame.classList.toggle('is-active', on);
        frame.addEventListener('click', () => set(true));
        frame.addEventListener('focusin', () => set(true));
        frame.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') set(false); });
        document.addEventListener('pointerdown', e => { if (!frame.contains(e.target)) set(false); });
    }

    /* 21 · ARRANQUE ======================================================== */
    root.classList.add('is-loading');
    safe('scroll', initScroll);
    safe('nav', initNav);
    safe('prepHero', prepHero);
    safe('fields', () => {
        const hc = $('#hero-canvas'); if (hc) createField(hc, {});
        const cc = $('#contact-canvas'); if (cc) createField(cc, { density: 22000, max: 60, red: .5 });
    });
    safe('heroMotion', initHeroMotion);
    safe('strip', initStrip);
    safe('manifesto', initManifesto);
    safe('iris', initIris);
    safe('targets', initTargets);
    safe('house', initHouse);
    safe('protocol', initProtocol);
    safe('bento', initBento);
    safe('guarantee', initGuarantee);
    safe('work', initWork);
    safe('faq', initFaq);
    safe('footer', initFooter);
    safe('reveals', initReveals);
    safe('form', initForm);
    safe('map', initMap);
    safe('buttons', initButtons);

    // Recalcular pines y disparadores cuando fuentes e imágenes ya midieron
    const refresh = () => { if (hasGSAP) ScrollTrigger.refresh(); };
    addEventListener('load', () => setTimeout(refresh, 250));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(refresh, 100));

    runLoader(() => { safe('heroIntro', heroIntro); safe('float', initFloat); refresh(); });
})();
