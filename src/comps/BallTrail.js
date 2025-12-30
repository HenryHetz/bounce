// BallTrail.js
// Вертикальный цельный след-капсула: фиксированные x/topY/width, на апдейте только bottomY.
// Рисование: clear + один path + gradient fill, отображение: crop без scale.

export class BallTrail {
    constructor(scene, obj) {
        this.scene = scene;

        this.x = obj.x
        this.topY = obj.y - 110
        this.color = { r: 255, g: 0, b: 55 }
        this.key = 'ballTrail';
        this.w = obj.width;
        this.H = 1000; // Math.max(8, 1000 | 0)
        this.depth = 100;

        this.r = this.color.r;
        this.g = this.color.g;
        this.b = this.color.b;
        this.alphaTop = 0.8;
        this.alphaBottom = 0.01;

        this.active = false;

        const textures = scene?.sys?.textures;
        if (!textures) throw new Error('BallTrail: scene.sys.textures not ready');

        // CanvasTexture (пересоздаём, если ключ занят не тем или размер другой)
        let tex = textures.get(this.key);
        const src = tex?.getSourceImage?.();
        const isCanvas = !!(src && src.getContext);
        if (!tex || !isCanvas || src.width !== this.w || src.height !== this.H) {
            if (tex) textures.remove(this.key);
            tex = textures.createCanvas(this.key, this.w, this.H);
        }
        this.tex = tex;
        this.ctx = tex.getContext();

        this.img = scene.add.image(0, 0, this.key)
            .setOrigin(0.5, 0)
            .setDepth(this.depth)
            .setVisible(false);
    }

    /** Один раз на старт движения: фиксируем геометрию и включаем след */
    start(topY) {
        // console.log('start trail')
        // if (Number.isFinite(x)) this.x = x;
        // if (Number.isFinite(topY)) this.topY = topY;

        this.active = true;
        this.img.setVisible(true);
        this.img.setCrop(); // reset crop
    }

    /** Каждый кадр: обновляем только нижнюю точку */
    render(bottomY) {
        if (!this.active) return;
        // if (!Number.isFinite(bottomY) || !Number.isFinite(this.topY) || !Number.isFinite(this.x)) return;

        // const tY = Math.min(this.topY, bottomY);
        // const bY = Math.max(this.topY, bottomY);

        // const len = bY - tY;

        const len = bottomY - this.topY
        if (!(len > 0)) return;

        const h = Math.min(len, this.H);
        // const hh = Math.max(1, h | 0); // целое, не 0
        const hh = Math.ceil(h); // целое

        // позиционирование и показ без scale
        this.img.x = this.x;
        this.img.y = this.topY;

        this.img.setCrop(0, 0, this.w, hh);

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.w, this.H);

        const g = ctx.createLinearGradient(0, hh, 0, 0);
        g.addColorStop(0, `rgba(${this.r},${this.g},${this.b},${this.alphaTop})`);
        g.addColorStop(1, `rgba(${this.r},${this.g},${this.b},${this.alphaBottom})`);

        ctx.fillStyle = g;

        const rad = Math.min(this.w * 0.5, hh * 0.5);

        ctx.beginPath();
        ctx.moveTo(rad, 0);
        ctx.lineTo(this.w - rad, 0);
        ctx.quadraticCurveTo(this.w, 0, this.w, rad);
        ctx.lineTo(this.w, hh - rad);
        ctx.quadraticCurveTo(this.w, hh, this.w - rad, hh);
        ctx.lineTo(rad, hh);
        ctx.quadraticCurveTo(0, hh, 0, hh - rad);
        ctx.lineTo(0, rad);
        ctx.quadraticCurveTo(0, 0, rad, 0);
        ctx.closePath();

        ctx.fill();
        this.tex.refresh();
    }

    /** Отключить/спрятать */
    stop() {
        // console.log('stop trail')
        this.active = false;
        this.img.setVisible(false);
        this.img.setCrop();
    }

    destroy(removeTexture = false) {
        this.img?.destroy();
        if (removeTexture) this.scene?.sys?.textures?.remove(this.key);
    }
}
