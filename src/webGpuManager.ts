/// <reference types="@webgpu/types" />
import { loadShader } from "./shaders"
import { createUniformBuffer, updateUniformBuffer } from "./buffers"
import { WebGPURenderer } from "./webGpuRenderer"
import { World } from "./world"

export class WebGpuManager {
	private device: GPUDevice
	private canvas: HTMLCanvasElement
	private canvasContext: GPUCanvasContext
	private canvasFormat: GPUCanvasFormat
	private vertexShaderModule: GPUShaderModule | undefined
	private fragmentShaderModule: GPUShaderModule | undefined
	private computeShaderModule: GPUShaderModule | undefined
	private renderer: WebGPURenderer | undefined

	static async initialize(canvas: HTMLCanvasElement): Promise<WebGpuManager> {
		const instance = new WebGpuManager()
		await instance.initWebGPU(canvas)
		return instance
	}

	async initWebGPU(canvas: HTMLCanvasElement) {
		if (!navigator.gpu) throw new Error("WebGPU not supported.")

		const adapter = await navigator.gpu.requestAdapter()
		if (!adapter) throw new Error("No GPUAdapter found.")
		this.device = await adapter.requestDevice()
		this.canvasFormat = navigator.gpu.getPreferredCanvasFormat()

		// Shaders
		this.vertexShaderModule = await loadShader(
			this.device,
			"/shaders/vertex.wgsl",
			"Vertex shader"
		)
		this.fragmentShaderModule = await loadShader(
			this.device,
			"/shaders/fragment.wgsl",
			"Fragment shader"
		)
		this.computeShaderModule = await loadShader(
			this.device,
			"/shaders/compute.wgsl",
			"compute shader"
		)

		this.canvasContext = canvas.getContext("webgpu") as GPUCanvasContext
		this.canvasContext.configure({
			device: this.device,
			format: this.canvasFormat,
			alphaMode: "opaque",
		})
	}

	getWorldRenderer(world: World,
        timeStepInputHandler: (deltaTime: number) => void
    ): WebGPURenderer {
		// Pipeline
		const vertexBufferLayout = {
			arrayStride: 8,
			attributes: [{ format: "float32x2", offset: 0, shaderLocation: 0 }],
		}
		const renderPipeline = this.device.createRenderPipeline({
			label: "Render pipeline",
			layout: "auto",
			vertex: {
				module: this.vertexShaderModule,
				entryPoint: "vertexMain",
				buffers: [vertexBufferLayout],
			},
			fragment: {
				module: this.fragmentShaderModule,
				entryPoint: "fragmentMain",
				targets: [{ format: this.canvasFormat }],
			},
		})
		this.renderer = new WebGPURenderer(
			this.device,
			this.canvasContext,
			renderPipeline,
            world,
            timeStepInputHandler
		)
		return this.renderer
	}

	getDevice(): GPUDevice {
		return this.device
	}

	getVertexShaderModule(): GPUShaderModule | undefined {
		return this.vertexShaderModule
	}

	getFragmentShaderModule(): GPUShaderModule | undefined {
		return this.fragmentShaderModule
	}

	getComputeShaderModule(): GPUShaderModule | undefined {
		return this.computeShaderModule
	}

	getRenderer(): WebGPURenderer | undefined {
		return this.renderer
	}
}
