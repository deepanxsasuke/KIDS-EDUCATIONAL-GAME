import Phaser from 'phaser';

import BootScene from './scenes/BootScene.js';
import HomeScene from './scenes/HomeScene.js';
import PatternScene from './scenes/PatternScene.js';
import MoneyScene from './scenes/MoneyScene.js';
import TimeScene from './scenes/TimeScene.js';
import ChoiceScene from './scenes/ChoiceScene.js';
import SplashScene from './scenes/SplashScene.js';

const W = window.innerWidth;
const H = window.innerHeight;

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: W,
    height: H
  },
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, SplashScene, HomeScene, PatternScene, MoneyScene, TimeScene, ChoiceScene]
};

const game = new Phaser.Game(config);
export default game;
