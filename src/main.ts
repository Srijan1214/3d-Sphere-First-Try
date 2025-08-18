import { InputManager } from "./InputManager"
import { WebGpuManager } from "./webGpuManager"
import { World } from "./world"

const canvas = document.querySelector("canvas") as HTMLCanvasElement
const webGpuManager = new WebGpuManager(canvas)
const world = new World();
// const inputManager = new InputManager(canvas, world.onUpdateCallback.bind(world))

function resizeCanvasAndConfigure() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    world.onResizeCallback(canvas.clientWidth, canvas.clientHeight)
    webGpuManager.resizeCanvas()
}
window.addEventListener("resize", resizeCanvasAndConfigure)

window.addEventListener("DOMContentLoaded", async () => {
    await webGpuManager.initialize()
    const computeShaderModule = webGpuManager.getComputeShaderModule();
    const renderer = webGpuManager.getRenderer()

    if (computeShaderModule && renderer) {
        world.createCamera(webGpuManager.getDevice(), computeShaderModule, canvas.clientWidth, canvas.clientHeight);
        renderer?.updateUniforms(canvas.clientWidth, canvas.clientHeight, world.camera.inverseProjection, world.camera.inverseView, world.camera.position);
        resizeCanvasAndConfigure()
        renderer.animate();
    } else {
        console.error("Failed to initialize.");
    }
})
