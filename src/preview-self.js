AFRAME.registerSystem("preview-self", {
  init: function () {
    const camera = new THREE.PerspectiveCamera(10, 1, 0.1, 1000)
    camera.layers.set(10)
    camera.position.z = -2
    camera.updateMatrix()
    const povNode = APP.scene.querySelector("#avatar-pov-node")

    const avatarModelEl = APP.scene.querySelector("#avatar-rig .model")

    avatarModelEl.addEventListener("model-loaded", () => {
      avatarModelEl.object3D.traverse((o) => o.layers.enable(10))
      this.el.sceneEl.object3D.traverse((o) => o.isLight && o.layers.enable(10))
    })

    camera.rotation.y = Math.PI
    camera.updateMatrix()

    const renderTarget = new THREE.WebGLRenderTarget(1024, 1024, {
      format: THREE.RGBAFormat,
    })

    const previewEl = document.createElement("a-entity")

    const material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      map: renderTarget.texture,
      transparent: true,
      alphaTest: 0.5,
      depthTest: false,
    })
    const geometry = new THREE.PlaneGeometry()
    geometry.translate(-0.5, 0.5, 0)
    const screen = new THREE.Mesh(geometry, material)
    screen.renderOrder = 100
    screen.position.set(0, 0, -2)
    screen.updateMatrix()
    previewEl.setObject3D("screen", screen)
    previewEl.setObject3D("faceCam", camera)
    povNode.appendChild(previewEl)

    this.camera = camera
    this.renderTarget = renderTarget
    this.material = material

    window.component = this

    Object.assign(this, { screen, previewEl })

    this.updateRenderTargetNextTick = false

    const fps = 30
    setInterval(() => {
      this.updateRenderTargetNextTick = true
    }, 1000 / fps)
  },
  tick: function () {
    // Position preview origin at bottom right of camera view
    this.screen.position.set(0, 0, -2)
    this.screen.position.applyMatrix4(this.el.sceneEl.camera.projectionMatrix)
    // NDC (Bottom right)
    this.screen.position.x = 1
    this.screen.position.y = -1
    // Unproject back into view space
    this.screen.position.applyMatrix4(
      this.el.sceneEl.camera.projectionMatrixInverse,
    )
    this.screen.updateMatrix()
  },
  tock: function () {
    // Ensure background is transparent
    this.el.sceneEl.object3D.background = null
    if (this.updateRenderTargetNextTick) {
      const renderer = this.el.sceneEl.renderer
      const scene = this.el.sceneEl.object3D

      const tmpOnAfterRender = scene.onAfterRender
      delete scene.onAfterRender

      showPlayerHead()
      renderer.setRenderTarget(this.renderTarget)
      renderer.render(scene, this.camera)
      renderer.setRenderTarget(null)
      scene.onAfterRender = tmpOnAfterRender
      hidePlayerHead()

      this.updateRenderTargetNextTick = false
    }
  },
})

function showPlayerHead() {
  const playerHead = APP.scene.systems["camera-tools"].playerHead
  if (playerHead) {
    playerHead.visible = true
    playerHead.scale.setScalar(1)
    playerHead.updateMatrices(true, true)
    playerHead.updateMatrixWorld(true, true)
  }
}

function hidePlayerHead() {
  const playerHead = APP.scene.systems["camera-tools"].playerHead
  if (playerHead) {
    playerHead.visible = false
    playerHead.scale.setScalar(1e-8)
    playerHead.updateMatrices(true, true)
    playerHead.updateMatrixWorld(true, true)
  }
}
