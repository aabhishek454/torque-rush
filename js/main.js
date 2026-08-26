// Torque Rush - Entry Point

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const game = new Game();
    game.init();
    window.game = game;
  }, 300);
});
