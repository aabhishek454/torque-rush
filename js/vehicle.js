// Torque Rush - Vehicle Physics

class Vehicle {
  constructor(world, x, y, vehicleData) {
    this.world = world;
    this.data = vehicleData;
    this.stats = vehicleData.stats;
    this.fuel = this.stats.fuelCap;
    this.maxFuel = this.stats.fuelCap;
    this.alive = true;
    this.distance = 0;
    this.startX = x;
    this.airTime = 0;
    this.flipCount = 0;
    this.lastAngle = 0;
    this.onGround = false;
    this.coinsCollected = 0;
    this.tricks = [];
    this.combo = 0;
    this.comboTimer = 0;

    const w = vehicleData.bodyW || 90;
    const h = vehicleData.bodyH || 36;
    const wheelR = 16;

    this.chassis = Matter.Bodies.rectangle(x, y, w, h, {
      density: 0.002 * this.stats.weight,
      friction: 0.3,
      restitution: 0.2,
      label: 'chassis',
      collisionFilter: { group: -1 }
    });

    this.wheelA = Matter.Bodies.circle(x - w * 0.32, y + h * 0.55, wheelR, {
      density: 0.0015,
      friction: this.stats.grip * 1.4,
      restitution: 0.3,
      label: 'wheel',
      collisionFilter: { group: -1 }
    });
    this.wheelB = Matter.Bodies.circle(x + w * 0.32, y + h * 0.55, wheelR, {
      density: 0.0015,
      friction: this.stats.grip * 1.4,
      restitution: 0.3,
      label: 'wheel',
      collisionFilter: { group: -1 }
    });

    const stiff = 0.08 + this.stats.suspension * 0.12;
    const damp = 0.08 + this.stats.suspension * 0.05;

    this.springA = Matter.Constraint.create({
      bodyA: this.chassis, pointA: { x: -w * 0.32, y: h * 0.3 },
      bodyB: this.wheelA, stiffness: stiff, damping: damp, length: 28
    });
    this.springB = Matter.Constraint.create({
      bodyA: this.chassis, pointA: { x: w * 0.32, y: h * 0.3 },
      bodyB: this.wheelB, stiffness: stiff, damping: damp, length: 28
    });
    this.axleA = Matter.Constraint.create({
      bodyA: this.chassis, pointA: { x: -w * 0.32, y: h * 0.5 },
      bodyB: this.wheelA, stiffness: 0.4, damping: 0.1, length: 8
    });
    this.axleB = Matter.Constraint.create({
      bodyA: this.chassis, pointA: { x: w * 0.32, y: h * 0.5 },
      bodyB: this.wheelB, stiffness: 0.4, damping: 0.1, length: 8
    });

    Matter.World.add(world, [this.chassis, this.wheelA, this.wheelB, this.springA, this.springB, this.axleA, this.axleB]);
    this.bodies = [this.chassis, this.wheelA, this.wheelB];
    this.input = { gas: false, brake: false, left: false, right: false };
  }

