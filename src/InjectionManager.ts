import { InputManager } from "./InputManager"
import { WebGpuManager } from "./webGpuManager"
import { World } from "./world"
import {WorldStateManager} from "./WorldStateManager"
import { Camera } from "./camera"

export const initMain = async () => {
	const canvas = document.querySelector("canvas") as HTMLCanvasElement
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
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
	const renderer = webGpuManager.getWorldRenderer(world, worldStateManager.updateWorldForNextFrame.bind(worldStateManager))

    // Listen for window resize events
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        worldStateManager.resizeEventHandler(canvas.clientWidth, canvas.clientHeight)
    })

	if (!renderer) {
		console.error("Failed to initialize.")
		return
	}
	renderer.animate(Date.now())
}
