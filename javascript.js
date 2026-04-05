(function() {
    const canvas = document.getElementById('dna-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 7);

    function resize() {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    const matA = new THREE.MeshStandardMaterial({ color: 0x888899, emissive: 0x111122, emissiveIntensity: 0.1, roughness: 0.05, metalness: 1.0 });
    const matB = new THREE.MeshStandardMaterial({ color: 0x9999aa, emissive: 0x0a0a22, emissiveIntensity: 0.1, roughness: 0.05, metalness: 1.0 });
    const matR = new THREE.MeshStandardMaterial({ color: 0x777788, emissive: 0x080814, emissiveIntensity: 0.08, roughness: 0.08, metalness: 1.0 });
    const matN1 = new THREE.MeshStandardMaterial({ color: 0x4488cc, emissive: 0x1133aa, emissiveIntensity: 0.4, roughness: 0.03, metalness: 0.98 });
    const matN2 = new THREE.MeshStandardMaterial({ color: 0x8844cc, emissive: 0x441188, emissiveIntensity: 0.35, roughness: 0.03, metalness: 0.98 });

    scene.add(new THREE.AmbientLight(0x101020, 2.5));
    const dl1 = new THREE.DirectionalLight(0xddeeff, 6.0);
    dl1.position.set(3, 5, 5);
    scene.add(dl1);
    const dl2 = new THREE.DirectionalLight(0x00aaff, 3.5);
    dl2.position.set(-4, 0, -3);
    scene.add(dl2);
    const dl3 = new THREE.DirectionalLight(0x8833cc, 2.5);
    dl3.position.set(0, -4, 2);
    scene.add(dl3);
    const pl = new THREE.PointLight(0x6633ff, 3.0, 16);
    pl.position.set(0, 0, 4);
    scene.add(pl);

    const dna = new THREE.Group();
    scene.add(dna);
    const steps = 32;
    const height = 6.4;
    const radius = 1.15;
    const turns = 2.6;

    class HelixCurve extends THREE.Curve {
        constructor(ph) {
            super();
            this.ph = ph;
        }
        getPoint(t) {
            const a = t * Math.PI * 2 * turns + this.ph;
            return new THREE.Vector3(Math.cos(a) * radius, (t - 0.5) * height, Math.sin(a) * radius);
        }
    }

    dna.add(new THREE.Mesh(new THREE.TubeGeometry(new HelixCurve(0), 260, 0.075, 12, false), matA));
    dna.add(new THREE.Mesh(new THREE.TubeGeometry(new HelixCurve(Math.PI), 260, 0.075, 12, false), matB));

    for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const a = t * Math.PI * 2 * turns;
        const y = (t - 0.5) * height;
        const pA = new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius);
        const pB = new THREE.Vector3(Math.cos(a + Math.PI) * radius, y, Math.sin(a + Math.PI) * radius);
        const dir = new THREE.Vector3().subVectors(pB, pA);
        const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);

        const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, dir.length(), 8), matR);
        rung.position.copy(mid);
        rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        dna.add(rung);

        const nA = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), matN1);
        nA.position.copy(pA);
        dna.add(nA);
        const nB = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), matN2);
        nB.position.copy(pB);
        dna.add(nB);
    }

    const gc = document.createElement('canvas');
    gc.width = gc.height = 128;
    const gx = gc.getContext('2d');
    const gg = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gg.addColorStop(0, 'rgba(100,60,200,.6)');
    gg.addColorStop(0.5, 'rgba(0,150,255,.15)');
    gg.addColorStop(1, 'rgba(0,0,0,0)');
    gx.fillStyle = gg;
    gx.fillRect(0, 0, 128, 128);

    const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(gc),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    }));
    glowSprite.scale.set(6, 6, 1);
    dna.add(glowSprite);

    let t0 = null;

    function animate(ts) {
        requestAnimationFrame(animate);
        if (!t0) t0 = ts;
        const el = (ts - t0) / 1000;
        dna.rotation.y = el * 0.38;
        dna.rotation.x = Math.sin(el * 0.18) * 0.12;
        pl.intensity = 2.6 + Math.sin(el * 1.4) * 0.9;
        renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);
})();

const cur = document.getElementById('cur');
const ring = document.getElementById('ring');
if (cur && ring) {
    let mx = 0;
    let my = 0;
    let rx = 0;
    let ry = 0;
    document.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
    });
    (function animateCursor() {
        cur.style.left = mx + 'px';
        cur.style.top = my + 'px';
        rx += (mx - rx) * 0.1;
        ry += (my - ry) * 0.1;
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
        requestAnimationFrame(animateCursor);
    })();
}

const target = new Date('2026-07-06T08:00:00+07:00');

function tick() {
    const d = target - new Date();
    const ids = ['cd-d', 'cd-h', 'cd-m', 'cd-s'];
    if (d <= 0) {
        ids.forEach(id => {
            const node = document.getElementById(id);
            if (node) node.textContent = '00';
        });
        return;
    }
    const map = {
        'cd-d': String(Math.floor(d / 864e5)).padStart(2, '0'),
        'cd-h': String(Math.floor((d % 864e5) / 36e5)).padStart(2, '0'),
        'cd-m': String(Math.floor((d % 36e5) / 6e4)).padStart(2, '0'),
        'cd-s': String(Math.floor((d % 6e4) / 1e3)).padStart(2, '0')
    };
    ids.forEach(id => {
        const node = document.getElementById(id);
        if (node) node.textContent = map[id];
    });
}

tick();
setInterval(tick, 1000);

const obs = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
        entry.target.classList.add('on');
        obs.unobserve(entry.target);
    }
}), {
    threshold: 0.1
});

document.querySelectorAll('.reveal').forEach(el => obs.observe(el));