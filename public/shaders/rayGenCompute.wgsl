struct CanvasSize {
    size: vec2<f32>
};

struct CameraUniforms {
    inverseProjection: mat4x4<f32>,
    inverseView: mat4x4<f32>,
    projection: mat4x4<f32>,
    view: mat4x4<f32>,
    position: vec3<f32>,
};

struct Sphere {
    center: vec3<f32>,
    radius: f32,
};

@group(0) @binding(0) var outputTex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1) var<uniform> canvasSize: CanvasSize;
@group(0) @binding(2) var<uniform> camera: CameraUniforms;
@group(0) @binding(3) var<uniform> sphere: Sphere;
@group(0) @binding(4) var<uniform> directionalLight: vec3<f32>;
// Output image (rgba8unorm storage texture)

fn calculateRayDirection(uv: vec2<f32>) -> vec3<f32> {
    let tar = camera.inverseProjection * vec4<f32>(uv.x, uv.y, 1.0, 1.0);
    let targetNormalized = normalize(tar.xyz / tar.w);
    let rayDirection = (camera.inverseView * vec4<f32>(targetNormalized, 0.0)).xyz;
    return normalize(rayDirection);
}

fn raySphereIntersection(rayOrigin: vec3<f32>, rayDirection: vec3<f32>, sphereCenter: vec3<f32>, sphereRadius: f32) -> f32 {
    let oc = rayOrigin - sphereCenter;
    let a = dot(rayDirection, rayDirection);
    let b = 2.0 * dot(oc, rayDirection);
    let c = dot(oc, oc) - sphereRadius * sphereRadius;
    let discriminant = b * b - 4.0 * a * c;
    if (discriminant < 0.0) {
        return -1.0;
    }
    let t1 = (-b - sqrt(discriminant)) / (2.0 * a);
    let t2 = (-b + sqrt(discriminant)) / (2.0 * a);
    if (t1 > 0.0) {
        return t1;
    } else if (t2 > 0.0) {
        return t2;
    } else {
        return -1.0;
    }
}

fn calculateSphereNormal(hitPoint: vec3<f32>, sphereCenter: vec3<f32>) -> vec3<f32> {
    return normalize(hitPoint - sphereCenter);
}

fn isWithinClipPlanes(worldPoint: vec3<f32>) -> bool {
    let viewSpacePoint = camera.view * vec4<f32>(worldPoint, 1.0);
    let clipSpacePoint = camera.projection * viewSpacePoint;
    let ndcZ = clipSpacePoint.z / clipSpacePoint.w;
    return ndcZ >= -1.0 && ndcZ <= 1.0;
}

// --- Pipeline-style functions ---

fn missShader() -> vec4<f32> {
    // Background color (black)
    return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}

fn closestHitShader(hitPoint: vec3<f32>, normal: vec3<f32>) -> vec4<f32> {
    let lightIntensity = max(dot(normal, normalize(-directionalLight)), 0.0);
    let baseColor = vec3<f32>(0.5, 0.5, 1.0);
    let color = baseColor * lightIntensity;
    return vec4<f32>(color, 1.0);
}

fn rayGenShader(pixel: vec2<u32>) -> vec4<f32> {
    let uv = vec2<f32>(
        (f32(pixel.x) / canvasSize.size.x) * 2.0 - 1.0,
        ((f32(pixel.y) / canvasSize.size.y) * 2.0 - 1.0)
    );
    let rayOrigin = camera.position;
    let rayDirection = calculateRayDirection(uv);

    let t = raySphereIntersection(rayOrigin, rayDirection, sphere.center, sphere.radius);

    if (t < 0.0) {
        return missShader();
    }

    let hitPoint = rayOrigin + rayDirection * t;
    if (!isWithinClipPlanes(hitPoint)) {
        return missShader();
    }

    let normal = calculateSphereNormal(hitPoint, sphere.center);
    return closestHitShader(hitPoint, normal);
}

// --- Compute entry point ---

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    if (global_id.x >= u32(canvasSize.size.x) || global_id.y >= u32(canvasSize.size.y)) {
        return;
    }
    let color = rayGenShader(global_id.xy);
    textureStore(outputTex, vec2<i32>(global_id.xy), color);
}