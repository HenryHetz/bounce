export class Platforms {
    constructor(scene) {
        this.scene = scene

        // ВАЖНО: GameScene.roundPrepare использует this.platforms.hiddingCount
        // (см. GameScene.roundPrepare) — без этого будет NaN и раунд не стартанёт.
        this.hiddingCount = 5

        this.ballX = scene.ballX
        this.ballY = scene.ballY
        this.distanceY = scene.distanceY
        this.duration = scene.duration
        this.depth = 10

        this.touchPointY = this.ballY + this.distanceY

        this.groupTotalHeight = 470 - this.scene.baseDistanceY
        this.blockWidth = 180

        this.crashTable = []
        this.lastKnownStep = 0 // индекс шага для рендера чисел (count из событий)
        this.chessPhase = 0

        // Паттерны
        this.blockMap = [
            { pattern: [1], weight: 1, transitions: [] }, // одиночный не используем как активный сет
            { pattern: [1, 1], weight: 10, transitions: [] },
            // { pattern: [1, 2], weight: 10, transitions: [] },
            // { pattern: [2, 1], weight: 10, transitions: [] },
            // { pattern: [3, 1], weight: 10, transitions: [] },
            // { pattern: [1, 3], weight: 10, transitions: [] },
            { pattern: [1, 1, 1], weight: 10, transitions: [] },
            // { pattern: [2, 1, 1], weight: 10, transitions: [] },
            // { pattern: [3, 1, 1], weight: 10, transitions: [] },
            { pattern: [1, 1, 1, 1], weight: 10, transitions: [] },
            { pattern: [1, 1, 1, 1, 1, 1], weight: 10, transitions: [] },
        ]

        this.compiledMap = this.compileBlockMap(this.blockMap)

        // Один сет (одна группа) в точке касания
        this.root = this.scene.add
            .container(this.ballX, this.touchPointY)
            .setDepth(this.depth)

        this.setContainer = this.scene.add.container(0, 0)
        this.root.add(this.setContainer)

        this.blocks = []
        this.currentPattern = null
        this.currentPatternId = null

        this.createAssets()
        this.createEvents()
    }

    // -----------------------
    // Assets & Events
    // -----------------------

    createAssets() {
        this.scene.createGradientTexture('fadeWhiteRect', '255,255,255', 120, 160)
        this.scene.createGradientTexture('fadeRedRect', '255,0,0', 120, 160)
    }

    createEvents() {
        this.scene.events.on('gameEvent', (data) => this.handleEvent(data))
    }

    handleEvent(data) {
        if (data.mode === 'RISK_SETTING_CHANGED') {
            this.crashTable = data.crashTable || []
            // this.lastKnownStep = 0

            // if (!this.currentPattern) this.startSet()
            // this.renderMultipliers(0)
            return
        }

        if (data.mode === 'ROUND_PREPARE') {
            this.resetVisuals()
            this.lastKnownStep = 0
            this.startSet()
            this.renderMultipliers(0)
            return
        }

        if (data.mode === 'BOUNCE') {
            // console.log('Platforms BOUNCE data:', data)
            // data.count = текущий шаг, который был выбит
            this.lastKnownStep = data.count
            this.lastKnownMulty = data.multiplier
            this.chessPhase ^= 1
            this.onBounce(data)
            // dev
            // this.scene.countdownCounter.set(data.count + 1)
            // this.scene.countdownCounter.show(1)
            return
        }

        if (data.mode === 'FINISH') {
            this.setRedTop()

            return
        }
    }

    // -----------------------
    // Pattern compilation / heights
    // -----------------------

    compileBlockMap(blockMap) {
        const list = blockMap.map((raw) => {
            const id = raw.name || raw.pattern.join('_')
            return {
                id,
                pattern: raw.pattern,
                blocks: raw.pattern.length,
                heightsPx: this.computeHeightsPx(this.groupTotalHeight, raw.pattern),
                weight: raw.weight ?? 1,
                transitions: raw.transitions ?? null,
            }
        })
        const byId = new Map(list.map((p) => [p.id, p]))
        return { list, byId }
    }

    computeHeightsPx(totalHeight, pattern) {
        const sum = pattern.reduce((a, b) => a + b, 0)
        const ideal = pattern.map((k) => (k * totalHeight) / sum)
        const floored = ideal.map((x) => Math.floor(x))
        let used = floored.reduce((a, b) => a + b, 0)
        let rest = totalHeight - used

        if (rest > 0) {
            const fracIdx = ideal
                .map((x, i) => ({ i, frac: x - Math.floor(x) }))
                .sort((a, b) => b.frac - a.frac)
            let p = 0
            while (rest > 0) {
                floored[fracIdx[p % fracIdx.length].i] += 1
                rest -= 1
                p += 1
            }
        }
        return floored
    }

    // -----------------------
    // Set lifecycle
    // -----------------------

    startSet() {
        // стартовый паттерн: любой, но не одиночный
        const startCandidates = this.compiledMap.list.filter((p) => p.blocks === 6)
        const start = this.weightedPick(startCandidates)
        this.applyPattern(start, { immediate: true })
    }

    onBounce(data) {
        if (!this.blocks.length) return
        // console.log('onBounce:', data.count)
        const top = this.blocks[0]
        const removedH = top.__height

        // 1) выбиваем верхний
        this.scene.tweens.add({
            targets: top.list[0],
            // y: top.y + 10,
            alpha: 0,
            delay: 0,
            duration: 50,
            onComplete: () => {
                top.destroy()
                this.setNextMulty(data.count + 1)
                // 4) выбираем новый паттерн (transitions позже)
                // const next = this.pickNextPattern(this.currentPatternId)
                // // const next = this.currentPattern // dev
                // // console.log(this.currentPatternId, 'Next pattern:', next)
                // // 5) восстанавливаем сет и перерисовываем числа, начиная со следующего шага
                // this.applyPattern(next, { immediate: true })
                // this.renderMultipliers(hitStep + 1)
            }
        })

        // 2) удаляем из массива
        this.blocks.shift()

        const easeBackInOut = (v) => Phaser.Math.Easing.Back.InOut(v, 0.7)
        let patternSwitched = false

        // 3) подтягиваем оставшиеся вверх (визуально)
        this.scene.tweens.add({
            targets: this.setContainer,
            y: this.setContainer.y - removedH,
            delay: 50,
            duration: 200, //  Math.max(60, Math.floor(this.duration * 0.25))
            // ease: 'Back.easeInOut', // Cubic Back.easeInOut
            ease: easeBackInOut,
            onUpdate: (tween) => {
                // 0.45–0.6 — зона максимальной скорости / минимального внимания
                // if (!patternSwitched && tween.progress > 0.95) {
                //     patternSwitched = true
                //     const next = this.pickNextPattern()
                //     this.applyPattern(next, { immediate: true })
                //     this.renderMultipliers(hitStep + 1)
                // }
            },
            onComplete: () => {
                this.setContainer.y = 0
                const detune = 1800 + Phaser.Math.Between(0, 400) // data.count * 10
                this.scene.sounds.domino.play({ detune: detune })
                // console.log(data.count, 'domino.play', detune)
                // а нужен переход, анимация между двумя состояниями
                // 4) выбираем новый паттерн (transitions позже)
                const next = this.pickNextPattern() // this.currentPatternId
                // const next = this.currentPattern // dev
                // console.log(this.currentPatternId, 'Next pattern:', next)
                // 5) восстанавливаем сет и перерисовываем числа, начиная со следующего шага
                this.applyPattern(next, { immediate: true })
                this.renderMultipliers(data.count + 1)
            },
        })
    }
    applyPattern(patternObj, { immediate = true } = {}) {
        this.currentPattern = patternObj.pattern
        this.currentPatternId = patternObj.id

        this.setContainer.removeAll(true)
        this.blocks = []

        let y = 0
        for (let i = 0; i < patternObj.blocks; i++) {
            const h = patternObj.heightsPx[i]
            const block = this.createBlock(h, i)
            block.y = y
            y += h
            this.setContainer.add(block)
            this.blocks.push(block)
        }

        // tail только у нижнего
        // if (this.blocks.length) {
        //     const last = this.blocks[this.blocks.length - 1]
        //     last.__tail.setVisible(true)
        //     last.__tail.y = last.__height
        // }

        if (immediate) {
            this.root.x = this.ballX
            this.root.y = this.touchPointY
            this.setContainer.y = 0
        }
    }

    // -----------------------
    // Rendering multipliers
    // -----------------------
    setNextMulty(step) {
        let text = ''
        const table = this.crashTable
        const row = table[step]
        // console.log('setNextMulty step:', step, 'row:', row)

        const m = row.multiplier
        text = m >= 1000 ? m.toFixed(0) : m >= 100 ? m.toFixed(1) : m.toFixed(2)
        this.scene.countdownCounter.show(1)

        this.scene.countdownCounter.set(text)
    }
    renderMultipliers(startStep) {
        // startStep = какой индекс crashTable показываем на верхнем блоке
        const table = this.crashTable
        if (!Array.isArray(table) || table.length === 0) return

        for (let i = 0; i < this.blocks.length; i++) {
            const step = startStep + i
            const b = this.blocks[i]

            const row = table[step]
            if (!row || typeof row.multiplier !== 'number') {
                b.__text.setText('')
                continue
            }

            const m = row.multiplier
            // формат как у тебя в других местах
            let text = m >= 1000 ? m.toFixed(0) : m >= 100 ? m.toFixed(1) : m.toFixed(2)
            // text = 'X_' + text
            if (m === 1) text = '...' // особый случай для единицы
            b.__text.setText(text)
        }
    }

    // -----------------------
    // Pattern selection (hook for transitions)
    // -----------------------

    pickNextPattern(prevId) {
        let amount = 4
        if (this.lastKnownMulty >= 2) amount = 3 // 10
        if (this.lastKnownMulty >= 10) amount = 2 // 100
        if (this.lastKnownStep + 1 === this.crashTable.length - 1) amount = 1 // на последную ставим одиночный
        let candidates = this.compiledMap.list.filter((p) => p.blocks === amount)

        // console.log(this.lastKnownMulty, this.lastKnownStep, 'pickNextPattern amount:', amount, this.crashTable.length)
        // console.log('pickNextPattern candidates for amount', amount, ':', candidates)
        // return candidates[0] // dev

        if (prevId) {
            const prev = this.compiledMap.byId.get(prevId)
            if (prev?.transitions?.length) {
                const allowed = new Set(prev.transitions)
                const filtered = candidates.filter((p) => allowed.has(p.id))
                if (filtered.length) candidates = filtered
            }
        }

        if (prevId && candidates.length > 1) {
            const filtered = candidates.filter((p) => p.id !== prevId)
            if (filtered.length) candidates = filtered
        }

        return this.weightedPick(candidates)
    }

    pickNextPattern_(prevId) {
        let candidates = this.compiledMap.list.filter((p) => p.blocks >= 2)
        // return candidates[0] // dev

        if (prevId) {
            const prev = this.compiledMap.byId.get(prevId)
            if (prev?.transitions?.length) {
                const allowed = new Set(prev.transitions)
                const filtered = candidates.filter((p) => allowed.has(p.id))
                if (filtered.length) candidates = filtered
            }
        }

        if (prevId && candidates.length > 1) {
            const filtered = candidates.filter((p) => p.id !== prevId)
            if (filtered.length) candidates = filtered
        }

        return this.weightedPick(candidates)
    }

    weightedPick(candidates) {
        // console.log('weightedPick candidates:', candidates)
        const total = candidates.reduce((a, p) => a + (p.weight || 1), 0) || 1
        let r = Math.random() * total
        for (const p of candidates) {
            r -= p.weight || 1
            if (r <= 0) return p
        }
        return candidates[candidates.length - 1]
    }

    // -----------------------
    // Blocks visuals
    // -----------------------
    createBlockRect(width, height, index) {
        const g = this.scene.add.graphics()

        const isWhite = ((index + this.chessPhase) % 2 === 0)
        // console.log('index:', index, 'chessPhase:', this.chessPhase, 'isWhite:', isWhite,)
        // параметры стиля
        const strokeWidth = 4
        const strokeColor = this.scene.standartColors.dark_gray
        const fillColor = isWhite ? this.scene.standartColors.white : this.scene.standartColors.gray
        const fillAlpha = 1 // прозрачность фона

        g.lineStyle(strokeWidth, strokeColor, 1)
        g.fillStyle(fillColor, fillAlpha)

        g.fillRect(-width / 2, 0, width, height)

        g.strokeRect(
            -width / 2 + strokeWidth / 2,
            0 + strokeWidth / 2,
            width - strokeWidth, // - strokeWidth * 2
            height - strokeWidth// - strokeWidth * 2
        )

        return g
    }

    createBlock(heightPx, index) {
        const scene = this.scene

        const strokeWidth = 4

        const rect = this.createBlockRect(this.blockWidth, heightPx, index)

        const text = scene.add
            .text(0, heightPx * 0.5, '', {
                fontSize: '20px',
                // color: index === 0 ? scene.textColors.red : scene.textColors.black,
                color: scene.textColors.black,
                fontFamily: 'AvenirBlack',

                // fontFamily: 'JapanRobot',
                // fontSize: '24px',
                // fill: scene.textColors.black,
            })
            .setOrigin(0.5, 0.5)

        // const pattern = scene.add.image(-this.blockWidth / 2, 0, 'pattern').setOrigin(0, 0);
        // pattern.setAlpha(0.8);

        // 2) Маска в тех же локальных координатах блока
        // const mg = scene.add.graphics();
        // mg.fillStyle(0xffffff, 0.5);
        // mg.fillRect(-this.blockWidth / 2, 0, this.blockWidth, heightPx);
        // mg.setVisible(1);

        // const mask = mg.createGeometryMask();
        // pattern.setMask(mask);

        const pattern = scene.add.tileSprite(
            0,
            heightPx / 2,
            this.blockWidth - strokeWidth * 2,
            heightPx - strokeWidth * 2,
            'pattern'
        ).setOrigin(0.5).setAlpha(index == 2 ? 0.5 : 0)

        const unit = scene.add.container(0, 0, [rect, pattern, text])
        // unit.setMask(mask);

        unit.__rect = rect
        unit.__text = text
        // unit.__maskRect = maskRect
        unit.__pattern = pattern
        unit.__height = heightPx
        unit.alpha = 1
        return unit
    }

    setRedTop() {
        const top = this.blocks[0]
        if (!top) return
        top.__rect.fillColor = this.scene.standartColors.red

        // top.__tail.setTexture('fadeRedRect')
    }

    resetVisuals() {
        for (const b of this.blocks) {
            b.alpha = 1
            b.__rect.fillColor = 0xffffff
            // b.__tail.setTexture('fadeWhiteRect')
        }
    }
}
