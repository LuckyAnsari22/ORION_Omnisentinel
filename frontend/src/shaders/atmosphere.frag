varying vec3 vNormal;
uniform vec3 glowColor;
uniform float coefficient;
uniform float power;

void main() {
  vec3 worldNormal = normalize(vNormal);
  vec3 viewDirection = normalize(cameraPosition - position); // Note: position needs to be world space in a real implementation, but for simple fresnel usually viewDirection comes from vertex.
  // Approximation for standard material fresnel
  vec3 viewDirectionDerived = vec3(0.0, 0.0, 1.0); // Simplification if not passed
  
  // Real Fresnel calculation
  float intensity = pow(coefficient - dot(vNormal, vec3(0, 0, 1)), power);
  
  gl_FragColor = vec4(glowColor, intensity);
}
