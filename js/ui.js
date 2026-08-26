// Torque Rush - UI Manager

class UIManager {
  constructor(game) {
    this.game = game;
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('btnPlay').onclick = () => this.showMaps();
    document.getElementById('btnGarage').onclick = () => this.showGarage();
    document.getElementById('btnMaps').onclick = () => this.showMaps();
    document.getElementById('btnSettings').onclick = () => alert('Settings coming soon');
    document.getElementById('garageBack').onclick = () => this.showMain();
    document.getElementById('mapsBack').onclick = () => this.showMain();
    document.getElementById('stageBack').onclick = () => this.showMaps();
    document.getElementById('btnPause').onclick = () => this.game.pause();
    document.getElementById('btnResume').onclick = () => this.game.resume();
    document.getElementById('btnRestart').onclick = () => this.game.restartStage();
    document.getElementById('btnQuit').onclick = () => this.game.quitToMenu();
    document.getElementById('btnNextStage').onclick = () => this.game.nextStage();
    document.getElementById('btnRetry').onclick = () => this.game.restartStage();
    document.getElementById('btnHome').onclick = () => this.game.quitToMenu();
    this.setupControls();
  }

  setupControls() {
    const gas = document.getElementById('btnGas');
    const brake = document.getElementById('btnBrake');
    const left = document.getElementById('btnTiltLeft');
    const right = document.getElementById('btnTiltRight');
    const set = (key, val) => { if (this.game.vehicle) this.game.vehicle.input[key] = val; };
    const bind = (el, key) => {
      el.addEventListener('pointerdown', e => { e.preventDefault(); el.classList.add('active'); set(key, true); });
      el.addEventListener('pointerup', e => { e.preventDefault(); el.classList.remove('active'); set(key, false); });
      el.addEventListener('pointerleave', () => { el.classList.remove('active'); set(key, false); });
    };
    bind(gas, 'gas'); bind(brake, 'brake'); bind(left, 'left'); bind(right, 'right');
    window.addEventListener('keydown', e => {
      if (!this.game.vehicle) return;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { this.game.vehicle.input.gas = true; gas.classList.add('active'); }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { this.game.vehicle.input.brake = true; brake.classList.add('active'); }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.game.vehicle.input.right = true;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.game.vehicle.input.left = true;
      if (e.code === 'KeyP' || e.code === 'Escape') this.game.togglePause();
    });
    window.addEventListener('keyup', e => {
      if (!this.game.vehicle) return;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { this.game.vehicle.input.gas = false; gas.classList.remove('active'); }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { this.game.vehicle.input.brake = false; brake.classList.remove('active'); }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.game.vehicle.input.right = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.game.vehicle.input.left = false;
    });
  }

