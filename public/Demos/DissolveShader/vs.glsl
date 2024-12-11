uniform bool growFade;
  varying vec2 vUv;
      uniform float brightness;
  void main() {
      vUv = uv;
      if(growFade){
        csm_Position = vec3(csm_Position.x, csm_Position.y, csm_Position.z + (0.004 * brightness));
      }
  }