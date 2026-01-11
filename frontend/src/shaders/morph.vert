varying vec3 vNormal;
varying vec3 vViewPosition;
uniform float uTime;

void main() {
    vNormal = normalize(normalMatrix * normal);
    
    vec3 pos = position;
    // Breathing/Morphing motion
    float morph = sin(pos.y * 2.0 + uTime) * 0.15;
    morph += cos(pos.x * 2.0 + uTime * 0.8) * 0.1;
    
    pos += normal * morph;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
