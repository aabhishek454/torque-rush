// Torque Rush - Game Data (Original)

const VEHICLES = [
  {
    id: 'buggy', name: 'Starter Buggy', unlockCost: 0,
    base: { power: 0.012, maxSpeed: 18, torque: 0.8, weight: 1.0, grip: 0.7, suspension: 0.55, airControl: 0.04, fuelCap: 100, brake: 0.025 },
    color: '#3a7bd5', bodyW: 90, bodyH: 36
  },
  {
    id: 'rally', name: 'Ridge Runner', unlockCost: 800,
    base: { power: 0.016, maxSpeed: 22, torque: 0.95, weight: 1.1, grip: 0.8, suspension: 0.6, airControl: 0.05, fuelCap: 110, brake: 0.03 },
    color: '#e74c3c', bodyW: 95, bodyH: 34
  },
  {
    id: 'monster', name: 'Titan Crusher', unlockCost: 2500,
    base: { power: 0.02, maxSpeed: 16, torque: 1.3, weight: 1.6, grip: 0.9, suspension: 0.75, airControl: 0.035, fuelCap: 130, brake: 0.035 },
    color: '#27ae60', bodyW: 110, bodyH: 48
  },
  {
    id: 'sport', name: 'Aero Spike', unlockCost: 5000,
    base: { power: 0.024, maxSpeed: 28, torque: 0.85, weight: 0.85, grip: 0.65, suspension: 0.45, airControl: 0.07, fuelCap: 90, brake: 0.04 },
    color: '#f39c12', bodyW: 100, bodyH: 30
  },
  {
    id: 'rover', name: 'Lunar Crawler', unlockCost: 9000,
    base: { power: 0.018, maxSpeed: 20, torque: 1.1, weight: 1.3, grip: 0.85, suspension: 0.8, airControl: 0.055, fuelCap: 150, brake: 0.028 },
    color: '#9b59b6', bodyW: 105, bodyH: 42
  }
];

const UPGRADE_TYPES = [
  { id: 'engine', name: 'Engine', max: 5, costBase: 150, effect: 'power' },
  { id: 'suspension', name: 'Suspension', max: 5, costBase: 120, effect: 'suspension' },
  { id: 'tires', name: 'Tires', max: 5, costBase: 100, effect: 'grip' },
  { id: 'drivetrain', name: '4WD', max: 3, costBase: 200, effect: 'torque' },
  { id: 'fuel', name: 'Fuel Tank', max: 5, costBase: 130, effect: 'fuelCap' },
  { id: 'brakes', name: 'Brakes', max: 4, costBase: 110, effect: 'brake' }
];

const MAPS = [
  { id: 'greenhills', name: 'Green Hills', icon: '🌿', unlock: 0, color: '#2ecc71', sky: ['#87CEEB', '#98D8C8'], ground: '#3d8b4f', stages: 5, difficulty: 1 },
  { id: 'desert', name: 'Desert Canyon', icon: '🏜️', unlock: 3, color: '#e67e22', sky: ['#F4A460', '#DEB887'], ground: '#c9a66b', stages: 5, difficulty: 2 },
  { id: 'snow', name: 'Snow Mountains', icon: '❄️', unlock: 8, color: '#3498db', sky: ['#B0C4DE', '#E0F0FF'], ground: '#d6eaf8', stages: 5, difficulty: 3 },
  { id: 'forest', name: 'Forest Valley', icon: '🌲', unlock: 15, color: '#27ae60', sky: ['#2C3E50', '#1A3A2A'], ground: '#1e4d2b', stages: 5, difficulty: 3 },
  { id: 'volcano', name: 'Volcano Ridge', icon: '🌋', unlock: 25, color: '#c0392b', sky: ['#2C1810', '#5C3317'], ground: '#3d2314', stages: 5, difficulty: 4 },
  { id: 'moon', name: 'Lunar Crater', icon: '🌙', unlock: 40, color: '#95a5a6', sky: ['#0a0a1a', '#1a1a2e'], ground: '#5a5a6a', stages: 5, difficulty: 5 }
];

function getVehicleStats(vehicleId, upgrades) {
  const v = VEHICLES.find(x => x.id === vehicleId) || VEHICLES[0];
  const stats = { ...v.base };
  const ups = upgrades[vehicleId] || {};
  UPGRADE_TYPES.forEach(u => {
    const lvl = ups[u.id] || 0;
    if (u.effect === 'power') stats.power += lvl * 0.003;
    if (u.effect === 'suspension') stats.suspension += lvl * 0.06;
    if (u.effect === 'grip') stats.grip += lvl * 0.06;
    if (u.effect === 'torque') stats.torque += lvl * 0.12;
    if (u.effect === 'fuelCap') stats.fuelCap += lvl * 20;
    if (u.effect === 'brake') stats.brake += lvl * 0.008;
  });
  return { ...v, stats };
}

function upgradeCost(typeId, currentLevel) {
  const t = UPGRADE_TYPES.find(x => x.id === typeId);
  if (!t) return 99999;
  return Math.floor(t.costBase * Math.pow(1.55, currentLevel));
}
