import { Camera } from "./camera"
import { InputState } from "./InputManager"

export class World {
    // World properties
    public camera: Camera | undefined

    constructor() {
    }

    createCamera(device: GPUDevice, computeShaderModule: GPUShaderModule, viewportWidth: number, viewportHeight: number) {
        this.camera = new Camera(45.0, 0.1, 100.0, device, computeShaderModule, viewportWidth, viewportHeight)
    }

    onResizeCallback(width: number, height: number) {
        this.camera?.onResize(width, height)
    }

    onUpdateCallback(input: InputState) {
        this.camera?.onUpdate(0.0, input)
    }
}