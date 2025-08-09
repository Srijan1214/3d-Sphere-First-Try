import './style.css';

const canvas = document.querySelector('canvas') as HTMLCanvasElement;

// WebGPU device initialization
if (!navigator.gpu) {
    throw new Error('WebGPU not supported on this browser.');
}

async function initWebGPU() {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error('No appropriate GPUAdapter found.');
    }
    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu') as unknown as GPUCanvasContext;
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

    function resizeCanvasAndConfigure() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        context.configure({
            device,
            format: canvasFormat,
            alphaMode: 'opaque',
        });
    }
    window.addEventListener('resize', resizeCanvasAndConfigure);
    resizeCanvasAndConfigure();

    // Load shader code from external file
    const shaderCode = await (await fetch('/shaders/cell.wgsl')).text();
    const cellShaderModule = device.createShaderModule({
        label: 'Cell shader',
        code: shaderCode,
    });

    const vertexBufferLayout = {
        arrayStride: 8,
        attributes: [{
            format: 'float32x2',
            offset: 0,
            shaderLocation: 0,
        }],
    };

    const cellPipeline = device.createRenderPipeline({
        label: 'Cell pipeline',
        layout: 'auto',
        vertex: {
            module: cellShaderModule,
            entryPoint: 'vertexMain',
            buffers: [vertexBufferLayout],
        },
        fragment: {
            module: cellShaderModule,
            entryPoint: 'fragmentMain',
            targets: [{ format: canvasFormat }],
        },
    });

    const vertices = new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1,
    ]);
    const vertexBuffer = device.createBuffer({
        label: 'Cell vertices',
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertices);

    function render() {
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: context.getCurrentTexture().createView(),
                loadOp: 'clear',
                storeOp: 'store',
            }],
        });
        pass.setPipeline(cellPipeline);
        pass.setVertexBuffer(0, vertexBuffer);
        pass.draw(vertices.length / 2);
        pass.end();
        device.queue.submit([encoder.finish()]);
    }

    function animate() {
        device.queue.writeBuffer(vertexBuffer, 0, vertices);
        render();
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

initWebGPU();
