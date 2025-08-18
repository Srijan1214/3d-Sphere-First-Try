import { mat4, vec3 } from "gl-matrix"
import { Camera } from "./camera"
import { InputState } from "./InputManager"

export class WebGPURenderer {
	private device: GPUDevice
    private canvasContext: GPUCanvasContext
	private vertexBuffer: GPUBuffer
	private renderPipeline: GPURenderPipeline

    private canvasSizeBuffer: GPUBuffer;
    private cameraUniformBuffer: GPUBuffer;
    private sphereUniformBuffer: GPUBuffer;
    private renderBindGroup: GPUBindGroup;


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

        this.initializeRenderUniforms()

	}

    private initializeRenderUniforms() {
        // Canvas size buffer
        this.canvasSizeBuffer = this.device.createBuffer({
            size: 8, // 2 floats
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // Camera uniform buffer (matrices + position)
        this.cameraUniformBuffer = this.device.createBuffer({
            size: 36 * 4, // 35 floats * 4 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // Sphere uniform buffer
        this.sphereUniformBuffer = this.device.createBuffer({
            size: 16, // 4 floats (center + radius)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // Initialize sphere data (center at origin, radius 1)
        const sphereData = new Float32Array([0.0, 0.0, 0.0, 1.0]); // center (0,0,0), radius 1
        this.device.queue.writeBuffer(this.sphereUniformBuffer, 0, sphereData);

        // Get bind group layout from pipeline
        const bindGroupLayout = this.renderPipeline.getBindGroupLayout(0);

        // Create bind group
        this.renderBindGroup = this.device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.canvasSizeBuffer } },
                { binding: 1, resource: { buffer: this.cameraUniformBuffer } },
                { binding: 2, resource: { buffer: this.sphereUniformBuffer } }
            ]
        });

    }

    updateUniforms(canvasWidth: number, canvasHeight: number, inverseProjection: mat4, inverseView: mat4, cameraPosition: vec3) {
        // Update canvas size
        const canvasSizeData = new Float32Array([canvasWidth, canvasHeight]);
        this.device.queue.writeBuffer(this.canvasSizeBuffer, 0, canvasSizeData);

        // Update camera data
        const cameraData = new Float32Array(35);
        cameraData.set(inverseProjection, 0);
        cameraData.set(inverseView, 16);
        cameraData[32] = cameraPosition[0];
        cameraData[33] = cameraPosition[1];
        cameraData[34] = cameraPosition[2];
        this.device.queue.writeBuffer(this.cameraUniformBuffer, 0, cameraData);
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
        pass.setBindGroup(0, this.renderBindGroup); // Bind canvas size
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
