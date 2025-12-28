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

        this.multiplierToAmount = () => {
            let amount = 6
            if (this.lastKnownMulty >= 2) amount = 4 // 10
            if (this.lastKnownMulty >= 10) amount = 3 // 100
            if (this.lastKnownMulty >= 100) amount = 2 // 100
            if (this.lastKnownStep + 1 === this.crashTable.length - 1) amount = 1 // на последную ставим одиночный
            return amount

            // лучше считать через multy на последнем блоке
        }

        this.patternProbabilities = 0.25 // 0.25 норм

        const HE = this.scene.logicCenter.getHouseEdge()
        const r = 1 - HE / 100

        const zones = {
            lt2: 1 - r / 2,
            z2_10: r / 2 - r / 10,
            z10_100: r / 10 - r / 100,
            gte100: r / 100
        }

        const ev = (p) => {
            // const p = this.patternProbabilities
            // return (50 * Math.pow(p, 6) + 40 * Math.pow(p, 4) + 9 * Math.pow(p, 3) + 1 * Math.pow(p, 2)) / 100
            return (
                zones.lt2 * p ** 6 +
                zones.z2_10 * p ** 4 +
                zones.z10_100 * p ** 3 +
                zones.gte100 * p ** 2
            )
        }
        console.log('Platforms patternProbabilities expected visible blocks:',
            ev(this.patternProbabilities).toFixed(4), (1 / ev(this.patternProbabilities)).toFixed(0))

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
                // this.setNextMulty(data.count + 1)
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
                // а нужен переход, анимация между двумя состояниями
                // 4) выбираем новый паттерн (transitions позже)
                const next = this.pickNextPattern() // this.currentPatternId
                // const next = this.currentPattern // dev
                // console.log(this.currentPatternId, 'Next pattern:', next)
                // 5) восстанавливаем сет и перерисовываем числа, начиная со следующего шага
                this.applyPattern(next, { immediate: true })
                this.renderMultipliers(data.count + 1)

                const detune = 1800 + Phaser.Math.Between(0, 400) // data.count * 10
                this.scene.sounds.domino.play({ detune: detune })
                // console.log(data.count, 'domino.play', detune)
            },
        })
    }
    applyPattern(patternObj, { immediate = true } = {}) {
        this.currentPattern = patternObj.pattern
        this.currentPatternId = patternObj.id

        this.setContainer.removeAll(true)
        this.blocks = []

        let bonus = 0
        let y = 0
        for (let i = 0; i < patternObj.blocks; i++) {
            const h = patternObj.heightsPx[i]
            const block = this.createBlock(h, i)
            block.y = y
            y += h
            this.setContainer.add(block)
            this.blocks.push(block)
            //dev
            // это нужно проверять из сцены, и вообще должно приходить от сервера
            // но для простоты пусть будет тут
            // все блоки с паттерном — бонус!
            if (block.__pattern.alpha > 0) {
                bonus += 1
            }
        }
        if (bonus === patternObj.blocks) {
            // это нужно проверять из сцены, и вообще должно приходить от сервера
            // но для простоты пусть будет тут
            // все блоки с паттерном — бонус!
            const hasCashOut = this.scene.logicCenter.getHasCashout()
            if (!hasCashOut) {
                this.scene.sounds.jingle.play()
                console.log('BONUS achieved! All patterns visible!')
            } else {
                console.log('BONUS skipped due to cashout')
            }
        }
        // if (bonus > 0) this.scene.sounds.puck.play({})

        if (immediate) {
            this.root.x = this.ballX
            this.root.y = this.touchPointY
            this.setContainer.y = 0
        }
    }

    // -----------------------
    // Rendering multipliers
    // -----------------------
    // setNextMulty(step) {
    //     let text = ''
    //     const table = this.crashTable
    //     const row = table[step]
    //     // console.log('setNextMulty step:', step, 'row:', row)

    //     const m = row.multiplier
    //     text = m >= 1000 ? m.toFixed(0) : m >= 100 ? m.toFixed(1) : m.toFixed(2)
    //     this.scene.countdownCounter.show(1)

    //     this.scene.countdownCounter.set(text)
    // }
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
        // let amount = 4
        // if (this.lastKnownMulty >= 2) amount = 3 // 10
        // if (this.lastKnownMulty >= 10) amount = 2 // 100
        // if (this.lastKnownStep + 1 === this.crashTable.length - 1) amount = 1 // на последную ставим одиночный

        const amount = this.multiplierToAmount()
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
        const g = this.scene.add.graphics();

        const isWhite = ((index + this.chessPhase) % 2 === 0);
        const fillColor = isWhite
            ? this.scene.standartColors.white
            : this.scene.standartColors.gray;

        g.__width = width;
        g.__height = height;
        g.__x = -width / 2;
        g.__y = 0;
        g.__color = fillColor;

        g.fillStyle(g.__color, 1);
        g.fillRect(g.__x, g.__y, g.__width, g.__height);

        return g;
    }

    createBlockFrame(width, height, index, isBonus = false) {
        const g = this.scene.add.graphics()

        // параметры стиля
        const strokeWidth = 4
        const strokeColor = isBonus ? this.scene.standartColors.red : this.scene.standartColors.dark_gray


        g.__x = -width / 2 + strokeWidth / 2;
        g.__y = 0 + strokeWidth / 2;
        g.__width = width - strokeWidth;
        g.__height = height - strokeWidth;
        g.__color = strokeColor;
        g.__strokeWidth = strokeWidth;

        g.lineStyle(g.__strokeWidth, strokeColor, 1)
        g.strokeRect(g.__x, g.__y, g.__width, g.__height);
        return g
    }

    createBlock(heightPx, index) {
        const scene = this.scene
        // нужен прямоугольник
        // паттерн
        // рамка - без фона
        // текст

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

        const patternRandom = Phaser.Math.FloatBetween(0, 1)
        const patternVisible = patternRandom < this.patternProbabilities
        const patternIndent = 0

        let pattern = null
        if (patternVisible) {
            pattern = scene.add.tileSprite(
                0,
                heightPx / 2,
                this.blockWidth - patternIndent * 2,
                heightPx - patternIndent * 2,
                'pattern'
            ).setOrigin(0.5).setAlpha(0.5)
        } else {
            // если не бонусная картинка, то паттерн из стандартных
            pattern = scene.add.rectangle(
                0,
                heightPx / 2,
                this.blockWidth - patternIndent * 2,
                heightPx - patternIndent * 2,
                0x000000,
            ).setOrigin(0.5).setAlpha(0)
        }

        const frame = this.createBlockFrame(this.blockWidth, heightPx, index)

        const block = scene.add.container(0, 0, [rect, pattern, frame, text])
        // block.setMask(mask);

        block.__rect = rect
        block.__frame = frame
        block.__text = text
        // block.__maskRect = maskRect
        block.__pattern = pattern
        block.__height = heightPx
        block.alpha = 1
        return block
    }

    setRedTop() {
        const top = this.blocks[0]
        if (!top) return
        this.recolorBlockRect(top.__rect, this.scene.standartColors.red);
        this.recolorBlockFrame(top.__frame, this.scene.standartColors.red);
        top.__pattern.alpha = 0
    }
    recolorBlockRect(g, newColor) {
        g.clear();
        g.fillStyle(newColor, 1);
        g.fillRect(g.__x, g.__y, g.__width, g.__height);
        g.__color = newColor;
    }
    recolorBlockFrame(g, newColor) {
        g.clear();
        g.lineStyle(g.__strokeWidth, newColor, 1)
        g.strokeRect(g.__x, g.__y, g.__width, g.__height);
        g.__color = newColor;
    }
    resetVisuals() {
        for (const b of this.blocks) {
            b.alpha = 1
            b.__rect.fillColor = 0xffffff
            // b.__tail.setTexture('fadeWhiteRect')
        }
    }
}
