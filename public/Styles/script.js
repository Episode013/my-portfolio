// ---------- Cursor-following spotlight ----------
const spotlight = document.getElementById('spotlight');
const hero = document.querySelector('.hero');

if (spotlight && hero) {
    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        spotlight.style.left = `${x}px`;
        spotlight.style.top = `${y}px`;
        spotlight.style.opacity = '1';
    });

    hero.addEventListener('mouseleave', () => {
        spotlight.style.opacity = '0';
    });
}

// ---------- Interactive network background ----------
const canvas = document.getElementById('bg-canvas');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    const GOLD = '212, 175, 55';

    let width, height, nodes;
    let mouse = { x: null, y: null };
    const LINK_DIST = 140;      // max distance to draw a line between two nodes
    const MOUSE_DIST = 180;     // radius within which the cursor connects/repels nodes

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        const area = width * height;
        const count = Math.min(120, Math.max(45, Math.round(area / 11000)));
        nodes = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            r: 1.6 + Math.random() * 1.6
        }));
    }

    function step() {
        ctx.clearRect(0, 0, width, height);

        // move + draw nodes
        for (const n of nodes) {
            n.x += n.vx;
            n.y += n.vy;

            if (n.x < 0 || n.x > width) n.vx *= -1;
            if (n.y < 0 || n.y > height) n.vy *= -1;

            // gentle repel from cursor for a living, reactive feel
            if (mouse.x !== null) {
                const dx = n.x - mouse.x;
                const dy = n.y - mouse.y;
                const dist = Math.hypot(dx, dy);
                if (dist < MOUSE_DIST) {
                    const force = (MOUSE_DIST - dist) / MOUSE_DIST;
                    n.x += (dx / dist) * force * 1.2;
                    n.y += (dy / dist) * force * 1.2;
                }
            }

            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${GOLD}, 0.85)`;
            ctx.shadowColor = `rgba(${GOLD}, 0.9)`;
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // node-to-node connections
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.hypot(dx, dy);
                if (dist < LINK_DIST) {
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = `rgba(${GOLD}, ${0.28 * (1 - dist / LINK_DIST)})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        // brighter connections from cursor to nearby nodes
        if (mouse.x !== null) {
            for (const n of nodes) {
                const dx = n.x - mouse.x;
                const dy = n.y - mouse.y;
                const dist = Math.hypot(dx, dy);
                if (dist < MOUSE_DIST) {
                    ctx.beginPath();
                    ctx.moveTo(mouse.x, mouse.y);
                    ctx.lineTo(n.x, n.y);
                    ctx.strokeStyle = `rgba(${GOLD}, ${0.5 * (1 - dist / MOUSE_DIST)})`;
                    ctx.lineWidth = 1.2;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(step);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    resize();
    requestAnimationFrame(step);
}

// ---------- Magnetic buttons ----------
const magneticButtons = document.querySelectorAll('.btn-primary, .btn-outline');

magneticButtons.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.3}px)`;
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
    });
});

// ---------- Custom cursor ----------
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');
const isFinePointer = window.matchMedia('(pointer: fine)').matches;

if (cursorDot && cursorRing && isFinePointer && !prefersReducedMotion) {
    document.documentElement.classList.add('custom-cursor-active');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorDot.style.left = `${mouseX}px`;
        cursorDot.style.top = `${mouseY}px`;
    });

    function animateRing() {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        cursorRing.style.left = `${ringX}px`;
        cursorRing.style.top = `${ringY}px`;
        requestAnimationFrame(animateRing);
    }
    animateRing();

    const attachHoverState = () => {
        document.querySelectorAll('a, button, summary, .project-card').forEach((el) => {
            el.addEventListener('mouseenter', () => cursorRing.classList.add('hovering'));
            el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovering'));
        });
    };
    attachHoverState();
}

// ---------- Scroll-triggered reveal ----------
const revealEls = document.querySelectorAll('.reveal');

if (revealEls.length && 'IntersectionObserver' in window) {
    // stagger project cards so they don't all pop in at once
    document.querySelectorAll('.project-grid .reveal').forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.12}s`;
    });

    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
} else {
    revealEls.forEach((el) => el.classList.add('active'));
}

// ---------- Navbar scroll effect ----------
const navbar = document.querySelector('.navbar');

if (navbar) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}