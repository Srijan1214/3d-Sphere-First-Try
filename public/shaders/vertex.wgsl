struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) pos: vec2f,
};

@vertex
fn vertexMain(@location(0) position: vec2f) -> VertexOutput {
    var out: VertexOutput;
    out.position = vec4f(position, 0, 1);
    out.pos = position;
    return out;
}
