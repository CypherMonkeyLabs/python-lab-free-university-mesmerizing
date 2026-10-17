/* Shared aurora backdrop shader (one of the two allowed shaders; under 40 lines). */
export function makeAurora(T, accent, far = 30) {
  const mat = new T.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uA: { value: new T.Color(accent) }, uB: { value: new T.Color("#4b2a9b") } },
    vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `precision mediump float;varying vec2 vUv;uniform float uTime;uniform vec3 uA;uniform vec3 uB;
      void main(){
        float w=sin(vUv.x*6.+uTime*.35)*.08+sin(vUv.x*13.-uTime*.22)*.04;
        float band=smoothstep(.0,.35,1.-abs(vUv.y-.62-w)*2.2);
        float band2=smoothstep(.0,.3,1.-abs(vUv.y-.42+w*1.4)*2.6);
        vec3 base=mix(vec3(.04,.05,.12),uB*.35,vUv.y);
        vec3 col=base+uA*band*.55+uB*band2*.5;
        gl_FragColor=vec4(col,1.);}`,
    depthWrite: false,
  });
  const mesh = new T.Mesh(new T.PlaneGeometry(far * 4.2, far * 1.9), mat);
  mesh.position.z = -far; mesh.renderOrder = -1;
  return { mesh, update(t) { mat.uniforms.uTime.value = t; } };
}
