// Torque Rush - Save Manager

const SAVE_KEY = 'torque_rush_save_v1';

const DEFAULT_SAVE = {
  coins: 150,
  xp: 0,
  level: 1,
  selectedVehicle: 'buggy',
  unlockedVehicles: ['buggy'],
  upgrades: {},
  completedStages: {},
  bestDistances: {},
  bestScores: {},
  settings: { sound: true, music: true }
};

let saveData = null;

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      saveData = { ...DEFAULT_SAVE, ...JSON.parse(raw) };
      saveData.upgrades = saveData.upgrades || {};
      saveData.completedStages = saveData.completedStages || {};
      saveData.bestDistances = saveData.bestDistances || {};
      saveData.bestScores = saveData.bestScores || {};
      saveData.unlockedVehicles = saveData.unlockedVehicles || ['buggy'];
    } else {
      saveData = JSON.parse(JSON.stringify(DEFAULT_SAVE));
    }
  } catch (e) {
    saveData = JSON.parse(JSON.stringify(DEFAULT_SAVE));
  }
  return saveData;
}

function writeSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(saveData)); } catch (e) {}
}

function addCoins(n) { saveData.coins += n; writeSave(); }
function spendCoins(n) {
  if (saveData.coins < n) return false;
  saveData.coins -= n; writeSave(); return true;
}
function addXP(n) {
  saveData.xp += n;
  const needed = saveData.level * 200;
  if (saveData.xp >= needed) { saveData.xp -= needed; saveData.level++; }
  writeSave();
}
function unlockVehicle(id) {
  if (!saveData.unlockedVehicles.includes(id)) {
    saveData.unlockedVehicles.push(id); writeSave();
  }
}
function isVehicleUnlocked(id) { return saveData.unlockedVehicles.includes(id); }
function getUpgradeLevel(vehicleId, upgradeId) {
  return (saveData.upgrades[vehicleId] || {})[upgradeId] || 0;
}
function doUpgrade(vehicleId, upgradeId) {
  if (!saveData.upgrades[vehicleId]) saveData.upgrades[vehicleId] = {};
  const cur = saveData.upgrades[vehicleId][upgradeId] || 0;
  const type = UPGRADE_TYPES.find(u => u.id === upgradeId);
  if (!type || cur >= type.max) return false;
  const cost = upgradeCost(upgradeId, cur);
  if (!spendCoins(cost)) return false;
  saveData.upgrades[vehicleId][upgradeId] = cur + 1;
  writeSave(); return true;
}
function completeStage(mapId, stageIdx, distance, score, coinsEarned) {
  const key = `${mapId}_${stageIdx}`;
  if (!saveData.completedStages[key]) saveData.completedStages[key] = true;
  const prevDist = saveData.bestDistances[key] || 0;
  if (distance > prevDist) saveData.bestDistances[key] = Math.floor(distance);
  const prevScore = saveData.bestScores[key] || 0;
  if (score > prevScore) saveData.bestScores[key] = score;
  addCoins(coinsEarned);
  addXP(Math.floor(distance / 10) + Math.floor(score / 50));
  writeSave();
}
function isStageUnlocked(mapId, stageIdx) {
  if (stageIdx === 0) return true;
  return !!saveData.completedStages[`${mapId}_${stageIdx - 1}`];
}
function isMapUnlocked(map) {
  return Object.keys(saveData.completedStages).length >= map.unlock;
}
function getSave() { return saveData; }
