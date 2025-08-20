import { mat4, vec3 } from "gl-matrix"
import { Camera } from "./camera"
import { InputState } from "./InputManager"

export class World {
	// World properties
	public camera: Camera
	private device: GPUDevice

	private canvasSizeBuffer: GPUBuffer
	private cameraUniformBuffer: GPUBuffer
	private sphereUniformBuffer: GPUBuffer
	private directionalLightUniformBuffer: GPUBuffer

	constructor(
		device: GPUDevice,
		viewportWidth: number,
		viewportHeight: number
	) {
        this.device = device
		this.camera = new Camera(
			45.0,
			0.1,
			100.0,
			viewportWidth,
			viewportHeight
		)
		this.allocateUniformBuffers()
        this.updateCanvasSizeUniform(viewportWidth, viewportHeight)
        this.updateCameraUniform(this.camera.inverseProjection, this.camera.inverseView, this.camera.projection, this.camera.view, this.camera.position)
		this.updateSphereUniform(vec3.fromValues(0, 0, 0), 1.0)
        this.updateDirectionalLightUniform(vec3.fromValues(-1.0, -1.0, -1.0))
	}

	resizeWidthHeight(width: number, height: number) {
		this.camera.onResize(width, height)
        this.updateCanvasSizeUniform(width, height)
	}

	updateCanvasSizeUniform(canvasWidth: number, canvasHeight: number) {
		const canvasSizeData = new Float32Array([canvasWidth, canvasHeight])
		this.device.queue.writeBuffer(this.canvasSizeBuffer, 0, canvasSizeData)
	}

	updateCameraUniform(
		inverseProjection: mat4,
		inverseView: mat4,
		projection: mat4,
		view: mat4,
		cameraPosition: vec3
	) {
		const cameraData = new Float32Array(68) // 4 matrices (64 floats) + position (3 floats) + padding (1 float)
		cameraData.set(inverseProjection, 0)   // Offset 0-15
		cameraData.set(inverseView, 16)         // Offset 16-31
		cameraData.set(projection, 32)          // Offset 32-47
		cameraData.set(view, 48)                // Offset 48-63
		cameraData[64] = cameraPosition[0]      // Position X
		cameraData[65] = cameraPosition[1]      // Position Y
		cameraData[66] = cameraPosition[2]      // Position Z
		// cameraData[67] is padding for alignment
		this.device.queue.writeBuffer(this.cameraUniformBuffer, 0, cameraData)
	}

	private allocateUniformBuffers() {
		// Canvas size buffer
		this.canvasSizeBuffer = this.device.createBuffer({
			size: 8, // 2 floats
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		})

		// Camera uniform buffer (4 matrices + position + padding)
		this.cameraUniformBuffer = this.device.createBuffer({
			size: 68 * 4, // 68 floats * 4 bytes = 272 bytes
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		})

		// Sphere uniform buffer
		this.sphereUniformBuffer = this.device.createBuffer({
			size: 16, // 4 floats (center + radius)
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		})

		// Directional light uniform buffer
		this.directionalLightUniformBuffer = this.device.createBuffer({
			size: 12, // 3 floats (direction)
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		})
	}

	updateSphereUniform(center: vec3, radius: number) {
		// Initialize sphere data (center at origin, radius 1)
		const sphereData = new Float32Array([center[0], center[1], center[2], radius])
		this.device.queue.writeBuffer(this.sphereUniformBuffer, 0, sphereData)
	}

    updateDirectionalLightUniform(direction: vec3) {
		const lightData = new Float32Array([direction[0], direction[1], direction[2]])
		this.device.queue.writeBuffer(this.directionalLightUniformBuffer, 0, lightData)
	}

	getWorldGpuUniformBuffers(): GPUBuffer[] {
		return [
			this.canvasSizeBuffer,
			this.cameraUniformBuffer,
			this.sphereUniformBuffer,
            this.directionalLightUniformBuffer
		]
	}

    getCamera(): Camera {
		return this.camera
	}
}