  update(dt) {
    if (!this.alive) return;
    const chassis = this.chassis;
    this.distance = Math.max(0, chassis.position.x - this.startX);
    this.onGround = Math.abs(this.wheelA.velocity.y) < 1.5 || Math.abs(this.wheelB.velocity.y) < 1.5;

    if (this.input.gas && this.fuel > 0) {
      this.fuel -= 0.035 * dt * 60;
      if (this.fuel < 0) this.fuel = 0;
    }

    if (this.fuel > 0 && this.input.gas) {
      const force = this.stats.power * this.stats.torque;
      const dir = this.input.brake ? -0.4 : 1;
      Matter.Body.applyForce(this.wheelA, this.wheelA.position, { x: Math.cos(chassis.angle) * force * dir, y: Math.sin(chassis.angle) * force * dir });
      Matter.Body.applyForce(this.wheelB, this.wheelB.position, { x: Math.cos(chassis.angle) * force * dir * 0.9, y: Math.sin(chassis.angle) * force * dir * 0.9 });
      if (Math.abs(chassis.velocity.x) > this.stats.maxSpeed) {
        Matter.Body.setVelocity(chassis, { x: Math.sign(chassis.velocity.x) * this.stats.maxSpeed, y: chassis.velocity.y });
      }
    }
    if (this.input.brake && this.onGround) {
      Matter.Body.setVelocity(this.wheelA, { x: this.wheelA.velocity.x * (1 - this.stats.brake * 3), y: this.wheelA.velocity.y });
      Matter.Body.setVelocity(this.wheelB, { x: this.wheelB.velocity.x * (1 - this.stats.brake * 3), y: this.wheelB.velocity.y });
    }

    if (!this.onGround) {
      this.airTime += dt;
      if (this.input.left) Matter.Body.setAngularVelocity(chassis, chassis.angularVelocity - this.stats.airControl);
      if (this.input.right) Matter.Body.setAngularVelocity(chassis, chassis.angularVelocity + this.stats.airControl);
      if (Math.abs(chassis.angularVelocity) > 0.08) this.flipCount += chassis.angularVelocity * dt;
    } else {
      if (this.airTime > 0.6) this.registerTrick('BIG AIR', Math.floor(this.airTime * 200));
      if (Math.abs(this.flipCount) > 5.5) this.registerTrick(this.flipCount > 0 ? 'FRONTFLIP' : 'BACKFLIP', 500);
      else if (Math.abs(this.flipCount) > 2.8) this.registerTrick('HALF FLIP', 200);
      this.airTime = 0;
      this.flipCount = 0;
    }

    if (this.onGround) {
      const angleDeg = ((chassis.angle * 180 / Math.PI) % 360 + 360) % 360;
      if ((angleDeg > 100 && angleDeg < 260) && Math.abs(chassis.velocity.y) > 3) this.crash();
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
  }

  registerTrick(name, points) {
    this.combo++;
    this.comboTimer = 2.5;
    const mult = Math.min(5, 1 + this.combo * 0.25);
    const finalPts = Math.floor(points * mult);
    this.tricks.push({ name, points: finalPts });
    return { name: this.combo > 1 ? `${name} x${this.combo}` : name, points: finalPts };
  }

  crash() {
    if (!this.alive) return;
    this.alive = false;
    Matter.Body.setVelocity(this.chassis, { x: this.chassis.velocity.x * 0.3, y: this.chassis.velocity.y });
  }

  getSpeedKmh() { return Math.abs(this.chassis.velocity.x) * 4.2; }
  getGear() {
    const s = this.getSpeedKmh();
    if (s < 15) return 1;
    if (s < 35) return 2;
    if (s < 55) return 3;
    if (s < 75) return 4;
    return 5;
  }

  draw(ctx, camera) {
    [this.chassis, this.wheelA, this.wheelB].forEach(b => {
      ctx.save();
      ctx.translate(b.position.x - camera.x, b.position.y - camera.y);
      ctx.rotate(b.angle);
      if (b.label === 'chassis') {
        const w = this.data.bodyW || 90;
        const h = this.data.bodyH || 36;
        ctx.fillStyle = this.data.color;
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, 6);
        ctx.fill();
        ctx.fillStyle = 'rgba(20,30,50,0.7)';
        ctx.beginPath();
        ctx.roundRect(-w * 0.15, -h * 0.7, w * 0.45, h * 0.55, 4);
        ctx.fill();
        ctx.fillStyle = '#ffeaa7';
        ctx.fillRect(w / 2 - 6, -6, 8, 10);
      } else {
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12);
          ctx.stroke();
        }
      }
      ctx.restore();
    });
  }

  destroy() {
    this.bodies.forEach(b => Matter.World.remove(this.world, b));
    [this.springA, this.springB, this.axleA, this.axleB].forEach(c => Matter.World.remove(this.world, c));
  }
}
