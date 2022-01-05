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
import env from "./env.local"

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
