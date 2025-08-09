struct CanvasSize {
    size: vec2<f32>
};
@group(0) @binding(0) var<uniform> canvasSize: CanvasSize;

struct Time {
    value: f32
};
@group(0) @binding(1) var<uniform> time: Time;

@fragment
fn fragmentMain(@location(0) pos: vec2f) -> @location(0) vec4f {
    var timeSeconds =  time.value;
    var posAdjusted = pos;
    posAdjusted.x = posAdjusted.x * canvasSize.size.x/ canvasSize.size.y;

    var d = distance(posAdjusted, vec2f(0, 0));
    d = sin(d*28 + timeSeconds);
    d = step(0.3, d);

    return vec4f(d, d, d, 1.0);
}
