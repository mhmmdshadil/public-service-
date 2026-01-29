/**
 * SSL | SILENT SIGNALS LAYER
 * Core Interpretation Engine & Human-Centric UI Controller
 */

class SSLEngine {
    constructor() {
        this.score = 0;
        this.isPanicActive = false;
        this.signals = [
            { id: 'micro-expressions', name: 'Micro-Expressions', value: 5, weight: 0.35, color: 'var(--accent-teal)' },
            { id: 'body-movement', name: 'Body Micro-Behavior', value: 5, weight: 0.25, color: 'var(--accent-amber)' },
            { id: 'eye-indicators', name: 'Eye & Gaze Tracking', value: 8, weight: 0.15, color: 'var(--accent-blue)' },
            { id: 'vocal-rhythm', name: 'Vocal Micro-Sounds', value: 3, weight: 0.25, color: 'var(--accent-rose)' }
        ];
    }

    updateScore() {
        const weightedSum = this.signals.reduce((acc, sig) => acc + (sig.value * sig.weight), 0);
        this.score = Math.min(100, Math.round(weightedSum));
        return this.score;
    }

    getStatus() {
        if (this.score < 25) return { text: 'System Calm', color: 'var(--accent-teal)' };
        if (this.score < 55) return { text: 'Anomaly Detected', color: 'var(--accent-amber)' };
        if (this.score < 85) return { text: 'Probable Distress', color: 'var(--accent-rose)' };
        return { text: 'Immediate Risk', color: 'var(--accent-rose)' };
    }

    boostSignal(id, amount) {
        const signal = this.signals.find(s => s.id === id);
        if (signal) {
            signal.value = Math.min(100, signal.value + amount);
        }
    }

    reset() {
        this.signals.forEach(s => s.value = 5 + Math.random() * 5);
        this.isPanicActive = false;
        this.updateScore();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const engine = new SSLEngine();

    // UI Elements
    const statusEl = document.getElementById('distress-status');
    const scoreEl = document.getElementById('distress-score');
    const meterFill = document.getElementById('distress-meter-fill');
    const monitorsContainer = document.getElementById('signal-monitors');

    // Initialize Monitors
    const renderMonitors = () => {
        monitorsContainer.innerHTML = engine.signals.map(sig => `
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
        <span style="color: var(--text-secondary);">${sig.name}</span>
        <div style="width: 100px; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; margin: 0 1rem; position: relative;">
          <div style="position: absolute; left: 0; top: 0; height: 100%; width: ${sig.value}%; background: ${sig.color}; transition: width 0.8s ease;"></div>
        </div>
        <span style="font-family: monospace; color: var(--text-muted); width: 25px; text-align: right;">${Math.round(sig.value)}%</span>
      </div>
    `).join('');
    };

    const updateUI = () => {
        const score = engine.updateScore();
        const status = engine.getStatus();

        scoreEl.textContent = score;
        statusEl.textContent = status.text.toUpperCase();
        statusEl.style.color = status.color;
        meterFill.style.width = `${score}%`;
        meterFill.style.background = status.color;

        renderMonitors();
    };

    // Button Listeners
    document.getElementById('btn-trigger-panic').addEventListener('click', () => {
        engine.isPanicActive = true;
        engine.boostSignal('micro-expressions', 40 + Math.random() * 20);
        engine.boostSignal('body-movement', 35 + Math.random() * 15);
        engine.boostSignal('vocal-rhythm', 30 + Math.random() * 20);
        updateUI();
    });

    document.getElementById('btn-reset-demo').addEventListener('click', () => {
        engine.reset();
        updateUI();
    });

    document.getElementById('btn-nics-dashboard').addEventListener('click', () => {
        alert('Connecting to NICS National Dashboard... [SSL Overlays Active]');
    });

    document.getElementById('btn-explore-engine').addEventListener('click', () => {
        document.getElementById('demo').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('btn-read-ethics').addEventListener('click', () => {
        document.getElementById('ethics').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('btn-view-whitepaper').addEventListener('click', () => {
        alert('Downloading SSL Ethics v2.4 (Geometry-Based Detection Standards)...');
    });

    // Reveal Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Natural Drift (Observational Pulse)
    setInterval(() => {
        if (!engine.isPanicActive) {
            engine.signals.forEach(s => {
                s.value = Math.max(2, Math.min(15, s.value + (Math.random() * 2 - 1)));
            });
            updateUI();
        }
    }, 2000);

    // Initial Boot
    engine.reset();
    updateUI();
});
