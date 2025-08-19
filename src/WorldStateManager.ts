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
			this.world.updateCameraUniform(
				camera.inverseProjection,
				camera.inverseView,
				camera.position
			)
		}
		this.inputManager.setLastMousePosition(inputState.curMousePosition)
	}

	controlPanelUpdateDirectionalLight(
		lightDirection: [number, number, number]
	) {
		const directionVec = new Float32Array(lightDirection)
		this.world.updateDirectionalLightUniform(directionVec)
	}

	controlPanelUpdateSphere(center: [number, number, number], radius: number) {
		const centerVec = new Float32Array(center)
		this.world.updateSphereUniform(centerVec, radius)
	}

	controlPanelUpdateCameraProps(
		verticalFOV: number,
		nearClip: number,
		farClip: number
	) {
		this.world
			.getCamera()
			.updateCameraProperties(verticalFOV, nearClip, farClip)
		const camera = this.world.getCamera()
		this.world.updateCameraUniform(
			camera.inverseProjection,
			camera.inverseView,
			camera.position
		)
	}
}
