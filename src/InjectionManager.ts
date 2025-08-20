import { InputManager } from "./InputManager"
import { WebGpuManager } from "./webGpuManager"
import { World } from "./world"
import { WorldStateManager } from "./WorldStateManager"
import { Camera } from "./camera"

function setupControlPanelListeners(worldStateManager: WorldStateManager) {
	// FOV slider
	const fovSlider = document.getElementById("fov") as HTMLInputElement
	const fovValue = document.getElementById("fov-value") as HTMLSpanElement

	// Near and Far clip inputs
	const nearClipInput = document.getElementById(
		"near-clip"
	) as HTMLInputElement
	const farClipInput = document.getElementById("far-clip") as HTMLInputElement

	// Helper function to get current camera values
	const updateCameraProps = () => {
		worldStateManager.controlPanelUpdateCameraProps(
			fovSlider.valueAsNumber,
			nearClipInput.valueAsNumber,
			farClipInput.valueAsNumber
		)
	}

	fovSlider.addEventListener("input", (e) => {
		const value = (e.target as HTMLInputElement).value
		fovValue.textContent = `${value}°`
		updateCameraProps()
	})

	// Near clip input
	nearClipInput.addEventListener("input", (e) => {
		updateCameraProps()
	})

	// Far clip input
	farClipInput.addEventListener("input", (e) => {
		updateCameraProps()
	})

	// Sphere radius slider
	const radiusSlider = document.getElementById(
		"sphere-radius"
	) as HTMLInputElement
	const radiusValue = document.getElementById(
		"radius-value"
	) as HTMLSpanElement

	// Sphere position inputs
	const sphereXInput = document.getElementById("sphere-x") as HTMLInputElement
	const sphereYInput = document.getElementById("sphere-y") as HTMLInputElement
	const sphereZInput = document.getElementById("sphere-z") as HTMLInputElement

	// Helper function to get current sphere values
	const updateSphere = () => {
		const position: [number, number, number] = [
			sphereXInput.valueAsNumber,
			sphereYInput.valueAsNumber,
			sphereZInput.valueAsNumber
		]
		worldStateManager.controlPanelUpdateSphere(
			position,
			radiusSlider.valueAsNumber
		)
	}

	radiusSlider.addEventListener("input", (e) => {
		const value = (e.target as HTMLInputElement).value
		radiusValue.textContent = value
		updateSphere()
	})

	// Sphere position inputs
	sphereXInput.addEventListener("input", (e) => {
		updateSphere()
	})

	sphereYInput.addEventListener("input", (e) => {
		updateSphere()
	})

	sphereZInput.addEventListener("input", (e) => {
		updateSphere()
	})

	// Light direction sliders
	const lightXSlider = document.getElementById("light-x") as HTMLInputElement
	const lightYSlider = document.getElementById("light-y") as HTMLInputElement
	const lightZSlider = document.getElementById("light-z") as HTMLInputElement

	const getLightDirectionValue: () => [number, number, number] = () => [
		parseFloat(lightXSlider.value),
		parseFloat(lightYSlider.value),
		parseFloat(lightZSlider.value),
	]

	lightXSlider.addEventListener("input", (e) => {
		const value = (e.target as HTMLInputElement).value
		document.getElementById("light-x-value")!.textContent = value
		worldStateManager.controlPanelUpdateDirectionalLight(
			getLightDirectionValue()
		)
	})

	lightYSlider.addEventListener("input", (e) => {
		const value = (e.target as HTMLInputElement).value
		document.getElementById("light-y-value")!.textContent = value
		worldStateManager.controlPanelUpdateDirectionalLight(
			getLightDirectionValue()
		)
	})

	lightZSlider.addEventListener("input", (e) => {
		const value = (e.target as HTMLInputElement).value
		document.getElementById("light-z-value")!.textContent = value
		worldStateManager.controlPanelUpdateDirectionalLight(
			getLightDirectionValue()
		)
	})
}

export const initMain = async () => {
	const canvas = document.querySelector("canvas") as HTMLCanvasElement
	const canvasContainer = canvas.parentElement as HTMLElement

	canvas.width = canvasContainer.clientWidth
	canvas.height = canvasContainer.clientHeight
	const webGpuManager = await WebGpuManager.initialize(canvas)
	if (!webGpuManager) {
		console.error("Failed to initialize.")
		return
	}
	const world = new World(
		webGpuManager.getDevice(),
		canvas.clientWidth,
		canvas.clientHeight
	)

	const inputManager = new InputManager(canvas)
	const worldStateManager = new WorldStateManager(world, inputManager)
	setupControlPanelListeners(worldStateManager)

	// Camera info overlay DOM elements
	const cameraPosX = document.getElementById("camera-pos-x")
	const cameraPosY = document.getElementById("camera-pos-y")
	const cameraPosZ = document.getElementById("camera-pos-z")
	const cameraDirX = document.getElementById("camera-dir-x")
	const cameraDirY = document.getElementById("camera-dir-y")
	const cameraDirZ = document.getElementById("camera-dir-z")

	// Patch the renderer's animate loop to update overlay
	const renderer = webGpuManager.getWorldRenderer(
		world,
		function patchedUpdateWorldForNextFrame(deltaTime) {
			worldStateManager.updateWorldForNextFrame(deltaTime)
			// Update camera overlay
			const camera = world.getCamera()
			if (cameraPosX && cameraPosY && cameraPosZ && cameraDirX && cameraDirY && cameraDirZ) {
				cameraPosX.textContent = `x: ${camera.position[0].toFixed(2)}`
				cameraPosY.textContent = `y: ${camera.position[1].toFixed(2)}`
				cameraPosZ.textContent = `z: ${camera.position[2].toFixed(2)}`
				cameraDirX.textContent = `x: ${camera.forwardDirection[0].toFixed(2)}`
				cameraDirY.textContent = `y: ${camera.forwardDirection[1].toFixed(2)}`
				cameraDirZ.textContent = `z: ${camera.forwardDirection[2].toFixed(2)}`
			}
		}
	)

	// Listen for window resize events
	window.addEventListener("resize", () => {
		canvas.width = window.innerWidth
		canvas.height = window.innerHeight
		worldStateManager.resizeEventHandler(
			canvas.clientWidth,
			canvas.clientHeight
		)
	})

	if (!renderer) {
		console.error("Failed to initialize.")
		return
	}
	renderer.animate(Date.now())
}
