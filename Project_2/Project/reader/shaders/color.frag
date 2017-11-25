#ifdef GL_ES
precision highp float;
#endif
 
uniform float redFactor;
uniform float greenFactor;
uniform float blueFactor;
uniform float timeFactor;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;


void main() {

	vec4 texture = texture2D(uSampler, vTextureCoord);
	vec4 color = vec4(redFactor,greenFactor,blueFactor, 1.0);

	vec4 finalColor=mix(texture, color, timeFactor*0.5);

	gl_FragColor=finalColor;
}