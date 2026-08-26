// Torque Rush - Particle System

class ParticleManager {
  constructor() { this.particles = []; }
  emit(x, y, type, count = 6) {
    for (let i = 0; i < count; i++) {
      const p = {
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.8) * 5,
        life: 0.4 + Math.random() * 0.5,
        maxLife: 0.9,
        size: 2 + Math.random() * 4,
        type
      };
      if (type === 'dust') p.color = 'rgba(180,150,100,0.6)';
      else if (type === 'spark') { p.color = 'rgba(255,200,50,0.9)'; p.vx *= 1.5; p.vy *= 1.5; }
      else if (type === 'snow') { p.color = 'rgba(220,240,255,0.7)'; p.vy = Math.random() * 1.5; p.vx *= 0.5; }
      else p.color = 'rgba(100,100,100,0.5)';
      this.particles.push(p);
    }
  }
  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }
  draw(ctx, camera) {
    this.particles.forEach(p => {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - camera.x, p.y - camera.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
  clear() { this.particles = []; }
}
