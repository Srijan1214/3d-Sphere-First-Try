import { initWebGPU } from "./webgpu"

const canvas = document.querySelector("canvas") as HTMLCanvasElement

window.addEventListener("DOMContentLoaded", () => {
	initWebGPU(canvas)
})
