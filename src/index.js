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
import { facemoji2arkit } from "./blendShapes"
import { withFaceButton } from "./button"
import { startMediaStream } from "./media-stream"
import "./preview-self"

AFRAME.registerSystem("facemoji", {
  init: function () {
    this.avatarRig = document.querySelector("#avatar-rig")
    this.faceRoot = this.avatarRig.components["ik-root"].faceTracking

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
        return tracker
      })
      .logError("Could not start tracking")

    const videoEl = document.createElement("video")
    videoEl.autoplay = true

    withFaceButton((button) => {
      button.addEventListener("click", () => this.startTracking())
    })

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
      this.el.sceneEl.systems["preview-self"].enable()
    })
    this.el.sceneEl.addEventListener("action_end_video_sharing", () => {
      this.stopTracking()
    })
  },
  stopTracking: function () {
    this.tracking = false
    this.el.sceneEl.systems["preview-self"].disable()
  },
  tick: function () {
    if (this.tracking) {
      const tracker = this.asyncTracker.currentValue
      const lastResult = tracker.track(this.videoEl)
      if (lastResult) {
        const blendShapesObject = Object.fromEntries(lastResult.blendshapes)
        const quaternionArray = lastResult.rotationQuaternion.asList().toArray()
        this.faceRoot.object3D.quaternion.fromArray(quaternionArray)
        this.avatarRig.components["apply-morph-targets"].applyBlendShapes(
          blendShapesObject,
        )
      }
    }
  },
})

AFRAME.registerComponent("apply-morph-targets", {
  init: function () {
    this.morphTargetsRoot = this.el.querySelector("[morph-targets]")
    this.morphTargetsComponent =
      this.morphTargetsRoot.components["morph-targets"]
    this.skinnedMeshes = []
    this.el.object3D.traverse((obj) => {
      if (
        obj.isSkinnedMesh &&
        ["Wolf3D_Head", "Wolf3D_Teeth"].includes(obj.name)
      ) {
        this.skinnedMeshes.push(obj)
      }
    })

    // Array for reuse
    this.morphTargetInfluences = Array.from(
      this.skinnedMeshes[0].morphTargetInfluences,
    )
  },
  /**
   * Maps facemoji blendshapes into an array of morphTargetInfluences
   * then applies this to the networked morph-targets attribute
   */
  applyBlendShapes: function (facemojiBlendShapes) {
    for (let blendShape in facemojiBlendShapes) {
      this.morphTargetInfluences[
        this.skinnedMeshes[0].morphTargetDictionary[facemoji2arkit[blendShape]]
      ] = facemojiBlendShapes[blendShape]
    }

    this.morphTargetsRoot.setAttribute(
      "morph-targets",
      this.morphTargetInfluences,
    )
  },
  tick: function () {
    for (let skinnedMesh of this.skinnedMeshes) {
      const morphTargetsArray = this.morphTargetsComponent.data ?? []
      for (let i = 0; i < morphTargetsArray.length; ++i) {
        skinnedMesh.morphTargetInfluences[i] = morphTargetsArray[i]
      }
    }
  },
})

// morph-audio-feedback gets attached to every RPM avatar, hook into that
AFRAME.GLTFModelPlus.registerComponent(
  "morph-audio-feedback",
  "morph-audio-feedback",
  (el, componentName, componentData) => {
    console.log("Adding morph-audio-feedback")
    el.setAttribute(componentName, componentData)
    NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
      networkedEl.setAttribute("apply-morph-targets", "")
    })
  },
)
