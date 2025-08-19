import { mat4, vec3, glm, vec4 } from "gl-matrix"
import { InputState } from "./InputManager"

export class Camera {
	// Camera parameters
	public verticalFOV: number
	public nearClip: number
	public farClip: number

	// Transform
	public position: vec3
	public forwardDirection: vec3

	// Viewport
	public viewportWidth: number = 0
	public viewportHeight: number = 0

	// Matrices (stored as Float32Array for WebGPU)
	public projection: mat4
	public view: mat4
	public inverseProjection: mat4
	public inverseView: mat4

	// Input tracking
	private lastMousePosition: [number, number] = [0, 0]

	constructor(
		verticalFOV: number = 45.0,
		nearClip: number = 0.1,
		farClip: number = 100.0,
		device: GPUDevice,
		viewportWidth: number,
		viewportHeight: number
	) {
		this.verticalFOV = verticalFOV
		this.nearClip = nearClip
		this.farClip = farClip

		this.position = vec3.fromValues(0, 0, 5)
		this.forwardDirection = vec3.fromValues(0, 0, -1)

		this.viewportWidth = viewportWidth
		this.viewportHeight = viewportHeight

		// Initialize matrices
		this.projection = mat4.create()
		this.view = mat4.create()
		this.inverseProjection = mat4.create()
		this.inverseView = mat4.create()

		this.device = device

		this.recalculateView()
		this.recalculateProjection()
	}

	onResize(width: number, height: number) {
		// if (width === this.viewportWidth && height === this.viewportHeight)
		// 	return

		this.viewportWidth = width
		this.viewportHeight = height

		this.recalculateView()
		this.recalculateProjection()
	}

	private recalculateProjection() {
		// Calculate perspective projection similar to glm::perspectiveFov
		const aspect = this.viewportWidth / this.viewportHeight
		const fovRadians = (this.verticalFOV * Math.PI) / 180

		mat4.perspective(
			this.projection,
			fovRadians,
			aspect,
			this.nearClip,
			this.farClip
		)
		mat4.invert(this.inverseProjection, this.projection)
	}

	private recalculateView() {
		const target = vec3.create()
		vec3.add(target, this.position, this.forwardDirection)
		const up = vec3.fromValues(0, 1, 0)

		mat4.lookAt(this.view, this.position, target, up)
		mat4.invert(this.inverseView, this.view)
	}

	onUpdate(deltaTime: number, input: InputState) {
		let moved = false

		// Movement
		const speed = 0.01 * deltaTime
		const upDirection = vec3.fromValues(0, 1, 0)
		const rightDirection = vec3.create()
		vec3.cross(rightDirection, this.forwardDirection, upDirection)

		if (input.keyDownMap.w) {
			const movement = vec3.create()
			vec3.scale(movement, this.forwardDirection, speed)
			vec3.add(this.position, this.position, movement)
			moved = true
		}
		if (input.keyDownMap.s) {
			const movement = vec3.create()
			vec3.scale(movement, this.forwardDirection, -speed)
			vec3.add(this.position, this.position, movement)
			moved = true
		}
		if (input.keyDownMap.a) {
			const movement = vec3.create()
			vec3.scale(movement, rightDirection, -speed)
			vec3.add(this.position, this.position, movement)
			moved = true
		}
		if (input.keyDownMap.d) {
			const movement = vec3.create()
			vec3.scale(movement, rightDirection, speed)
			vec3.add(this.position, this.position, movement)
			moved = true
		}
		if (input.keyDownMap.q) {
			const movement = vec3.create()
			vec3.scale(movement, upDirection, -speed)
			vec3.add(this.position, this.position, movement)
			moved = true
		}
		if (input.keyDownMap.e) {
			const movement = vec3.create()
			vec3.scale(movement, upDirection, speed)
			vec3.add(this.position, this.position, movement)
			moved = true
		}

        const mouseDelta = [input.curMousePosition[0] - input.lastFrameMousePosition[0], input.curMousePosition[1] - input.lastFrameMousePosition[1]]

		// Mouse rotation - use mouseDelta when pointer is locked
		if (input.isMouseRightButtonDown && mouseDelta[0] !== 0 && mouseDelta[1] !== 0) {
            console.log("Mouse delta:", mouseDelta);
			const delta = mouseDelta

			if (delta[0] !== 0 || delta[1] !== 0) {
				const rotationSpeed = 0.0009 // Increased sensitivity for mouse delta
				const pitchDelta = delta[1] * rotationSpeed
				const yawDelta = delta[0] * rotationSpeed

				// Rotate around Y axis (yaw)
				const yawRotation = mat4.create()
				mat4.rotateY(yawRotation, yawRotation, -yawDelta)

				// Rotate around right vector (pitch)
				const pitchRotation = mat4.create()
				mat4.rotate(
					pitchRotation,
					pitchRotation,
					-pitchDelta,
					rightDirection
				)

				// Apply rotations to forward direction
				const rotation = mat4.create()
				mat4.multiply(rotation, yawRotation, pitchRotation)

				const newForward = vec3.create()
				vec3.transformMat4(newForward, this.forwardDirection, rotation)
				vec3.normalize(this.forwardDirection, newForward)

				moved = true
			}
		}

		if (moved) {
			// Trigger ray direction recalculation
			this.recalculateView()
			this.recalculateProjection()
		}

		// No need to track lastMousePosition when using pointer lock
	}

