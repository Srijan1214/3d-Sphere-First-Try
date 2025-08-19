import { WorldStateManager } from "./WorldStateManager"

export interface InputState {
	keyDownMap: {
		w: boolean
		s: boolean
		a: boolean
		d: boolean
		q: boolean
		e: boolean
	}
	isMouseRightButtonDown: boolean
    lastFrameMousePosition: [number, number]
	curMousePosition: [number, number]
    hasActiveCurrentInput: boolean
}

export class InputManager {
	private input: InputState = {
		keyDownMap: { w: false, s: false, a: false, d: false, q: false, e: false },
        isMouseRightButtonDown: false,
        lastFrameMousePosition: [0, 0],
		curMousePosition: [0, 0],
		hasActiveCurrentInput: false,
	}

	constructor(canvas: HTMLCanvasElement) {
		this.setupEventListeners(canvas)
	}

	private hasActiveInput(): boolean {
		// Check if any keys are pressed
		const anyKeyPressed = Object.values(this.input.keyDownMap).some((key) => key)

		return anyKeyPressed || this.input.isMouseRightButtonDown
	}

	private updateWorldInputState() {
        this.input.hasActiveCurrentInput = this.hasActiveInput()
	}

	private setupEventListeners(canvas: HTMLCanvasElement) {
		window.addEventListener("keydown", (e) => {
			switch (e.code) {
				case "KeyW":
					this.input.keyDownMap.w = true
					break
				case "KeyS":
					this.input.keyDownMap.s = true
					break
				case "KeyA":
					this.input.keyDownMap.a = true
					break
				case "KeyD":
					this.input.keyDownMap.d = true
					break
				case "KeyQ":
					this.input.keyDownMap.q = true
					break
				case "KeyE":
					this.input.keyDownMap.e = true
					break
			}
			this.updateWorldInputState()
		})

		window.addEventListener("keyup", (e) => {
			switch (e.code) {
				case "KeyW":
					this.input.keyDownMap.w = false
					break
				case "KeyS":
					this.input.keyDownMap.s = false
					break
				case "KeyA":
					this.input.keyDownMap.a = false
					break
				case "KeyD":
					this.input.keyDownMap.d = false
					break
				case "KeyQ":
					this.input.keyDownMap.q = false
					break
				case "KeyE":
					this.input.keyDownMap.e = false
					break
			}
			this.updateWorldInputState()
		})

		canvas.addEventListener("mousedown", (e) => {
			if (e.button === 0) {
				this.input.isMouseRightButtonDown = true
                this.input.curMousePosition = [e.clientX, e.clientY]
				this.updateWorldInputState()
			}
		})

		canvas.addEventListener("mouseup", (e) => {
			if (e.button === 0) {
				this.input.isMouseRightButtonDown = false
                this.input.curMousePosition = [e.clientX, e.clientY]
				this.updateWorldInputState()
			}
		})

		canvas.addEventListener("mousemove", (e) => {
            this.input.curMousePosition = [e.clientX, e.clientY]
			this.updateWorldInputState()
		})

		// Disable context menu on right click
		canvas.addEventListener("contextmenu", (e) => e.preventDefault())
	}

    setLastMousePosition(position: [number, number]) {
        this.input.lastFrameMousePosition = position
    }

	getInput(): InputState {
		return this.input
	}
}
