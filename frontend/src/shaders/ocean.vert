varying vec2 vUv;
varying float vElevation;
uniform float uTime;

void main() {
    vUv = uv;
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    
    // Low-frequency waves for organic feel
    float elevation = sin(modelPosition.x * 0.2 + uTime * 0.5) * 
                      cos(modelPosition.z * 0.15 + uTime * 0.3) * 0.8;
                      
    // High-frequency detail
    elevation += sin(modelPosition.x * 1.5 + uTime * 0.8) * 0.1;
    
    modelPosition.y += elevation;
    vElevation = elevation;

    gl_Position = projectionMatrix * viewMatrix * modelPosition;
}
