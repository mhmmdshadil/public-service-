/**
 * Care-Aid | Real-Time Audio Intelligence
 * Powered by Hugging Face Transformers.js (Xenova/ast-finetuned-audioset)
 */

import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js to use local wasm if available, or CDN
env.allowLocalModels = false; // Force CDN for this demo to ensure model loads without local file issues

class AudioIntelligenceEngine {
    constructor() {
        this.classifier = null;
        this.isLoaded = false;
        this.isListening = false;
        this.audioContext = null;
        this.stream = null;
        this.processor = null;

        // Safety Thresholds
        this.confidence = 0;
        this.metrics = {
            vocal: 0,   // Scream, Crying, Gasp
            impulse: 0, // Gunshot, Explosion, Glass
            env: 0      // Siren, Alarm
        };
    }

    async init() {
        try {
            console.log('Loading AST Model...');
            // Using a smaller, faster model if possible, or the standard AST
            this.classifier = await pipeline('audio-classification', 'Xenova/ast-finetuned-audioset-10-10-0.4593');
            this.isLoaded = true;
            console.log('Model Loaded!');
            return true;
        } catch (e) {
            console.error('Model Loading Failed:', e);
            return false;
        }
    }

    async startListening(onResult) {
        if (!this.isLoaded) await this.init();

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = this.audioContext.createMediaStreamSource(this.stream);

        // Create a script processor to capture raw audio
        // Note: AudioWorklet is better for perf, but ScriptProcessor is easier for single-file demo
        this.processor = this.audioContext.createScriptProcessor(16384, 1, 1);

        source.connect(this.processor);
        this.processor.connect(this.audioContext.destination);

        let buffer = [];

        this.processor.onaudioprocess = async (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            buffer.push(...inputData);

            // Process every ~1 second of audio (16000 samples)
            if (buffer.length >= 16000) {
                const chunk = buffer.slice(0, 16000);
                buffer = buffer.slice(16000); // Overlay sliding window? No, simple chunking for demo speed

                await this.classify(chunk, onResult);
            }
        };

        this.isListening = true;
    }

    async classify(audioData, callback) {
        if (!this.classifier) return;

        // Run inference
        const results = await this.classifier(audioData);

        // Map top results to our categories
        // AudioSet labels are diverse. We need to normalize.
        let vocalScore = 0;
        let impulseScore = 0;
        let envScore = 0;

        results.forEach(({ label, score }) => {
            const l = label.toLowerCase();

            // Vocal Distress
            if (l.includes('scream') || l.includes('crying') || l.includes('gasp') || l.includes('wail') || l.includes('pant')) {
                vocalScore = Math.max(vocalScore, score);
            }

            // Impulse Events
            if (l.includes('gunshot') || l.includes('explosion') || l.includes('glass') || l.includes('bang') || l.includes('smash')) {
                impulseScore = Math.max(impulseScore, score);
            }

            // Environmental Alerts
            if (l.includes('siren') || l.includes('alarm') || l.includes('bell') || l.includes('horn')) {
                envScore = Math.max(envScore, score);
            }
        });

        // Decay logic handled by UI, here we just output raw confidence peaks
        this.metrics = {
            vocal: vocalScore * 100,
            impulse: impulseScore * 100,
            env: envScore * 100
        };

        // Calculate overall threat confidence
        // Impulse events are highest threat, Vocal second
        this.confidence = Math.max(this.metrics.impulse, this.metrics.vocal * 0.8, this.metrics.env * 0.6);

        callback({
            confidence: this.confidence,
            metrics: this.metrics,
            topLabel: results[0].label
        });
    }

    stop() {
        if (this.stream) this.stream.getTracks().forEach(t => t.stop());
        if (this.audioContext) this.audioContext.close();
        this.isListening = false;
    }
}

