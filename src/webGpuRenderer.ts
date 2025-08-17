import { Camera } from "./camera"
import { InputState } from "./InputManager"

export class WebGPURenderer {
	private device: GPUDevice
    private canvasContext: GPUCanvasContext
	private vertexBuffer: GPUBuffer
	private renderPipeline: GPURenderPipeline

    private canvasSizeBuffer: GPUBuffer;
    private canvasSizeBindGroup: GPUBindGroup;


	private vertices = new Float32Array([
		-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
	])


	constructor(
		device: GPUDevice,
		canvasContext: GPUCanvasContext,
		renderPipeline: GPURenderPipeline
	) {
		this.device = device
        this.canvasContext = canvasContext
		this.renderPipeline = renderPipeline
		this.vertexBuffer = device.createBuffer({
			label: "Render vertices",
			size: this.vertices.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
		})

		device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices)

        // Create canvas size uniform buffer
        this.canvasSizeBuffer = this.device.createBuffer({
            size: 8, // 2 floats * 4 bytes = 8 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // Create bind group layout for canvas size
        const canvasSizeBindGroupLayout = this.renderPipeline.getBindGroupLayout(0)
        // Create bind group
        this.canvasSizeBindGroup = this.device.createBindGroup({
            layout: canvasSizeBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.canvasSizeBuffer }
                }
            ]
        });

        // Update canvas size initially
        this.updateCanvasSize();
	}

    updateCanvasSize() {
        // Get canvas dimensions directly from the canvas element
        const width = 1880
        const height = 1070

        console.log(width, height)
        
        // Or you can use client dimensions:
        // const width = this.canvas.clientWidth;
        // const height = this.canvas.clientHeight;
        
        const canvasSizeData = new Float32Array([width, height]);
        this.device.queue.writeBuffer(this.canvasSizeBuffer, 0, canvasSizeData);
    }

	onResizeCallback(width: number, height: number) {
        this.updateCanvasSize()
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
        pass.setBindGroup(0, this.canvasSizeBindGroup); // Bind canvas size
		pass.setVertexBuffer(0, this.vertexBuffer)
		pass.draw(this.vertices.length / 2)
		pass.end()
		this.device.queue.submit([encoder.finish()])
	}

	// Animation loop
	animate() {
		this.render()
		requestAnimationFrame((t) => this.animate())
	}
}