	// onUpdate(deltaTime: number, input: InputState) {
	// 	let moved = false

	// 	// Movement
	// 	const speed = 0.01 * deltaTime
	// 	const upDirection = vec3.fromValues(0, 1, 0)
	// 	const rightDirection = vec3.create()
	// 	vec3.cross(rightDirection, this.forwardDirection, upDirection)

	// 	if (input.keys.w) {
	// 		const movement = vec3.create()
	// 		vec3.scale(movement, this.forwardDirection, speed)
	// 		vec3.add(this.position, this.position, movement)
	// 		moved = true
	// 	}
	// 	if (input.keys.s) {
	// 		const movement = vec3.create()
	// 		vec3.scale(movement, this.forwardDirection, -speed)
	// 		vec3.add(this.position, this.position, movement)
	// 		moved = true
	// 	}
	// 	if (input.keys.a) {
	// 		const movement = vec3.create()
	// 		vec3.scale(movement, rightDirection, -speed)
	// 		vec3.add(this.position, this.position, movement)
	// 		moved = true
	// 	}
	// 	if (input.keys.d) {
	// 		const movement = vec3.create()
	// 		vec3.scale(movement, rightDirection, speed)
	// 		vec3.add(this.position, this.position, movement)
	// 		moved = true
	// 	}

	// 	// Mouse rotation
	// 	if (input.mouseDown) {
	// 		const delta = [
	// 			input.mousePosition[0] - this.lastMousePosition[0],
	// 			input.mousePosition[1] - this.lastMousePosition[1],
	// 		]

	// 		if (delta[0] !== 0 || delta[1] !== 0) {
	// 			const rotationSpeed = 0.0001
	// 			const pitchDelta = delta[1] * rotationSpeed
	// 			const yawDelta = delta[0] * rotationSpeed

	// 			// Rotate around Y axis (yaw)
	// 			const yawRotation = mat4.create()
	// 			mat4.rotateY(yawRotation, yawRotation, -yawDelta)

	// 			// Rotate around right vector (pitch)
	// 			const pitchRotation = mat4.create()
	// 			mat4.rotate(
	// 				pitchRotation,
	// 				pitchRotation,
	// 				-pitchDelta,
	// 				rightDirection
	// 			)

	// 			// Apply rotations to forward direction
	// 			const rotation = mat4.create()
	// 			mat4.multiply(rotation, yawRotation, pitchRotation)

	// 			const newForward = vec3.create()
	// 			vec3.transformMat4(newForward, this.forwardDirection, rotation)
	// 			vec3.normalize(this.forwardDirection, newForward)

	// 			moved = true
	// 		}
	// 	}

	// 	if (moved) {
	// 		// Trigger ray direction recalculation
	//         this.recalculateView()
	//         this.recalculateProjection()
	// 	}

	// 	this.lastMousePosition = [...input.mousePosition]
	// }
}
