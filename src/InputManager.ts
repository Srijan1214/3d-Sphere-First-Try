export interface InputState {
	keys: {
		w: boolean
		s: boolean
		a: boolean
		d: boolean
		q: boolean
		e: boolean
	}
	mousePosition: [number, number]
	mouseDown: boolean
}

export class InputManager {
	private input: InputState = {
		keys: { w: false, s: false, a: false, d: false, q: false, e: false },
		mousePosition: [0, 0],
		mouseDown: false,
	}

	private updateCallback: (input: InputState) => void

	constructor(
		canvas: HTMLCanvasElement,
		updateCallback: (input: InputState) => void,
	) {
		this.setupEventListeners(canvas)
		this.updateCallback = updateCallback
	}

	private setupEventListeners(canvas: HTMLCanvasElement) {
		window.addEventListener("keydown", (e) => {
			switch (e.code) {
				case "KeyW":
					this.input.keys.w = true
					break
				case "KeyS":
					this.input.keys.s = true
					break
				case "KeyA":
					this.input.keys.a = true
					break
				case "KeyD":
					this.input.keys.d = true
					break
				case "KeyQ":
					this.input.keys.q = true
					break
				case "KeyE":
					this.input.keys.e = true
					break
			}
            this.updateCallback(this.input)
		})

		window.addEventListener("keyup", (e) => {
			switch (e.code) {
				case "KeyW":
					this.input.keys.w = false
					break
				case "KeyS":
					this.input.keys.s = false
					break
				case "KeyA":
					this.input.keys.a = false
					break
				case "KeyD":
					this.input.keys.d = false
					break
				case "KeyQ":
					this.input.keys.q = false
					break
				case "KeyE":
					this.input.keys.e = false
					break
			}
            this.updateCallback(this.input)
		})

		canvas.addEventListener("mousedown", (e) => {
			if (e.button === 2) {
				// Right mouse button
				this.input.mouseDown = true
                this.updateCallback(this.input)
				canvas.requestPointerLock()
			}
		})

		canvas.addEventListener("mouseup", (e) => {
			if (e.button === 2) {
				this.input.mouseDown = false
                this.updateCallback(this.input)
				document.exitPointerLock()
			}
		})

		canvas.addEventListener("mousemove", (e) => {
			this.input.mousePosition = [e.clientX, e.clientY]
            this.updateCallback(this.input)
		})

		// Disable context menu on right click
		canvas.addEventListener("contextmenu", (e) => e.preventDefault())
	}

	getInput(): InputState {
		return this.input
	}
}
