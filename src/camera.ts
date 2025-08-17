import { mat4, vec3, glm } from "gl-matrix"
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

	// WebGPU specific properties
    private device: GPUDevice
	private rayDirectionsBuffer?: GPUBuffer
	private computePipeline?: GPUComputePipeline
	private uniformBuffer?: GPUBuffer
	private bindGroup?: GPUBindGroup
    private viewportBuffer?: GPUBuffer

	constructor(
		verticalFOV: number = 45.0,
		nearClip: number = 0.1,
		farClip: number = 100.0,
		device: GPUDevice,
		computeShaderModule: GPUShaderModule,
        viewportWidth: number,
        viewportHeight: number 
	) {
		this.verticalFOV = verticalFOV
		this.nearClip = nearClip
		this.farClip = farClip

		this.position = vec3.fromValues(0, 0, 3)
		this.forwardDirection = vec3.fromValues(0, 0, -1)

        this.viewportWidth = viewportWidth
        this.viewportHeight = viewportHeight

		// Initialize matrices
		this.projection = mat4.create()
		this.view = mat4.create()
		this.inverseProjection = mat4.create()
		this.inverseView = mat4.create()

        this.device = device
		this.initializeRayDirectionCompute(device, computeShaderModule)
	}

	onResize(width: number, height: number) {
		if (width === this.viewportWidth && height === this.viewportHeight)
			return

		this.viewportWidth = width
		this.viewportHeight = height

		this.recalculateProjection()
        this.recalculateRayDirections(this.device)
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

	// Add method to trigger ray direction recalculation
	recalculateRayDirections(device: GPUDevice) {
		const commandEncoder = device.createCommandEncoder()
		if (!this.computePipeline || !this.uniformBuffer || !this.bindGroup) {
			console.error("Compute pipeline not initialized")
			return
		}

		// Update uniform buffer with current matrices
		const uniformData = new Float32Array(34) // 2 mat4 matrices = 32 floats
		uniformData.set(this.inverseProjection, 0) // First 16 floats
		uniformData.set(this.inverseView, 16) // Next 16 floats
        uniformData[32] = this.viewportWidth  // Viewport width
        uniformData[33] = this.viewportHeight // Viewport height



		device.queue.writeBuffer(this.uniformBuffer, 0, uniformData)

		// Dispatch compute shader
		const computePass = commandEncoder.beginComputePass()
		computePass.setPipeline(this.computePipeline)
		computePass.setBindGroup(0, this.bindGroup)

		// Dispatch with workgroups to cover all pixels
		const workgroupsX = Math.ceil(this.viewportWidth / 8)
		const workgroupsY = Math.ceil(this.viewportHeight / 8)
		computePass.dispatchWorkgroups(workgroupsX, workgroupsY)
		computePass.end()

        this.device.queue.submit([commandEncoder.finish()])
	}

	// Initialize compute resources
	initializeRayDirectionCompute(
		device: GPUDevice,
		shaderModule: GPUShaderModule
	) {
		// Create uniform buffer for matrices
		this.uniformBuffer = device.createBuffer({
			size: 34 * 4, // 32 floats * 4 bytes
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		})

		// Create storage buffer for ray directions
		this.rayDirectionsBuffer = device.createBuffer({
			size: this.viewportWidth * this.viewportHeight * 3 * 4, // vec3 * 4 bytes per float
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
		})

        // Create viewport uniform buffer
        const viewportBuffer = device.createBuffer({
            size: 8, // 2 floats * 4 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })

        // Update viewport buffer
        const viewportData = new Uint32Array([this.viewportWidth, this.viewportHeight])
        device.queue.writeBuffer(viewportBuffer, 0, viewportData)

		// Create bind group layout
		const bindGroupLayout = device.createBindGroupLayout({
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "uniform" },
				},
				{
					binding: 1,
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "storage", access: "write-only" },
				},
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: "uniform" },
                },
			],
		})

		// Create compute pipeline
		this.computePipeline = device.createComputePipeline({
			layout: device.createPipelineLayout({
				bindGroupLayouts: [bindGroupLayout],
			}),
			compute: {
				module: shaderModule,
				entryPoint: "computeRayDirections",
			},
		})

		// Create bind group
		this.bindGroup = device.createBindGroup({
			layout: bindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: { buffer: this.uniformBuffer },
				},
				{
					binding: 1,
					resource: { buffer: this.rayDirectionsBuffer },
				},
                {
                    binding: 2,
                    resource: { buffer: viewportBuffer },
                },
			],
		})
        this.viewportBuffer = viewportBuffer

	}

	// onUpdateCallback(input: InputState) {
	// 	this.onUpdate(0.0, input)
	// }

	// onUpdate(deltaTime: number, input: InputState) {
	// 	let moved = false

	// 	// Movement
	// 	const speed = 5.0 * deltaTime
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
	// 			const rotationSpeed = 0.003
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
	// 		this.recalculateRayDirections(commandEncoder)
	// 	}

	// 	this.lastMousePosition = [...input.mousePosition]

	// 	if (moved) {
	// 		this.recalculateView()
	// 	}
	// }

	getRayDirectionsBuffer(): GPUBuffer | undefined {
		return this.rayDirectionsBuffer
	}
}
