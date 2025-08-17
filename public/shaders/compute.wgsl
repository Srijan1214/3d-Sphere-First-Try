struct CameraUniforms {
    inverseProjection: mat4x4<f32>,
    inverseView: mat4x4<f32>,
}

struct RayDirections {
    directions: array<vec3<f32>>,
}

@group(0) @binding(0) var<uniform> camera: CameraUniforms;
@group(0) @binding(1) var<storage, read_write> rayDirections: RayDirections;

// Push constants or additional uniforms for viewport dimensions
@group(0) @binding(2) var<uniform> viewport: vec2<u32>; // width, height

@compute @workgroup_size(8, 8)
fn computeRayDirections(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;
    
    // Check bounds
    if (x >= viewport.x || y >= viewport.y) {
        return;
    }
    
    // Convert pixel coordinates to normalized device coordinates (-1 to 1)
    let coord = vec2<f32>(
        (f32(x) / f32(viewport.x)) * 2.0 - 1.0,
        (f32(y) / f32(viewport.y)) * 2.0 - 1.0
    );
    
    // Transform through inverse projection
    let tar = camera.inverseProjection * vec4<f32>(coord.x, coord.y, 1.0, 1.0);
    
    // Perspective divide and normalize
    let targetNormalized = normalize(tar.xyz / tar.w);
    
    // Transform to world space through inverse view
    let rayDirection = (camera.inverseView * vec4<f32>(targetNormalized, 0.0)).xyz;
    
    // Store result
    let index = x + y * viewport.x;
    rayDirections.directions[index] = rayDirection;
}