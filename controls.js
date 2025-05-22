// src/controls.js
import * as THREE from 'three';

export class PlayerControls {
  constructor(player, salaSize, collidables = []) {
    this.player = player;
    this.salaSize = salaSize;
    this.collidables = collidables;

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.velocity = new THREE.Vector3();
    this.speed = 10;
    this.clock = new THREE.Clock();

    this._initListeners();
  }

  _initListeners() {
    window.addEventListener('keydown', e => {
      switch (e.code) {
        case 'ArrowUp':    this.moveForward  = true; break;
        case 'ArrowDown':  this.moveBackward = true; break;
        case 'ArrowLeft':  this.moveLeft     = true; break;
        case 'ArrowRight': this.moveRight    = true; break;
        case 'KeyG':       this.player.rotation.y += THREE.MathUtils.degToRad(45); break;
      }
    });

    window.addEventListener('keyup', e => {
      switch (e.code) {
        case 'ArrowUp':    this.moveForward  = false; break;
        case 'ArrowDown':  this.moveBackward = false; break;
        case 'ArrowLeft':  this.moveLeft     = false; break;
        case 'ArrowRight': this.moveRight    = false; break;
      }
    });
  }

  update() {
    const delta = Math.min(0.1, this.clock.getDelta());
    this.velocity.set(0, 0, 0);

    if (this.moveForward)  this.velocity.z -= this.speed * delta;
    if (this.moveBackward) this.velocity.z += this.speed * delta;
    if (this.moveLeft)     this.velocity.x -= this.speed * delta;
    if (this.moveRight)    this.velocity.x += this.speed * delta;

    const newPos = this.player.position.clone().add(this.velocity);
    const limit = this.salaSize;

    newPos.x = THREE.MathUtils.clamp(newPos.x, -limit, +limit);
    newPos.z = THREE.MathUtils.clamp(newPos.z, -limit, +limit);

    const playerBox = new THREE.Box3().setFromCenterAndSize(
      newPos,
      new THREE.Vector3(1, 1, 1)
    );

    let collision = false;
    for (const mesh of this.collidables) {
      const box = new THREE.Box3().setFromObject(mesh);
      if (box.intersectsBox(playerBox)) {
        collision = true;
        break;
      }
    }

    if (!collision) {
      this.player.position.copy(newPos);
    }
  }
}
