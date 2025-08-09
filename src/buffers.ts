/// <reference types="@webgpu/types" />
export function createUniformBuffer(
	device: GPUDevice,
	size: number,
	label: string
) {
	return device.createBuffer({
		label,
		size,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})
}

export function updateUniformBuffer(
	device: GPUDevice,
	buffer: GPUBuffer,
	data: Float32Array
) {
	device.queue.writeBuffer(buffer, 0, data.buffer)
}
