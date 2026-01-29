/**
 * SSL | Silent Signals Layer
 * Core Logic & Interpretation Engine
 */

class SSLInterpretationEngine {
    constructor() {
        this.baseScore = 0;
        this.signals = {
            microExpressions: 0,
            bodyMicroBehavior: 0,
            vocalMicroSounds: 0,
            vulnerabilityContext: 1.0 // Multiplier
        };
        this.history = [];
        this.status = 'Calm';
    }

    updateSignal(type, intensity) {
        if (this.signals.hasOwnProperty(type)) {
            this.signals[type] = intensity;
            this.calculateScore();
        }
    }

    calculateScore() {
        const total = (
            (this.signals.microExpressions * 0.4) +
            (this.signals.bodyMicroBehavior * 0.3) +
            (this.signals.vocalMicroSounds * 0.3)
        ) * this.signals.vulnerabilityContext;

        this.baseScore = Math.min(100, Math.round(total));
        this.updateStatus();
    }

    updateStatus() {
        if (this.baseScore < 30) this.status = 'Calm';
        else if (this.baseScore < 60) this.status = 'Anomaly';
        else if (this.baseScore < 85) this.status = 'Probable Distress';
        else this.status = 'Immediate Risk';
    }

    getScore() { return this.baseScore; }
    getStatus() { return this.status; }
}

class DistressMeter {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.score = 0;
        this.init();
    }

    init() {
        this.container.innerHTML = `
            <div class="meter-track" style="height: 12px; background: var(--bg-tertiary); border-radius: 6px; position: relative; overflow: hidden;">
                <div id="meter-fill" style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; background: var(--accent-teal); transition: width 1s ease-out, background 0.5s ease;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 1rem; font-size: 0.8rem; color: var(--text-muted);">
                <span>BASELINE</span>
                <span>MAX RISK</span>
            </div>
        `;
        this.fill = document.getElementById('meter-fill');
    }

    update(score) {
        this.score = score;
        this.fill.style.width = `${score}%`;
        if (score < 30) this.fill.style.background = 'var(--accent-teal)';
        else if (score < 60) this.fill.style.background = 'var(--accent-amber)';
        else this.fill.style.background = 'var(--accent-red)';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const engine = new SSLInterpretationEngine();
    const meter = new DistressMeter('distress-meter-container');
    const statusEl = document.getElementById('distress-status');
    const metaEl = document.getElementById('distress-meta');

    // Map Logic
    const canvas = document.getElementById('nics-map');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const resize = () => {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const anomalies = [
            { x: 0.3, y: 0.4, size: 0, targetSize: 40, color: 'rgba(246, 173, 85, 0.4)' },
            { x: 0.7, y: 0.6, size: 0, targetSize: 60, color: 'rgba(245, 101, 101, 0.3)' }
        ];

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            for (let i = 0; i < canvas.width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
            for (let i = 0; i < canvas.height; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }
            anomalies.forEach(a => {
                a.size += 0.5; if (a.size > a.targetSize) a.size = 0;
                ctx.beginPath(); ctx.arc(a.x * canvas.width, a.y * canvas.height, a.size, 0, Math.PI * 2);
                ctx.fillStyle = a.color; ctx.fill();
            });
            requestAnimationFrame(draw);
        };
        draw();
    }

    // Demo Overlay
    const demoOverlay = document.getElementById('demo-overlay');
    if (demoOverlay) {
        const mockBoxes = [
            { label: 'FREEZE DETECTED', color: 'var(--accent-amber)', top: '20%', left: '30%', width: '15%', height: '25%' },
            { label: 'RAPID BLINKING', color: 'var(--accent-teal)', top: '45%', left: '55%', width: '10%', height: '15%' }
        ];
        mockBoxes.forEach(box => {
            const el = document.createElement('div');
            el.style.cssText = `position: absolute; top: ${box.top}; left: ${box.left}; width: ${box.width}; height: ${box.height}; border: 1.5px solid ${box.color}; box-shadow: 0 0 10px ${box.color}; transition: all 0.5s ease;`;
            el.innerHTML = `<span style="position: absolute; top: -1.2rem; left: 0; font-size: 0.6rem; color: ${box.color}; white-space: nowrap; font-weight: 600;">${box.label}</span>`;
            demoOverlay.appendChild(el);
            setInterval(() => { el.style.opacity = Math.random() > 0.1 ? '1' : '0.3'; }, 1000);
        });
    }

    // Simulation
    let tick = 0;
    const loop = () => {
        tick++;
        if (tick < 5) engine.updateSignal('microExpressions', Math.random() * 20);
        else if (tick < 10) { engine.updateSignal('microExpressions', 50); engine.updateSignal('bodyMicroBehavior', 40); }
        else if (tick < 15) { engine.updateSignal('microExpressions', 85); engine.updateSignal('bodyMicroBehavior', 75); engine.updateSignal('vocalMicroSounds', 70); }
        else { tick = 0; engine.updateSignal('microExpressions', 0); engine.updateSignal('bodyMicroBehavior', 0); engine.updateSignal('vocalMicroSounds', 0); }

        const score = engine.getScore();
        meter.update(score);
        statusEl.textContent = engine.getStatus().toUpperCase();
        statusEl.style.color = score < 30 ? 'var(--accent-teal)' : (score < 60 ? 'var(--accent-amber)' : 'var(--accent-red)');
        metaEl.textContent = `Confidence: ${score}% | ${score > 30 ? 'Multi-signal Correlation' : 'Stable Monitoring'}`;
        setTimeout(loop, 2000);
    };
    loop();
});
