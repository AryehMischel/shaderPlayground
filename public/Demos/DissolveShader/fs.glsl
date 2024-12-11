  uniform bool dim;
  uniform float brightness;
  uniform float thickness;
  uniform bool growFade;
  uniform float time;
  uniform vec3 edgeColor; // Declare the uniform
  varying vec2 vUv;
  uniform float threshold;
  uniform sampler2D noiseTexture; //alpha noise texture for diffuse effect
      void main() {


        vec3 noise = texture2D(noiseTexture, vUv).rgb;
        float dissolve = noise.g;


        if (dissolve < threshold) {
          discard;
        }
       float edge = threshold + (thickness / 100.0);

        if(threshold > 0.1){

        if (dissolve < edge ) {

           csm_Emissive = edgeColor * 20.0;

        } else{


      }

    }
      csm_UnlitFac =  csm_UnlitFac;

  }