// Visualization Logic (Spectrogram Proxy)
class AudioVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.history = [];
    }

    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = 300;
    }

    update(confidence) {
        this.history.push(confidence);
        if (this.history.length > this.canvas.width) this.history.shift();
        this.render();
    }

    render() {
        this.ctx.fillStyle = 'rgba(15, 18, 22, 1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height / 2);
        this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
        this.ctx.stroke();

        // Waveform-ish line based on confidence history
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'var(--text-primary)';
        this.ctx.lineWidth = 2;

        for (let i = 0; i < this.history.length; i++) {
            const x = i;
            // Map 0-100 to y position (inverted)
            // Enhanced jitter for active look
            const val = this.history[i];
            const jitter = val > 5 ? (Math.random() - 0.5) * val * 0.5 : 0;
            const y = this.canvas.height - ((val / 100) * this.canvas.height * 0.8) - 10 + jitter;

            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();

        // Gradient under fill
        this.ctx.lineTo(this.history.length, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, 'rgba(190, 18, 60, 0.2)'); // Alert Red
        grad.addColorStop(1, 'rgba(190, 18, 60, 0)');
        this.ctx.fillStyle = grad;
        this.ctx.fill();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const engine = new AudioIntelligenceEngine();
    const viz = new AudioVisualizer('obs-grid');

    const ui = {
        btn: document.getElementById('btn-init-audio'),
        status: document.getElementById('model-status'),
        mainStatus: document.getElementById('status-indicator'),
        confidence: document.getElementById('main-confidence-display'),
        bars: {
            vocal: document.getElementById('bar-vocal'),
            impulse: document.getElementById('bar-impulse'),
            env: document.getElementById('bar-env')
        },
        vals: {
            vocal: document.getElementById('val-vocal'),
            impulse: document.getElementById('val-impulse'),
            env: document.getElementById('val-env')
        }
    };

    ui.btn.addEventListener('click', async () => {
        ui.btn.disabled = true;
        ui.btn.innerText = "Initializing Hardware...";
        ui.status.style.display = 'flex';

        const success = await engine.init();
        if (success) {
            ui.status.innerHTML = `<span style="color: #10b981;">●</span> Neural Model Active (AST-AudioSet)`;
            ui.btn.innerText = "Sensor Array Active";
            ui.btn.style.borderColor = "#10b981";
            ui.btn.style.color = "#10b981";

            engine.startListening((result) => {
                // Update UI with real inference results
                const { confidence, metrics, topLabel } = result;

                // Animate bars
                ui.bars.vocal.style.width = metrics.vocal + '%';
                ui.vals.vocal.textContent = metrics.vocal.toFixed(1) + '%';

                ui.bars.impulse.style.width = metrics.impulse + '%';
                ui.vals.impulse.textContent = metrics.impulse.toFixed(1) + '%';

                ui.bars.env.style.width = metrics.env + '%';
                ui.vals.env.textContent = metrics.env.toFixed(1) + '%';

                // Main Confidence
                ui.confidence.textContent = confidence.toFixed(1) + '%';
                ui.confidence.style.color = confidence > 65 ? 'var(--signal-alert)' : (confidence > 35 ? 'var(--signal-caution)' : 'var(--text-primary)');

                // Operational Status Text
                if (confidence < 10) {
                    ui.mainStatus.textContent = `Monitoring Ambient Noise. (Top: ${topLabel})`;
                } else if (confidence < 40) {
                    ui.mainStatus.textContent = `Anomaly Detected: ${topLabel}`;
                } else if (confidence < 70) {
                    ui.mainStatus.textContent = `PROBABLE THREAT: ${topLabel.toUpperCase()} detected.`;
                } else {
                    ui.mainStatus.textContent = `CRITICAL ALERT: ${topLabel.toUpperCase()} CONFIRMED.`;
                }

                // Update Viz
                viz.update(confidence);
            });
        } else {
            ui.btn.innerText = "Initialization Failed";
            ui.status.innerHTML = "<span style='color:red;'>Error loading model. Check console.</span>";
        }
    });
});
