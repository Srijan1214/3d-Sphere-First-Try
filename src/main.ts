const canvas = document.querySelector("canvas") as HTMLCanvasElement

// WebGPU device initialization
if (!navigator.gpu) {
	throw new Error("WebGPU not supported on this browser.")
}

async function initWebGPU() {
	const adapter = await navigator.gpu.requestAdapter()
	if (!adapter) {
		throw new Error("No appropriate GPUAdapter found.")
	}
	const device = await adapter.requestDevice()
	const context = canvas.getContext("webgpu") as unknown as GPUCanvasContext
	const canvasFormat = navigator.gpu.getPreferredCanvasFormat()

	// Create uniform buffer for canvas size
	const canvasSizeBuffer = device.createBuffer({
		label: "Canvas size buffer",
		size: 8, // 2 x float32
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})
	function updateCanvasSizeBuffer() {
		const size = new Float32Array([canvas.width, canvas.height])
		device.queue.writeBuffer(canvasSizeBuffer, 0, size.buffer)
	}
	function resizeCanvasAndConfigure() {
		canvas.width = window.innerWidth
		canvas.height = window.innerHeight
		context.configure({
			device,
			format: canvasFormat,
			alphaMode: "opaque",
		})
		updateCanvasSizeBuffer()
	}
	window.addEventListener("resize", resizeCanvasAndConfigure)
	resizeCanvasAndConfigure()

	// Load shader code from external file
	const vertexShaderCode = await (await fetch("/shaders/vertex.wgsl")).text()
	const vertexShaderModule = device.createShaderModule({
		label: "Vertex shader",
		code: vertexShaderCode,
	})
	const fragmentShaderCode = await (
		await fetch("/shaders/fragment.wgsl")
	).text()
	const fragmentShaderModule = device.createShaderModule({
		label: "Fragment shader",
		code: fragmentShaderCode,
	})

	const vertexBufferLayout = {
		arrayStride: 8,
		attributes: [
			{
				format: "float32x2",
				offset: 0,
				shaderLocation: 0,
			},
		],
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

	const bindGroup = device.createBindGroup({
		layout: renderPipeline.getBindGroupLayout(0),
		entries: [
			{
				binding: 0,
				resource: { buffer: canvasSizeBuffer },
			},
		],
	})

	// Create vertex buffer with square vertices
	// Coordinates are in clip space (-1 to 1)
	const vertices = new Float32Array([
		-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
	])
	const vertexBuffer = device.createBuffer({
		label: "Render vertices",
		size: vertices.byteLength,
		usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(vertexBuffer, 0, vertices)

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

	function animate() {
		render()
		requestAnimationFrame(animate)
	}
	requestAnimationFrame(animate)
}

initWebGPU()
