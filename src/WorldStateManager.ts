import { InputManager, InputState } from "./InputManager"
import { World } from "./world"

export class WorldStateManager {
	world: World
    inputManager: InputManager

	constructor(world: World, inputManager: InputManager) {
		this.world = world
        this.inputManager = inputManager
	}

	resizeEventHandler(canvasWidth: number, canvasHeight: number) {
		this.world.resizeWidthHeight(canvasWidth, canvasHeight)
	}

    updateWorldForNextFrame(deltaTime: number) {
        const inputState = this.inputManager.getInput()
        if (inputState.hasActiveCurrentInput) {
            const camera = this.world.getCamera()
            camera.onUpdate(deltaTime, inputState)
            this.world.updateCameraUniform(camera.inverseProjection, camera.inverseView, camera.position)
        }
        this.inputManager.setLastMousePosition(inputState.curMousePosition)
    }
}
