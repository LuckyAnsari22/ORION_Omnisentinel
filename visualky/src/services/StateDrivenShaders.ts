/**
 * STATE-DRIVEN SHADERS FOR PERCEPTION ENGINE
 * 
 * These shaders respond to SystemState changes.
 * They are lightweight, procedural, and GPU-efficient.
 * 
 * Architecture:
 * - Vertex shader: handles geometry deformation based on state
 * - Fragment shader: handles lighting and material based on state
 * - No animation loops - all motion is time-based and deterministic
 */

// ====================================
// VERTEX SHADER
// ====================================

export const vertexShader = `
  precision highp float;

  // Uniforms (state-driven)
  uniform float uState;       // 0=IDLE, 1=LISTENING, 2=THINKING, 3=SPEAKING, 4=ERROR
  uniform float uTime;        // Global time
  uniform float uAudioLevel;  // 0-1 audio amplitude
  uniform float uProgress;    // Processing progress 0-1
  uniform bool uReducedMotion;

  // Built-in
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vState;

  // Noise function
  float noise(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }

  // Fbm (fractional Brownian motion)
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 3; i++) {
      value += amplitude * noise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }

  void main() {
    vec3 pos = position;
    vState = uState;
    vNormal = normalize(normalMatrix * normal);
    
    // STATE-SPECIFIC DEFORMATIONS
    
    if (uState < 0.5) {
      // IDLE: Subtle breathing
      float breathing = sin(uTime * 0.5) * 0.02;
      pos += normal * breathing;
      
    } else if (uState < 1.5) {
      // LISTENING: Geometry leans inward
      float leanFactor = 0.15;
      pos.z -= leanFactor;
      
      // Subtle pulsing at audio frequency
      float pulse = uAudioLevel * 0.05;
      pos += normal * pulse;
      
    } else if (uState < 2.5) {
      // THINKING: Increased complexity, rotational drift
      vec3 noise3 = vec3(
        noise(pos + uTime * 0.1),
        noise(pos + uTime * 0.15),
        noise(pos + uTime * 0.12)
      );
      
      float distortion = fbm(pos + uTime * 0.05) * 0.08;
      pos += normal * distortion;
      
    } else if (uState < 3.5) {
      // SPEAKING: Geometry stabilizes, amplitude responsiveness
      float stabilization = mix(0.1, 0.0, uAudioLevel);
      
      // Pulsing synchronized to audio
      float audioPulse = sin(uAudioLevel * 3.14159) * uAudioLevel * 0.1;
      pos += normal * (audioPulse + stabilization);
      
    } else {
      // ERROR: Motion slows, visuals simplify
      float slowBreathe = sin(uTime * 0.2) * 0.01;
      pos += normal * slowBreathe;
    }
    
    // Reduced motion support
    if (uReducedMotion) {
      // Minimize animation
      pos = mix(position, pos, 0.1);
    }
    
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// ====================================
// FRAGMENT SHADER
// ====================================

export const fragmentShader = `
  precision highp float;

  // Uniforms (state-driven)
  uniform float uState;
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uConfidence;
  uniform bool uHighContrast;
  uniform bool uReducedMotion;

  // Varyings
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vState;

  // Color palette (accessible, perceptually distinct)
  const vec3 colorIdle = vec3(0.2, 0.4, 0.7);           // Calm blue
  const vec3 colorListening = vec3(0.4, 0.7, 1.0);      // Bright blue
  const vec3 colorThinking = vec3(0.7, 0.5, 1.0);       // Purple
  const vec3 colorSpeaking = vec3(1.0, 0.6, 0.3);       // Warm orange
  const vec3 colorError = vec3(1.0, 0.4, 0.4);          // Soft red

  // Get base color based on state
  vec3 getStateColor(float state) {
    if (state < 0.5) return colorIdle;
    if (state < 1.5) return colorListening;
    if (state < 2.5) return colorThinking;
    if (state < 3.5) return colorSpeaking;
    return colorError;
  }

  // Get emissive multiplier based on state
  float getEmissiveness(float state, float audioLevel) {
    if (state < 0.5) return 0.3;           // IDLE
    if (state < 1.5) return 0.5;           // LISTENING
    if (state < 2.5) return 0.4;           // THINKING
    if (state < 3.5) {                     // SPEAKING
      return 0.3 + (sin(audioLevel * 6.28) * 0.5 + 0.5) * 0.7;
    }
    return 0.2;                            // ERROR
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 baseColor = getStateColor(vState);
    
    // High contrast mode
    if (uHighContrast) {
      baseColor = mix(baseColor, vec3(1.0), 0.3);
    }

    // Lighting model
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float diffuse = max(dot(normal, lightDir), 0.0) * 0.6 + 0.4;
    
    // Emissiveness (driven by state)
    float emissiveness = getEmissiveness(vState, uAudioLevel);
    
    // Fresnel effect for depth
    vec3 viewDir = normalize(-vPosition);
    float fresnel = pow(1.0 - dot(normal, viewDir), 3.0) * 0.3;
    
    // Combine lighting
    vec3 litColor = baseColor * diffuse;
    vec3 emissive = baseColor * emissiveness;
    vec3 finalColor = mix(litColor, emissive, 0.7) + fresnel * 0.2;
    
    // Confidence-based brightness
    finalColor *= 0.8 + (uConfidence * 0.4);
    
    // Apply reduced motion (darken slightly if enabled)
    if (uReducedMotion) {
      finalColor *= 0.95;
    }
    
    gl_FragColor = vec4(finalColor, 0.9);
  }
`;

/**
 * Shader uniforms that should be updated each frame
 */
export interface ShaderUniforms {
  uState: number;          // 0-4 for state
  uTime: number;           // Global time
  uAudioLevel: number;     // 0-1
  uProgress: number;       // 0-1
  uConfidence: number;     // 0-1
  uReducedMotion: boolean;
  uHighContrast: boolean;
}

/**
 * Create uniform object from system state
 */
export const createShaderUniforms = (
  state: number,
  time: number,
  audioLevel: number,
  progress: number,
  confidence: number,
  reducedMotion: boolean,
  highContrast: boolean
): ShaderUniforms => {
  return {
    uState: state,
    uTime: time,
    uAudioLevel: audioLevel,
    uProgress: progress,
    uConfidence: confidence,
    uReducedMotion: reducedMotion,
    uHighContrast: highContrast,
  };
};