  hideAll() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('controls').classList.add('hidden');
    document.getElementById('pauseMenu').classList.add('hidden');
    document.getElementById('resultsScreen').classList.add('hidden');
  }

  showMain() {
    this.hideAll();
    document.getElementById('mainMenu').classList.add('active');
    this.refreshMenuStats();
  }

  refreshMenuStats() {
    const s = getSave();
    document.getElementById('menuCoins').textContent = s.coins;
    document.getElementById('menuXP').textContent = s.xp;
    document.getElementById('menuLevel').textContent = s.level;
  }

  showGarage() {
    this.hideAll();
    document.getElementById('garageScreen').classList.add('active');
    this.renderGarage();
  }

  renderGarage() {
    const s = getSave();
    document.getElementById('garageCoins').textContent = s.coins;
    const list = document.getElementById('vehicleList');
    list.innerHTML = '';
    VEHICLES.forEach(v => {
      const unlocked = isVehicleUnlocked(v.id);
      const card = document.createElement('div');
      card.className = 'vehicle-card' + (s.selectedVehicle === v.id ? ' selected' : '') + (!unlocked ? ' locked' : '');
      card.innerHTML = `<div style="font-size:28px">🚗</div><div class="v-name">${v.name}</div>`;
      if (!unlocked) {
        card.innerHTML += `<div style="font-size:11px;color:#ffd700;margin-top:4px">${v.unlockCost} 🪙</div>`;
        card.onclick = () => {
          if (spendCoins(v.unlockCost)) { unlockVehicle(v.id); s.selectedVehicle = v.id; writeSave(); this.renderGarage(); }
          else alert('Not enough coins!');
        };
      } else {
        card.onclick = () => { s.selectedVehicle = v.id; writeSave(); this.renderGarage(); };
      }
      list.appendChild(card);
    });
    const sel = VEHICLES.find(v => v.id === s.selectedVehicle) || VEHICLES[0];
    document.getElementById('vehicleName').textContent = sel.name;
    document.getElementById('previewCar').style.background = `linear-gradient(135deg, ${sel.color}, #1a2538)`;
    const upList = document.getElementById('upgradesList');
    upList.innerHTML = '';
    UPGRADE_TYPES.forEach(u => {
      const lvl = getUpgradeLevel(s.selectedVehicle, u.id);
      const cost = upgradeCost(u.id, lvl);
      const row = document.createElement('div');
      row.className = 'upgrade-row';
      const can = lvl < u.max && s.coins >= cost;
      row.innerHTML = `<div><div class="u-name">${u.name}</div><div class="u-level">Lv ${lvl}/${u.max}</div></div><button class="u-btn" ${can ? '' : 'disabled'}>${lvl >= u.max ? 'MAX' : cost + ' 🪙'}</button>`;
      if (can) row.querySelector('.u-btn').onclick = () => { if (doUpgrade(s.selectedVehicle, u.id)) this.renderGarage(); };
      upList.appendChild(row);
    });
  }

  showMaps() {
    this.hideAll();
    document.getElementById('mapsScreen').classList.add('active');
    const grid = document.getElementById('mapsGrid');
    grid.innerHTML = '';
    MAPS.forEach(m => {
      const unlocked = isMapUnlocked(m);
      const card = document.createElement('div');
      card.className = 'map-card' + (!unlocked ? ' locked' : '');
      card.innerHTML = `<div class="map-icon">${m.icon}</div><div class="map-name">${m.name}</div><div class="map-info">${unlocked ? m.stages + ' stages' : 'Locked'}</div>`;
      if (unlocked) card.onclick = () => this.showStages(m);
      grid.appendChild(card);
    });
  }

  showStages(map) {
    this.hideAll();
    document.getElementById('stageScreen').classList.add('active');
    document.getElementById('stageMapName').textContent = map.name;
    const list = document.getElementById('stagesList');
    list.innerHTML = '';
    for (let i = 0; i < map.stages; i++) {
      const unlocked = isStageUnlocked(map.id, i);
      const key = `${map.id}_${i}`;
      const best = getSave().bestDistances[key] || 0;
      const card = document.createElement('div');
      card.className = 'stage-card' + (!unlocked ? ' locked' : '');
      card.innerHTML = `<div class="s-num">${i + 1}</div><div class="s-info"><div class="s-name">Stage ${i + 1}</div><div class="s-req">${unlocked ? (best > 0 ? 'Best: ' + best + 'm' : 'Not played') : 'Complete previous'}</div></div><div class="s-stars">${best > 400 ? '★★★' : best > 250 ? '★★' : best > 100 ? '★' : ''}</div>`;
      if (unlocked) card.onclick = () => this.game.startStage(map, i);
      list.appendChild(card);
    }
  }

  showHUD() {
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('controls').classList.remove('hidden');
  }

  hideHUD() {
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('controls').classList.add('hidden');
  }

  updateHUD(vehicle) {
    if (!vehicle) return;
    document.getElementById('hudDist').textContent = Math.floor(vehicle.distance);
    document.getElementById('hudCoins').textContent = vehicle.coinsCollected;
    document.getElementById('speedValue').textContent = Math.floor(vehicle.getSpeedKmh());
    document.getElementById('gearDisplay').textContent = 'G' + vehicle.getGear();
    document.getElementById('fuelFill').style.width = (vehicle.fuel / vehicle.maxFuel) * 100 + '%';
  }

  showTrick(text) {
    const el = document.getElementById('trickPopup');
    el.textContent = text;
    el.classList.remove('hidden');
    clearTimeout(this._trickTimer);
    this._trickTimer = setTimeout(() => el.classList.add('hidden'), 900);
  }

  showPause() {
    document.getElementById('pauseMenu').classList.remove('hidden');
    document.getElementById('pauseMenu').classList.add('active');
  }

  hidePause() {
    document.getElementById('pauseMenu').classList.add('hidden');
    document.getElementById('pauseMenu').classList.remove('active');
  }

  showResults(data) {
    document.getElementById('resultsScreen').classList.remove('hidden');
    document.getElementById('resultsScreen').classList.add('active');
    document.getElementById('resultsTitle').textContent = data.crashed ? 'CRASHED' : 'STAGE COMPLETE';
    document.getElementById('resDist').textContent = Math.floor(data.distance) + 'm';
    document.getElementById('resCoins').textContent = data.coins;
    document.getElementById('resXP').textContent = data.xp;
    document.getElementById('resScore').textContent = data.score;
    document.getElementById('resTricks').textContent = data.tricks.map(t => t.name).join(' · ') || 'No tricks';
  }

  hideResults() {
    document.getElementById('resultsScreen').classList.add('hidden');
    document.getElementById('resultsScreen').classList.remove('active');
  }

  hideLoading() {
    document.getElementById('loading').classList.remove('active');
    document.getElementById('loading').style.display = 'none';
  }
}
