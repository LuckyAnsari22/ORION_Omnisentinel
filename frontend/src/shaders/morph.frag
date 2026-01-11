varying vec3 vNormal;
varying vec3 vViewPosition;
uniform vec3 uColor;

void main() {
    float fresnel = pow(1.0 - dot(vNormal, normalize(vViewPosition)), 3.0);
    
    vec3 lightColor = uColor;
    vec3 finalColor = mix(lightColor * 0.2, lightColor, fresnel);
    
    // Add internal core glow
    float pulse = sin(vViewPosition.z * 0.1) * 0.1 + 0.9;
    
    gl_FragColor = vec4(finalColor * pulse, 0.85);
}
