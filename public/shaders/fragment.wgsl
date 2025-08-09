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
    var color = palette(d + timeSeconds);
    d = sin(d * 8.0 + timeSeconds) / 8.;
    d = abs(d);
    d = pow(0.02/d, 1.7);


    color *= d; // darken the color based on distance

    return vec4f(color, 1.0);
}

fn palette(t: f32) -> vec3f {
    let a: vec3f = vec3f(0.5, 0.5, 0.5);
    let b: vec3f = vec3f(0.5, 0.5, 0.5);
    let c: vec3f = vec3f(1.0, 1.0, 1.0);
    let d: vec3f = vec3f(0.263,0.416,0.557);

    return a + b*cos( 6.28318*(c*t+d) );
}
