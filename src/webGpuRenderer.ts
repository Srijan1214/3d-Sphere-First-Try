import { World } from "./world"

export class WebGPURenderer {
	private device: GPUDevice
	private canvasContext: GPUCanvasContext
	private vertexBuffer: GPUBuffer
	private renderPipeline: GPURenderPipeline

	private renderBindGroup: GPUBindGroup

	private vertices = new Float32Array([
		-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
	])
	world: World

    private lastFrameTime: number
    private timeStepInputHandler: (deltaTime: number) => void

	constructor(
		device: GPUDevice,
		canvasContext: GPUCanvasContext,
		renderPipeline: GPURenderPipeline,
		world: World,
        timeStepInputHandler: (deltaTime: number) => void
	) {
		this.device = device
		this.canvasContext = canvasContext
		this.renderPipeline = renderPipeline
		this.world = world
		this.vertexBuffer = device.createBuffer({
			label: "Render vertices",
			size: this.vertices.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
		})

		device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices)

		// Create bind group
		this.renderBindGroup = this.device.createBindGroup({
			layout: this.renderPipeline.getBindGroupLayout(0),
			entries: world
				.getWorldGpuUniformBuffers()
				.map((gpuBuffer: GPUBuffer, index: number) => {
					return { binding: index, resource: { buffer: gpuBuffer } }
				}),
		})

        this.lastFrameTime = Date.now()

        this.timeStepInputHandler = timeStepInputHandler
	}

	// Render
	render() {
		const encoder = this.device.createCommandEncoder()
		const pass = encoder.beginRenderPass({
			colorAttachments: [
				{
					view: this.canvasContext.getCurrentTexture().createView(),
					loadOp: "clear",
					storeOp: "store",
				},
			],
		})
		pass.setPipeline(this.renderPipeline)
		pass.setBindGroup(0, this.renderBindGroup) // Bind canvas size
		pass.setVertexBuffer(0, this.vertexBuffer)
		pass.draw(this.vertices.length / 2)
		pass.end()
		this.device.queue.submit([encoder.finish()])
	}

	// Animation loop
	animate(currentFrameTime: number) {
        const deltaTime = currentFrameTime - this.lastFrameTime
        this.lastFrameTime = currentFrameTime

        this.timeStepInputHandler(deltaTime)

		this.render()
		requestAnimationFrame((t) => this.animate(t))
	}
}
