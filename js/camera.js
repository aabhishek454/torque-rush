// Torque Rush - Smooth Camera

class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.x = 0; this.y = 0;
    this.targetX = 0; this.targetY = 0;
    this.zoom = 1; this.targetZoom = 1;
    this.shake = 0; this.lookAhead = 0;
  }
  resize() {
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }
  follow(vehicle, dt) {
    if (!vehicle || !vehicle.chassis) return;
    const pos = vehicle.chassis.position;
    const speed = Math.abs(vehicle.chassis.velocity.x);
    this.lookAhead += ((speed * 12) - this.lookAhead) * 0.04;
    this.targetX = pos.x - this.width * 0.35 + this.lookAhead;
    this.targetY = pos.y - this.height * 0.55;
    if (!vehicle.onGround && vehicle.airTime > 0.4) this.targetZoom = 0.82;
    else if (speed > 15) this.targetZoom = 0.92;
    else this.targetZoom = 1.0;
    this.x += (this.targetX - this.x) * Math.min(1, 0.08 * dt * 60);
    this.y += (this.targetY - this.y) * Math.min(1, 0.06 * dt * 60);
    this.zoom += (this.targetZoom - this.zoom) * 0.04;
    if (this.shake > 0) { this.shake *= 0.9; if (this.shake < 0.3) this.shake = 0; }
  }
  addShake(amount) { this.shake = Math.min(18, this.shake + amount); }
  reset() { this.x = 0; this.y = 0; this.zoom = 1; this.shake = 0; }
}
