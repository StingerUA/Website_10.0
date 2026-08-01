// Компонент физического управления наклоном карточки
AFRAME.registerComponent('tilt-logic', {
    schema: {
        sensitivity: { type: 'number', default: 0.15 },
        maxForce: { type: 'number', default: 0.6 }
    },

    init: function () {
        this.marker = document.querySelector('#game-marker');
    },

    tick: function () {
        if (!this.marker) return;
        const markerObj = this.marker.object3D;
        if (!markerObj || !markerObj.visible) return;

        const body = this.el.body;
        if (!body) return;

        // Считываем углы поворота карточки в градусах
        const rotation = this.marker.getAttribute('rotation');
        if (!rotation) return;

        // Преобразуем наклон в векторы силы для Ammo.js
        let forceX = rotation.z * (this.data.sensitivity * 0.01);
        let forceZ = rotation.x * (-this.data.sensitivity * 0.01);

        // Ограничиваем максимальную силу
        forceX = Math.max(-this.data.maxForce, Math.min(this.data.maxForce, forceX));
        forceZ = Math.max(-this.data.maxForce, Math.min(this.data.maxForce, forceZ));

        // Применяем импульс к шарику
        const forceVec = new Ammo.btVector3(forceX, 0, forceZ);
        body.applyCentralImpulse(forceVec);
        Ammo.destroy(forceVec);
    }
});

// Компонент управления уровнем и финишем
AFRAME.registerComponent('level-manager', {
    schema: {
        startPos: { type: 'vec3', default: { x: -0.55, y: 0.15, z: 0.55 } },
        finishPos: { type: 'vec3', default: { x: 0.55, y: 0.15, z: -0.55 } },
        finishRadius: { type: 'number', default: 0.12 }
    },

    init: function () {
        this.ball = document.querySelector('#player-ball');
        this.hintUI = document.querySelector('#tracking-hint');
        this.winModal = document.querySelector('#win-modal');
        this.isCompleted = false;

        // Отслеживание маркера
        this.el.addEventListener('markerFound', () => {
            if (this.hintUI) this.hintUI.style.display = 'none';
            if (!this.isCompleted) {
                this.resetBall();
            }
        });

        this.el.addEventListener('markerLost', () => {
            if (this.hintUI) {
                this.hintUI.style.display = 'flex';
            }
        });
    },

    resetBall: function () {
        if (!this.ball) return;

        // 1. Возвращаем позицию на старт
        const pos = this.data.startPos;
        this.ball.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);

        // 2. Полностью сбрасываем скорости в Ammo.js
        const body = this.ball.body;
        if (body) {
            const zeroVec = new Ammo.btVector3(0, 0, 0);
            body.setLinearVelocity(zeroVec);
            body.setAngularVelocity(zeroVec);
            body.clearForces();
            Ammo.destroy(zeroVec);
        }
    },

    tick: function () {
        if (this.isCompleted || !this.ball || !this.el.object3D.visible) return;

        // Проверяем достижение финиша
        const ballPos = this.ball.getAttribute('position');
        const dx = ballPos.x - this.data.finishPos.x;
        const dz = ballPos.z - this.data.finishPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < this.data.finishRadius) {
            this.isCompleted = true;
            if (this.winModal) {
                this.winModal.classList.add('active');
            }
        }
    }
});

// Вспомогательные функции для UI
function resetCurrentLevel() {
    const marker = document.querySelector('#game-marker');
    if (marker && marker.components['level-manager']) {
        marker.components['level-manager'].isCompleted = false;
        marker.components['level-manager'].resetBall();
    }
    closeWinModal();
}

function closeWinModal() {
    const winModal = document.querySelector('#win-modal');
    if (winModal) {
        winModal.classList.remove('active');
    }
}