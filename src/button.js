export function withFaceButton(buttonFn = () => {}) {
  // Add the face button each time the share menu popover appears in <body>
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.querySelector("h5")?.textContent === "Share") {
          const shareGrid = node.querySelector(
            '[class*="ButtonGridPopover__button-grid-popover"]',
          )
          const faceButton = injectFaceButton(shareGrid)
          buttonFn(faceButton)
        }
      })
    })
  })
  observer.observe(document.body, { childList: true })
}

function injectFaceButton(targetEl) {
  // Should yield a <button> for the React menu
  const reactButton = document.querySelector(
    '[class*="ToolbarButton__accent2"]',
  )

  // Make deep copy so we can re-use the face icon
  const faceButton = reactButton.cloneNode(true)
  const faceLabel = faceButton.querySelector("label")
  faceLabel.innerText = "Face"
  // Make it match the style of the other share buttons
  faceButton.className = targetEl.firstChild.className

  targetEl.appendChild(faceButton)
  return faceButton
}
