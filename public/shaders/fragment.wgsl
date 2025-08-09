struct CanvasSize {
    size: vec2<f32>
};
@group(0) @binding(0) var<uniform> canvasSize: CanvasSize;

@fragment
fn fragmentMain(@location(0) pos: vec2f) -> @location(0) vec4f {
    var posAdjusted = pos;
    posAdjusted.x = posAdjusted.x * canvasSize.size.x/ canvasSize.size.y;
    var d = distance(posAdjusted, vec2f(0, 0));
    return vec4f(0, 0, d, 1.0);
}
