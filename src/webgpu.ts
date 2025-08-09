/// <reference types="@webgpu/types" />
import { loadShader } from "./shaders"
import { createUniformBuffer, updateUniformBuffer } from "./buffers"

export async function initWebGPU(canvas: HTMLCanvasElement) {
	if (!navigator.gpu) throw new Error("WebGPU not supported.")

	const adapter = await navigator.gpu.requestAdapter()
	if (!adapter) throw new Error("No GPUAdapter found.")
	const device = await adapter.requestDevice()
	const context = canvas.getContext("webgpu") as GPUCanvasContext
	const canvasFormat = navigator.gpu.getPreferredCanvasFormat()

	// Buffers
	const canvasSizeBuffer = createUniformBuffer(
		device,
		8,
		"Canvas size buffer"
	)

	function updateCanvasSize() {
		updateUniformBuffer(
			device,
			canvasSizeBuffer,
			new Float32Array([canvas.width, canvas.height])
		)
	}

	function resizeCanvasAndConfigure() {
		canvas.width = window.innerWidth
		canvas.height = window.innerHeight
		context.configure({ device, format: canvasFormat, alphaMode: "opaque" })
		updateCanvasSize()
	}
	window.addEventListener("resize", resizeCanvasAndConfigure)
	resizeCanvasAndConfigure()

	// Shaders
	const vertexShaderModule = await loadShader(
		device,
		"/shaders/vertex.wgsl",
		"Vertex shader"
	)
	const fragmentShaderModule = await loadShader(
		device,
		"/shaders/fragment.wgsl",
		"Fragment shader"
	)

	// Pipeline
	const vertexBufferLayout = {
		arrayStride: 8,
		attributes: [{ format: "float32x2", offset: 0, shaderLocation: 0 }],
	}
	const renderPipeline = device.createRenderPipeline({
		label: "Render pipeline",
		layout: "auto",
		vertex: {
			module: vertexShaderModule,
			entryPoint: "vertexMain",
			buffers: [vertexBufferLayout],
		},
		fragment: {
			module: fragmentShaderModule,
			entryPoint: "fragmentMain",
			targets: [{ format: canvasFormat }],
		},
	})

	const timeBuffer = createUniformBuffer(device, 4, "Time buffer")

	// Bind group
	const bindGroup = device.createBindGroup({
		layout: renderPipeline.getBindGroupLayout(0),
		entries: [
			{ binding: 0, resource: { buffer: canvasSizeBuffer } },
			{ binding: 1, resource: { buffer: timeBuffer } },
		],
	})

	// Vertex buffer
	const vertices = new Float32Array([
		-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
	])
	const vertexBuffer = device.createBuffer({
		label: "Render vertices",
		size: vertices.byteLength,
		usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(vertexBuffer, 0, vertices)

	// Render
	function render() {
		const encoder = device.createCommandEncoder()
		const pass = encoder.beginRenderPass({
			colorAttachments: [
				{
					view: context.getCurrentTexture().createView(),
					loadOp: "clear",
					storeOp: "store",
				},
			],
		})
		pass.setPipeline(renderPipeline)
		pass.setBindGroup(0, bindGroup)
		pass.setVertexBuffer(0, vertexBuffer)
		pass.draw(vertices.length / 2)
		pass.end()
		device.queue.submit([encoder.finish()])
	}

	function updateTime(t: number) {
		updateUniformBuffer(device, timeBuffer, new Float32Array([t]))
	}

	// Animation loop
	function animate(time: number) {
		updateTime(time * 0.001)
		render()
		requestAnimationFrame(animate)
	}
	requestAnimationFrame(animate)
}
