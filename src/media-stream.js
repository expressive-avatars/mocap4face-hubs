/**
 * Adapted from scene-entry-manager.js
 * https://github.com/mozilla/hubs/blob/8daaf285911f6fda35d723fc7a3a10ff93e07d3b/src/scene-entry-manager.js
 */
export function startMediaStream(onSuccess = () => {}, onError = () => {}) {
  const shareSuccess = (isDisplayMedia, isVideoTrackAdded, target) => {
    if (isVideoTrackAdded) {
      console.log("video track added")
    }
    APP.scene.emit("share_video_enabled", {
      source: isDisplayMedia ? "screen" : "camera",
    })
    APP.scene.addState("sharing_video")
    onSuccess(APP.mediaDevicesManager.mediaStream)
  }

  const shareError = (error) => {
    console.error(error)
    this.scene.emit("share_video_failed")
    onError(error)
  }

  // Placeholder
  const isIOS = false

  const constraints = {
    video: {
      width: isIOS ? { max: 1280 } : { max: 1280, ideal: 720 },
      frameRate: 30,
    },
    //TODO: Capture audio from camera?
  }

  // check preferences
  const store = window.APP.store
  const preferredCamera = store.state.preferences.preferredCamera || "default"
  switch (preferredCamera) {
    case "default":
      constraints.video.mediaSource = "camera"
      break
    case "user":
    case "environment":
      constraints.video.facingMode = preferredCamera
      break
    default:
      constraints.video.deviceId = preferredCamera
      break
  }

  APP.mediaDevicesManager.startVideoShare(
    constraints,
    false,
    null, // target
    shareSuccess,
    shareError,
  )
}
