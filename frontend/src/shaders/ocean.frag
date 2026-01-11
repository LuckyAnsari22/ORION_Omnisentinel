varying vec2 vUv;
varying float vElevation;
uniform vec3 uColorLow;
uniform vec3 uColorHigh;

void main() {
    float mixStrength = (vElevation + 0.8) / 1.6;
    vec3 color = mix(uColorLow, uColorHigh, mixStrength);
    
    // Add a slight "depth" shimmer
    color += pow(vUv.y, 2.0) * 0.1;
    
    gl_FragColor = vec4(color, 0.4); // Semi-transparent for overlay
}
