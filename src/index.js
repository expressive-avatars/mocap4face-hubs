import {
  ApplicationContext,
  FacemojiAPI,
  FaceTracker,
  FPS,
  Logger,
  LogLevel,
  Quaternion,
  ResourceFileSystem,
  Vec2,
} from "@facemoji/mocap4face"
import env from "../env.local"
import { startMediaStream } from "./media-stream"

AFRAME.registerSystem("facemoji", {
  init: function () {
    const context = new ApplicationContext(
      "https://cdn.jsdelivr.net/npm/@facemoji/mocap4face@0.2.0",
    )
    const fs = new ResourceFileSystem(context)

    // Initialize the API and activate API key
    // Note that without an API key the SDK works only for a short period of time
    FacemojiAPI.initialize(env.API_KEY, context).then((activated) => {
      if (activated) {
        console.info("API successfully activated")
      } else {
        console.info("API could not be activated")
      }
    })

    const asyncTracker = FaceTracker.createVideoTracker(fs)
      .then((tracker) => {
        console.log("Started tracking")
        window.tracker = tracker
        return tracker
      })
      .logError("Could not start tracking")

    const videoEl = document.createElement("video")
    videoEl.autoplay = true

    // Instance properties
    this.tracking = false
    this.videoEl = videoEl
    this.asyncTracker = asyncTracker
  },
  startTracking: async function () {
    startMediaStream((stream) => {
      this.videoEl.srcObject = stream
      console.log("got stream")
      this.tracking = true
    })
  },
  tick: function () {
    if (this.tracking) {
      const tracker = this.asyncTracker.currentValue
      const lastResult = tracker.track(this.videoEl)
      if (lastResult) {
        const blendShapesObject = Object.fromEntries(lastResult.blendshapes)
        const quaternionArray = lastResult.rotationQuaternion.asList().toArray()
        window.blendShapesObject = blendShapesObject
        window.quaternionArray = quaternionArray
      }
    }
  },
})
