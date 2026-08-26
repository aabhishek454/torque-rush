// Torque Rush - Core Game

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.running = false;
    this.paused = false;
    this.engine = null;
    this.world = null;
    this.vehicle = null;
    this.terrain = null;
    this.camera = null;
    this.particles = new ParticleManager();
    this.ui = null;
    this.currentMap = null;
    this.currentStage = 0;
    this.lastTime = 0;
    this.coins = [];
    this.fuelPickups = [];
    this.finished = false;
    this.crashed = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.camera) this.camera.resize();
  }

  init() {
    loadSave();
    this.ui = new UIManager(this);
    this.ui.hideLoading();
    this.ui.showMain();
  }

  startStage(map, stageIdx) {
    this.currentMap = map;
    this.currentStage = stageIdx;
    this.finished = false;
    this.crashed = false;

    this.engine = Matter.Engine.create({ gravity: { x: 0, y: 1.0 } });
    this.world = this.engine.world;

    const targetDist = 600 + stageIdx * 200 + map.difficulty * 100;
    this.terrain = new TerrainSystem(this.engine, this.world, map, stageIdx);
    this.terrain.generate(targetDist);

    const save = getSave();
    const vData = getVehicleStats(save.selectedVehicle, save.upgrades);
    const startY = this.terrain.getHeightAt(80) - 60;
    this.vehicle = new Vehicle(this.world, 80, startY, vData);

    this.camera = new Camera(this.canvas);
    this.camera.x = 0;
    this.camera.y = startY - 200;

    this.spawnCollectibles();
    this.particles.clear();
    this.ui.hideAll();
    this.ui.showHUD();
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    requestAnimationFrame(t => this.loop(t));
  }

  spawnCollectibles() {
    this.coins = [];
    this.fuelPickups = [];
    const pts = this.terrain.points;
    for (let i = 5; i < pts.length - 10; i += 3 + Math.floor(Math.random() * 3)) {
      const p = pts[i];
      if (Math.random() < 0.55) this.coins.push({ x: p.x + 20, y: p.y - 40 - Math.random() * 30, r: 12, collected: false });
      if (Math.random() < 0.18) this.fuelPickups.push({ x: p.x + 10, y: p.y - 50, r: 14, collected: false });
    }
  }

  loop(time) {
    if (!this.running) return;
    const dt = Math.min(0.033, (time - this.lastTime) / 1000);
    this.lastTime = time;

    if (!this.paused) {
      Matter.Engine.update(this.engine, dt * 1000);
      this.vehicle.update(dt);
      this.camera.follow(this.vehicle, dt);
      this.particles.update(dt);
      this.checkCollectibles();
      this.checkFinish();
      this.ui.updateHUD(this.vehicle);

      if (this.vehicle.onGround && this.vehicle.input.gas && Math.random() < 0.3) {
        this.particles.emit(this.vehicle.wheelA.position.x, this.vehicle.wheelA.position.y + 10, this.currentMap.id === 'snow' ? 'snow' : 'dust', 2);
      }

      if (!this.vehicle.alive && !this.crashed) {
        this.crashed = true;
        this.camera.addShake(12);
        this.particles.emit(this.vehicle.chassis.position.x, this.vehicle.chassis.position.y, 'spark', 15);
        setTimeout(() => this.endStage(true), 900);
      }
    }

    this.draw();
    requestAnimationFrame(t => this.loop(t));
  }

  checkCollectibles() {
    const vx = this.vehicle.chassis.position.x;
    const vy = this.vehicle.chassis.position.y;
    this.coins.forEach(c => {
      if (!c.collected && Math.hypot(c.x - vx, c.y - vy) < 40) {
        c.collected = true;
        this.vehicle.coinsCollected += 5;
        this.particles.emit(c.x, c.y, 'spark', 4);
      }
    });
    this.fuelPickups.forEach(f => {
      if (!f.collected && Math.hypot(f.x - vx, f.y - vy) < 45) {
        f.collected = true;
        this.vehicle.fuel = Math.min(this.vehicle.maxFuel, this.vehicle.fuel + 35);
        this.particles.emit(f.x, f.y, 'spark', 5);
      }
    });
  }

  checkFinish() {
    if (this.finished || !this.vehicle.alive) return;
    if (this.vehicle.chassis.position.x >= this.terrain.goalX) {
      this.finished = true;
      this.endStage(false);
    }
    if (this.vehicle.fuel <= 0 && Math.abs(this.vehicle.chassis.velocity.x) < 0.3) {
      this.finished = true;
      setTimeout(() => this.endStage(true), 600);
    }
  }

  endStage(crashed) {
    this.running = false;
    this.ui.hideHUD();
    const dist = this.vehicle.distance;
    const trickScore = this.vehicle.tricks.reduce((s, t) => s + t.points, 0);
    const score = Math.floor(dist * 2 + trickScore + this.vehicle.coinsCollected * 10);
    const coinsEarned = this.vehicle.coinsCollected + Math.floor(dist / 20) + (crashed ? 0 : 30);
    completeStage(this.currentMap.id, this.currentStage, dist, score, coinsEarned);
    this.ui.showResults({
      crashed,
      distance: dist,
      coins: coinsEarned,
      xp: Math.floor(dist / 10) + Math.floor(score / 50),
      score,
      tricks: this.vehicle.tricks
    });
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);
    if (!this.terrain || !this.camera) return;
    this.terrain.draw(ctx, this.camera);
    this.coins.forEach(c => {
      if (c.collected) return;
      ctx.beginPath();
      ctx.arc(c.x - this.camera.x, c.y - this.camera.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.fill();
    });
    this.fuelPickups.forEach(f => {
      if (f.collected) return;
      ctx.fillStyle = '#ff6b35';
      ctx.beginPath();
      ctx.roundRect(f.x - this.camera.x - 10, f.y - this.camera.y - 12, 20, 24, 4);
      ctx.fill();
    });
    if (this.vehicle) this.vehicle.draw(ctx, this.camera);
    this.particles.draw(ctx, this.camera);
  }

  pause() { if (!this.running) return; this.paused = true; this.ui.showPause(); }
  resume() { this.paused = false; this.ui.hidePause(); this.lastTime = performance.now(); }
  togglePause() { if (this.paused) this.resume(); else this.pause(); }
  restartStage() { this.cleanup(); this.ui.hidePause(); this.ui.hideResults(); this.startStage(this.currentMap, this.currentStage); }
  nextStage() {
    this.cleanup();
    this.ui.hideResults();
    if (this.currentStage < this.currentMap.stages - 1) this.startStage(this.currentMap, this.currentStage + 1);
    else this.quitToMenu();
  }
  quitToMenu() { this.cleanup(); this.ui.hidePause(); this.ui.hideResults(); this.ui.showMain(); }
  cleanup() {
    this.running = false;
    if (this.vehicle) this.vehicle.destroy();
    if (this.terrain) this.terrain.destroy();
    this.vehicle = null;
    this.terrain = null;
    this.particles.clear();
  }
}
