import { World } from "./world"

export class WebGPURenderer {
	private device: GPUDevice
	private canvasContext: GPUCanvasContext
	private vertexBuffer: GPUBuffer
	private renderPipeline: GPURenderPipeline
	private computePipeline: GPUComputePipeline
	private storageTexture: GPUTexture
	private renderBindGroup: GPUBindGroup
	private computeBindGroup: GPUBindGroup
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
		computePipeline: GPUComputePipeline,
		storageTexture: GPUTexture,
		world: World,
		timeStepInputHandler: (deltaTime: number) => void
	) {
		this.device = device
		this.canvasContext = canvasContext
		this.renderPipeline = renderPipeline
		this.computePipeline = computePipeline
		this.storageTexture = storageTexture
		this.world = world
		this.vertexBuffer = device.createBuffer({
			label: "Render vertices",
			size: this.vertices.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
		})
		device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices)

		// Create a sampler for the storage texture
		const sampler = this.device.createSampler({
			magFilter: "linear",
			minFilter: "linear",
		})

		// Create bind group for render pass (storage texture as sampled texture + sampler)
		this.renderBindGroup = this.device.createBindGroup({
			layout: this.renderPipeline.getBindGroupLayout(0),
			entries: [
				{
					binding: 0,
					resource: this.storageTexture.createView(),
				},
				{
					binding: 1,
					resource: sampler,
				},
				// ...existing code for other uniforms if needed...
			],
		})

		// Create bind group for compute pass (all uniforms + storage texture as writeable)
		const uniformBuffers = this.world.getWorldGpuUniformBuffers()
		// Storage texture at binding 0
		const computeEntries: GPUBindGroupEntry[] = [
			{
				binding: 0,
				resource: this.storageTexture.createView(),
			},
			...uniformBuffers.map((gpuBuffer: GPUBuffer, index: number) => ({
				binding: index + 1,
				resource: { buffer: gpuBuffer },
			})),
		]
		this.computeBindGroup = this.device.createBindGroup({
			layout: this.computePipeline.getBindGroupLayout(0),
			entries: computeEntries,
		})

		this.lastFrameTime = Date.now()
		this.timeStepInputHandler = timeStepInputHandler
	}

	// Render
	render() {
		const encoder = this.device.createCommandEncoder()

		// --- Compute pass: run ray tracing and write to storage texture ---
		const computePass = encoder.beginComputePass()
		computePass.setPipeline(this.computePipeline)
		computePass.setBindGroup(0, this.computeBindGroup)
		// Dispatch enough workgroups to cover the canvas
		const width = this.world.camera.viewportWidth
		const height = this.world.camera.viewportHeight
		computePass.dispatchWorkgroups(
			Math.ceil(width / 8),
			Math.ceil(height / 8)
		)
		computePass.end()

		// --- Render pass: sample from storage texture and display ---
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
		pass.setBindGroup(0, this.renderBindGroup)
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
