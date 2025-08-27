
@group(0) @binding(0) var raytracedTexture: texture_2d<f32>;
@group(0) @binding(1) var raytracedSampler: sampler;

@fragment
fn fragmentMain(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    // Sample the raytraced color from the storage texture
    let texSize = textureDimensions(raytracedTexture);
    let uv = fragCoord.xy / vec2<f32>(texSize);
    let color = textureSampleLevel(raytracedTexture, raytracedSampler, vec2<f32>(uv.x, 1.0 - uv.y), 0.0);
    return color;
}