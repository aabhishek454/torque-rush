// Torque Rush - Terrain System (Procedural, seeded)

class TerrainSystem {
  constructor(engine, world, mapData, stageIdx) {
    this.engine = engine;
    this.world = world;
    this.map = mapData;
    this.stageIdx = stageIdx;
    this.segments = [];
    this.bodies = [];
    this.points = [];
    this.segmentWidth = 80;
    this.totalLength = 0;
    this.goalX = 0;
    this.seed = this.hash(`${mapData.id}_${stageIdx}`);
  }

  hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  seededRandom() {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  generate(targetDistance) {
    this.bodies.forEach(b => Matter.World.remove(this.world, b));
    this.bodies = [];
    this.points = [];
    this.segments = [];

    const difficulty = this.map.difficulty + this.stageIdx * 0.4;
    const numSegments = Math.max(40, Math.floor(targetDistance / this.segmentWidth) + 15);

    let y = 400;
    this.points.push({ x: -200, y });

    for (let i = 0; i < numSegments; i++) {
      const r = this.seededRandom();
      let dy = 0;
      dy += Math.sin(i * 0.15 + this.seededRandom() * 2) * (18 + difficulty * 8);
      if (r < 0.08 + difficulty * 0.02) {
        dy -= 40 + this.seededRandom() * 60 * difficulty;
      } else if (r < 0.14 + difficulty * 0.03) {
        dy += 50 + this.seededRandom() * 70 * difficulty;
      }
      dy += (this.seededRandom() - 0.5) * 25;
      y = Math.max(180, Math.min(620, y + dy));
      this.points.push({ x: i * this.segmentWidth, y });
    }

    for (let i = 0; i < 8; i++) {
      this.points.push({ x: (numSegments + i) * this.segmentWidth, y });
    }

    this.totalLength = this.points[this.points.length - 1].x;
    this.goalX = this.totalLength - 300;
    this.createBodies();
  }

  createBodies() {
    const thickness = 60;
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      const body = Matter.Bodies.rectangle(midX, midY + thickness / 2, len + 4, thickness, {
        isStatic: true,
        friction: 0.9,
        frictionStatic: 1.0,
        restitution: 0.1,
        angle: angle,
        label: 'ground',
        render: { visible: false }
      });

      Matter.World.add(this.world, body);
      this.bodies.push(body);
      this.segments.push({ p1, p2, body });
    }
  }

  getHeightAt(x) {
    if (x <= this.points[0].x) return this.points[0].y;
    if (x >= this.points[this.points.length - 1].x) return this.points[this.points.length - 1].y;
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      if (x >= p1.x && x <= p2.x) {
        const t = (x - p1.x) / (p2.x - p1.x);
        return p1.y + (p2.y - p1.y) * t;
      }
    }
    return 400;
  }

  draw(ctx, camera) {
    const viewLeft = camera.x - 100;
    const viewRight = camera.x + camera.width + 100;
    const sky = this.map.sky;
    const grad = ctx.createLinearGradient(0, 0, 0, camera.height);
    grad.addColorStop(0, sky[0]);
    grad.addColorStop(1, sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, camera.width, camera.height);

    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = this.map.ground;
    ctx.beginPath();
    ctx.moveTo(0, camera.height);
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const sx = (p.x - camera.x) * 0.4 + camera.width * 0.3;
      const sy = (p.y - camera.y) * 0.35 + 80;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.lineTo(camera.width, camera.height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = this.map.ground;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      if (p.x < viewLeft - 50 || p.x > viewRight + 50) continue;
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;
      if (!started) {
        ctx.moveTo(sx, camera.height + 50);
        ctx.lineTo(sx, sy);
        started = true;
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    if (started) {
      const last = this.points[this.points.length - 1];
      ctx.lineTo(last.x - camera.x, camera.height + 50);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      started = false;
      for (let i = 0; i < this.points.length; i++) {
        const p = this.points[i];
        if (p.x < viewLeft || p.x > viewRight) continue;
        const sx = p.x - camera.x;
        const sy = p.y - camera.y;
        if (!started) { ctx.moveTo(sx, sy); started = true; }
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    if (this.goalX > viewLeft && this.goalX < viewRight) {
      const gx = this.goalX - camera.x;
      const gy = this.getHeightAt(this.goalX) - camera.y;
      ctx.fillStyle = '#00e5a0';
      ctx.fillRect(gx - 3, gy - 80, 6, 80);
      ctx.beginPath();
      ctx.moveTo(gx + 3, gy - 80);
      ctx.lineTo(gx + 40, gy - 65);
      ctx.lineTo(gx + 3, gy - 50);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Orbitron, sans-serif';
      ctx.fillText('FINISH', gx + 8, gy - 62);
    }
  }

  destroy() {
    this.bodies.forEach(b => Matter.World.remove(this.world, b));
    this.bodies = [];
  }
}
