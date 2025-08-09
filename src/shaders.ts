/// <reference types="@webgpu/types" />
export async function loadShader(
	device: GPUDevice,
	url: string,
	label: string
) {
	const code = await (await fetch(url)).text()
	return device.createShaderModule({ label, code })
}
