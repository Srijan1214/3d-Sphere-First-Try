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
			device,
			viewportWidth,
			viewportHeight
		)
		this.allocateUniformBuffers()
        this.updateCanvasSizeUniform(viewportWidth, viewportHeight)
        this.updateCameraUniform(this.camera.inverseProjection, this.camera.inverseView, this.camera.position)
		this.updateSphereUniform(vec3.fromValues(0, 0, 0), 1.0)
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
		cameraPosition: vec3
	) {
		const cameraData = new Float32Array(35)
		cameraData.set(inverseProjection, 0)
		cameraData.set(inverseView, 16)
		cameraData[32] = cameraPosition[0]
		cameraData[33] = cameraPosition[1]
		cameraData[34] = cameraPosition[2]
		this.device.queue.writeBuffer(this.cameraUniformBuffer, 0, cameraData)
	}

	private allocateUniformBuffers() {
		// Canvas size buffer
		this.canvasSizeBuffer = this.device.createBuffer({
			size: 8, // 2 floats
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		})

		// Camera uniform buffer (matrices + position)
		this.cameraUniformBuffer = this.device.createBuffer({
			size: 36 * 4, // 35 floats * 4 bytes
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		})

		// Sphere uniform buffer
		this.sphereUniformBuffer = this.device.createBuffer({
			size: 16, // 4 floats (center + radius)
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		})
	}

	updateSphereUniform(center: vec3, radius: number) {
		// Initialize sphere data (center at origin, radius 1)
		const sphereData = new Float32Array([center[0], center[1], center[2], radius])
		this.device.queue.writeBuffer(this.sphereUniformBuffer, 0, sphereData)
	}

	getWorldGpuUniformBuffers(): GPUBuffer[] {
		return [
			this.canvasSizeBuffer,
			this.cameraUniformBuffer,
			this.sphereUniformBuffer,
		]
	}

    getCamera(): Camera {
		return this.camera
	}
}
