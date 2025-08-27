struct CanvasSize {
    size: vec2<f32>
};

struct CameraUniforms {
    inverseProjection: mat4x4<f32>,
    inverseView: mat4x4<f32>,
    projection: mat4x4<f32>,
    view: mat4x4<f32>,
    position: vec3<f32>, // Camera position for ray origin
};

struct Sphere {
    center: vec3<f32>,
    radius: f32,
};

@group(0) @binding(0) var<uniform> canvasSize: CanvasSize;
@group(0) @binding(1) var<uniform> camera: CameraUniforms;
@group(0) @binding(2) var<uniform> sphere: Sphere;
@group(0) @binding(3) var<uniform> directionalLight: vec3<f32>; // Directional light direction

@fragment
fn fragmentMain(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    // Convert fragment coordinates to normalized device coordinates (-1 to 1)
    let uv = vec2<f32>(
        (fragCoord.x / canvasSize.size.x) * 2.0 - 1.0,
        -((fragCoord.y / canvasSize.size.y) * 2.0 - 1.0)
    );
    
    // Calculate ray direction
    var rayDirection = calculateRayDirection(uv);

    // Ray origin is camera position
    let rayOrigin = camera.position;
    
    // Perform ray-sphere intersection
    let t = raySphereIntersection(rayOrigin, rayDirection, sphere.center, sphere.radius);

    if (t < 0.0) {
        // Miss - render background (black or gradient)
        return vec4<f32>(0.0, 0.0, 0.0, 1.0);
    } 

    let hitPoint = rayOrigin + rayDirection * t;
    if (!isWithinClipPlanes(hitPoint)) {
        return vec4<f32>(0.0, 0.0, 0.0, 1.0);
    }

    let normalAtHitPoint = calculateSphereNormal(hitPoint, sphere.center);

    let lightIntensity = max(dot(normalAtHitPoint, normalize(-directionalLight)), 0.0);
    let baseColor = vec3<f32>(0.5, 0.5, 1.0); // Gray color for the sphere

    let color = baseColor * lightIntensity;

    // Hit the sphere - render blue
    return vec4<f32>(color, 1.0);
}

fn calculateRayDirection(uv: vec2<f32>) -> vec3<f32> {
    // Transform through inverse projection
    let tar = camera.inverseProjection * vec4<f32>(uv.x, uv.y, 1.0, 1.0);
    
    // Perspective divide and normalize
    let targetNormalized = normalize(tar.xyz / tar.w);
    
    // Transform to world space through inverse view
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
        return -1.0; // No intersection
    }
    
    // Return the nearest intersection
    let t1 = (-b - sqrt(discriminant)) / (2.0 * a);
    let t2 = (-b + sqrt(discriminant)) / (2.0 * a);
    
    if (t1 > 0.0) {
        return t1;
    } else if (t2 > 0.0) {
        return t2;
    } else {
        return -1.0; // Behind the camera
    }
}

fn calculateSphereNormal(hitPoint: vec3<f32>, sphereCenter: vec3<f32>) -> vec3<f32> {
    return normalize(hitPoint - sphereCenter);
}

fn isWithinClipPlanes(worldPoint: vec3<f32>) -> bool {
    // Transform world point through view and projection
    let viewSpacePoint = camera.view * vec4<f32>(worldPoint, 1.0);
    let clipSpacePoint = camera.projection * viewSpacePoint;

    // After perspective divide
    let ndcZ = clipSpacePoint.z / clipSpacePoint.w;
    
    // Check if within NDC Z range [-1, +1]
    return ndcZ >= -1.0 && ndcZ <= 1.0;
}