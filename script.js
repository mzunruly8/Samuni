const canvas = document.getElementById('gameplay-screen');
const ctx = canvas.getContext('2d');

const stats = { dmg: 0, nrg: 0, coins: 0, growth: 0, core: 0 };

function updateUI() {
    document.getElementById('val-dmg').textContent = stats.dmg;
    document.getElementById('val-nrg').textContent = stats.nrg;
    document.getElementById('val-coins').textContent = stats.coins;
    document.getElementById('val-core').textContent = stats.core;
}

let orbs = [];
let activeLink = [];
let isLinking = false;
let mousePos = { x: 0, y: 0 };

const COLORS = {
    red: '#ff4d4d',
    blue: '#4d94ff',
    yellow: '#ffff4d',
    green: '#4dff88',
    purple: '#cc4dff',
    filler: '#444444'
};

const TYPES = ['red', 'blue', 'yellow', 'green', 'purple', 'filler'];

class Orb {
    constructor() {
        this.radius = 28;
        this.init();
    }

    init() {
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = Math.random() * (canvas.height - this.radius * 2) + this.radius;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.type = TYPES[Math.floor(Math.random() * TYPES.length)];
        this.color = COLORS[this.type];
        this.fading = false;
        this.opacity = 1;
        this.scale = 1;
    }

    update() {
        if (this.fading) {
            this.opacity -= 0.1;
            this.scale -= 0.05;
            if (this.opacity <= 0) this.init();
            return;
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) this.vx *= -1;
        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) this.vy *= -1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);

        if (activeLink.includes(this)) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'white';
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 2, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.restore();
    }

    isHit(x, y) {
        const dist = Math.hypot(x - this.x, y - this.y);
        return dist < this.radius + 20;
    }
}

function startLink(x, y) {
    const orb = orbs.find(o => o.isHit(x, y) && !o.fading);
    if (orb) {
        isLinking = true;
        activeLink = [orb];
    }
}

function extendLink(x, y) {
    if (!isLinking) return;

    const orb = orbs.find(o => o.isHit(x, y) && !o.fading);

    if (orb && !activeLink.includes(orb) && orb.type === activeLink[0].type) {
        activeLink.push(orb);
    }
}

function endLink() {
    if (!isLinking) return;

    if (activeLink.length >= 3) {
        resolveMatch();
    }

    isLinking = false;
    activeLink = [];
}

function resolveMatch() {
    const count = activeLink.length;
    const type = activeLink[0].type;

    activeLink.forEach(o => o.fading = true);

    switch (type) {
        case 'red': stats.dmg += count * 10; break;
        case 'blue': stats.nrg += count * 5; break;
        case 'yellow': stats.coins += count; break;
        case 'green': stats.growth += count; break;
        case 'purple': stats.core = Math.min(100, stats.core + count); break;
    }

    updateUI();
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

for (let i = 0; i < 22; i++) {
    orbs.push(new Orb());
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isLinking && activeLink.length > 0) {
        ctx.beginPath();
        ctx.lineWidth = 8;
        ctx.strokeStyle = COLORS[activeLink[0].type];
        ctx.moveTo(activeLink[0].x, activeLink[0].y);
        for (let i = 1; i < activeLink.length; i++) {
            ctx.lineTo(activeLink[i].x, activeLink[i].y);
        }
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
    }

    orbs.forEach(o => {
        o.update();
        o.draw();
    });

    requestAnimationFrame(gameLoop);
}

gameLoop();

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
}

canvas.addEventListener('mousedown', (e) => {
    const pos = getPos(e);
    startLink(pos.x, pos.y);
});

canvas.addEventListener('mousemove', (e) => {
    const pos = getPos(e);
    mousePos = pos;
    extendLink(pos.x, pos.y);
});

window.addEventListener('mouseup', endLink);

canvas.addEventListener('touchstart', (e) => {
    const pos = getPos(e);
    startLink(pos.x, pos.y);
});

canvas.addEventListener('touchmove', (e) => {
    const pos = getPos(e);
    mousePos = pos;
    extendLink(pos.x, pos.y);
    e.preventDefault();
}, { passive: false });

window.addEventListener('touchend', endLink);