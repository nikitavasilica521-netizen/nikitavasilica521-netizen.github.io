/* Turnul Dragonului: the night intro (a dragon crosses the moon and lands on the tower) and the estate model (day / night, numbered places with real photographs). three.js r134 + UnrealBloomPass. */
(() => {
  const { $, $$, T } = BF;
  const lin = (h) => new THREE.Color(h).convertSRGBToLinear();
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const noise = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return (hash(ix, iy) * (1 - u) + hash(ix + 1, iy) * u) * (1 - v) + (hash(ix, iy + 1) * (1 - u) + hash(ix + 1, iy + 1) * u) * v; };
  const fbm = (x, y) => { let s = 0, a = .5; for (let i = 0; i < 5; i++) { s += a * noise(x, y); x = x * 2.03 + 1.7; y = y * 2.03 + 9.2; a *= .5; } return s; };

  /* ---------- shared builders ---------- */
  /* a round stone tower of instanced blocks, with a parapet of merlons */
  function stoneTower({ R = 2, H = 12, rows = 28, N = 22, depth = .55, base = '#8f8474', seed = 1 }) {
    const g = new THREE.Group();
    const bh = H / rows, total = rows * N + N;
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: .92, metalness: 0 }), total);
    const d = new THREE.Object3D(), c = new THREE.Color(), b = lin(base); let k = 0;
    for (let r = 0; r < rows; r++) for (let i = 0; i < N; i++) {
      const a = (i + (r % 2) * .5) / N * Math.PI * 2, w = 2 * Math.PI * R / N * (.95 + hash(r, i + seed) * .07);
      d.position.set(Math.cos(a) * R, r * bh + bh / 2, Math.sin(a) * R); d.rotation.set(0, -a + Math.PI / 2, 0);
      d.scale.set(w, bh * (.93 + hash(i, r * 3) * .06), depth * (.9 + hash(r * 7, i) * .25)); d.updateMatrix(); im.setMatrixAt(k, d.matrix);
      const v = .78 + hash(i * 3 + seed, r * 5) * .36; c.copy(b).multiplyScalar(v); c.offsetHSL((hash(r, i * 2) - .5) * .02, 0, 0); im.setColorAt(k++, c);
    }
    /* parapet: a ring a little wider, merlons on every other slot */
    const PR = R * 1.08, PN = 12;
    for (let i = 0; i < PN * 2; i++) {
      if (i % 2) continue; const a = i / (PN * 2) * Math.PI * 2, w = 2 * Math.PI * PR / (PN * 2) * .95;
      d.position.set(Math.cos(a) * PR, H + bh * 1.5, Math.sin(a) * PR); d.rotation.set(0, -a + Math.PI / 2, 0); d.scale.set(w, bh * 3, depth); d.updateMatrix(); im.setMatrixAt(k, d.matrix); c.copy(b).multiplyScalar(.9 + hash(i, 99) * .2); im.setColorAt(k++, c);
    }
    im.count = k; im.castShadow = im.receiveShadow = true; g.add(im);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(R * .97, R * .97, H, 40), new THREE.MeshStandardMaterial({ color: lin('#2b2621'), roughness: 1 })); core.position.y = H / 2; g.add(core);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(PR * 1.02, R, bh * 1.2, 40, 1, true), new THREE.MeshStandardMaterial({ color: b.clone().multiplyScalar(.85), roughness: .9, side: THREE.DoubleSide })); ring.position.y = H + bh * .1; g.add(ring);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(PR, 40), new THREE.MeshStandardMaterial({ color: lin('#4a4038'), roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.y = H + bh * .6; g.add(floor);
    g.userData = { R, H, PR, top: H + bh * .6 };
    return g;
  }

  /* a dragon: a swept body that undulates, a head with horns, two scalloped wings hinged at the shoulder */
  function makeDragon({ body = '#10141f', wing = '#161b29', rough = .55 } = {}) {
    const g = new THREE.Group();
    const bodyM = new THREE.MeshStandardMaterial({ color: lin(body), roughness: rough, metalness: .15 });
    const wingM = new THREE.MeshStandardMaterial({ color: lin(wing), roughness: .7, side: THREE.DoubleSide });
    const S = 64, RS = 10; const pos = new Float32Array(S * RS * 3); const idx = [];
    for (let i = 0; i < S - 1; i++) for (let j = 0; j < RS; j++) { const a = i * RS + j, b2 = i * RS + (j + 1) % RS, c = (i + 1) * RS + j, d = (i + 1) * RS + (j + 1) % RS; idx.push(a, c, b2, b2, c, d); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, bodyM); mesh.castShadow = true; g.add(mesh);
    const radius = (s) => s < .55 ? .02 + Math.pow(s / .55, 1.6) * .5 : s < .8 ? .52 - (s - .55) / .25 * .3 : s < .9 ? .22 + (s - .8) / .1 * .08 : .3 - (s - .9) / .1 * .22;
    const spine = (s, t, mode) => {
      const x = -6.2 + s * 9.6;
      const sway = mode === 'perch' ? .05 : .28;
      const y = Math.sin(t * 2.3 - s * 7) * sway * (1 - s) + (s > .78 ? (s - .78) * (mode === 'perch' ? 2.4 : 1.2) : 0) - (s < .3 && mode === 'perch' ? (.3 - s) * 2.2 : 0);
      const z = Math.sin(t * 1.7 - s * 5) * .35 * (1 - s) * (mode === 'perch' ? .3 : 1);
      return new THREE.Vector3(x, y, z);
    };
    const tmp = new THREE.Vector3(), nrm = new THREE.Vector3(), bin = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const update = (t, mode) => {
      for (let i = 0; i < S; i++) {
        const s = i / (S - 1), p = spine(s, t, mode), q = spine(Math.min(1, s + .01), t, mode);
        tmp.subVectors(q, p).normalize(); bin.crossVectors(tmp, up).normalize(); nrm.crossVectors(bin, tmp).normalize();
        const r = radius(s);
        for (let j = 0; j < RS; j++) { const a = j / RS * Math.PI * 2, rr = r * (j === 0 || j === RS - 1 ? 1 : 1) * (Math.sin(a) > .6 ? 1.12 : 1); const k = (i * RS + j) * 3; pos[k] = p.x + (nrm.x * Math.sin(a) + bin.x * Math.cos(a)) * rr; pos[k + 1] = p.y + (nrm.y * Math.sin(a) + bin.y * Math.cos(a)) * rr * 1.1; pos[k + 2] = p.z + (nrm.z * Math.sin(a) + bin.z * Math.cos(a)) * rr; }
      }
      geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
      const h = spine(.97, t, mode); head.position.copy(h);
    };
    /* head: snout, jaw and horns */
    const head = new THREE.Group(); g.add(head);
    const skull = new THREE.Mesh(new THREE.ConeGeometry(.24, .9, 10), bodyM); skull.rotation.z = -Math.PI / 2; skull.position.x = .35; head.add(skull);
    const jaw = new THREE.Mesh(new THREE.ConeGeometry(.12, .7, 8), bodyM); jaw.rotation.z = -Math.PI / 2 - .25; jaw.position.set(.32, -.12, 0); head.add(jaw);
    [-1, 1].forEach((sg) => { const horn = new THREE.Mesh(new THREE.ConeGeometry(.06, .6, 6), bodyM); horn.position.set(-.08, .22, sg * .12); horn.rotation.set(sg * .3, 0, Math.PI / 2 + .9); head.add(horn); });
    /* wings */
    const shape = new THREE.Shape();
    shape.moveTo(.7, 0); shape.quadraticCurveTo(1.4, 1.4, 1.1, 2.4); shape.quadraticCurveTo(.9, 3.6, .2, 4.6); shape.lineTo(-1.2, 6.4);
    shape.quadraticCurveTo(-1.1, 5.2, -1.6, 4.7); shape.lineTo(-2.7, 5.2); shape.quadraticCurveTo(-2.2, 3.9, -2.6, 3.3); shape.lineTo(-3.4, 3.1);
    shape.quadraticCurveTo(-2.7, 2.2, -2.8, 1.5); shape.lineTo(-3.2, 1.0); shape.quadraticCurveTo(-2.3, .5, -1.9, 0); shape.lineTo(.7, 0);
    const wg = new THREE.ShapeGeometry(shape, 24); wg.rotateX(Math.PI / 2); /* span along +z */
    const bones = new THREE.Group(); const boneM = bodyM;
    [[[.9, 0, 0], [1.1, 0, 2.4], [.2, 0, 4.6], [-1.2, 0, 6.4]], [[.2, 0, 4.6], [-2.7, 0, 5.2]], [[.2, 0, 4.6], [-3.4, 0, 3.1]], [[.2, 0, 4.6], [-3.2, 0, 1.0]]].forEach((pts) => { const cu = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))); bones.add(new THREE.Mesh(new THREE.TubeGeometry(cu, 16, .045, 5), boneM)); });
    const wings = [-1, 1].map((sg) => { const pv = new THREE.Group(); const m = new THREE.Mesh(wg, wingM); m.castShadow = true; pv.add(m); pv.add(bones.clone()); pv.scale.set(.9, 1, sg); pv.position.set(.6, .35, sg * .2); g.add(pv); return pv; });
    /* legs tucked */
    [-1, 1].forEach((sg) => { const leg = new THREE.Mesh(new THREE.ConeGeometry(.12, .7, 6), bodyM); leg.position.set(.4, -.45, sg * .3); leg.rotation.z = 2.4; g.add(leg); const leg2 = leg.clone(); leg2.position.x = -1.6; g.add(leg2); });
    const pose = (t, flap, fold, mode) => { update(t, mode); wings.forEach((w, i) => { const sg = i ? 1 : -1; w.rotation.x = sg * -(flap) ; w.rotation.y = fold * .9 * -sg * 0; w.scale.z = sg * (1 - fold * .45); w.rotation.z = fold * .5; }); head.rotation.z = mode === 'perch' ? .35 : 0; };
    g.userData.pose = pose; pose(0, 0, 0, 'fly');
    return g;
  }

  /* ===================== the intro ===================== */
  const gate = $('#gate'); const FIX = +(new URLSearchParams(location.search).get('introT') ?? -1);
  const gcv = $('#gcv');
  const rI = gate && BF.gl(gcv, { dpr: 1.5, alpha: false });
  if (gate && !rI) gate.remove();
  if (rI) {
    rI.toneMapping = THREE.ACESFilmicToneMapping; rI.toneMappingExposure = 1.15; rI.shadowMap.enabled = false;
    const sc = new THREE.Scene(); sc.fog = new THREE.FogExp2(lin('#0b1126'), .016);
    const cam = new THREE.PerspectiveCamera(36, 1, .1, 900);
    /* sky */
    sc.add(new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'varying vec3 vP; void main(){ float h = vP.y; vec3 top = vec3(.008,.012,.045), mid = vec3(.02,.035,.11), hor = vec3(.09,.09,.2), warm = vec3(.2,.12,.12); vec3 c = mix(hor, mid, smoothstep(0.,.25,h)); c = mix(c, top, smoothstep(.25,.8,h)); c += warm*smoothstep(.12,0.,abs(h-.02))*.35; gl_FragColor = vec4(c,1.); }' })));
    /* stars that twinkle */
    { const n = 2200, p = new Float32Array(n * 3), s = new Float32Array(n); for (let i = 0; i < n; i++) { const u = Math.random() * Math.PI * 2, v = Math.acos(1 - Math.random() * .95); p.set([Math.cos(u) * Math.sin(v) * 420, Math.cos(v) * 420, Math.sin(u) * Math.sin(v) * 420], i * 3); s[i] = Math.random(); }
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(p, 3)); gg.setAttribute('aS', new THREE.BufferAttribute(s, 1));
      const sm = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uPx: { value: rI.getPixelRatio() } }, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending,
        vertexShader: 'attribute float aS; uniform float uT, uPx; varying float vA; void main(){ vA = (.35 + .65*aS)*(.6 + .4*sin(uT*(1.5+aS*3.)+aS*40.)); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_PointSize = (1. + aS*2.2)*uPx; }',
        fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord-.5); if (d > .5) discard; gl_FragColor = vec4(vec3(.85,.9,1.)*vA*(1.-d*2.), 1.); }' });
      sc.add(new THREE.Points(gg, sm)); sc.userData.stars = sm; }
    /* the moon */
    const moonPos = new THREE.Vector3(-30, 34, -110);
    const moon = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'varying vec2 vUv; float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); } void main(){ vec2 p = (vUv-.5)*2.; float d = length(p); float disc = smoothstep(.36,.345,d); float crater = .08*smoothstep(.12,0.,length(p-vec2(.1,.08))) + .06*smoothstep(.09,0.,length(p-vec2(-.12,-.1))) + .05*smoothstep(.07,0.,length(p-vec2(.05,-.18))); vec3 c = vec3(1.,.95,.82)*(1.35 - crater*5. - .25*smoothstep(.0,.36,d))*disc; float halo = exp(-pow(max(d-.33,0.)*4.,1.2))*(1.-disc); c += vec3(.45,.52,.85)*halo*.4; gl_FragColor = vec4(c, max(disc, halo*.8)); }' }));
    moon.position.copy(moonPos); sc.add(moon);
    sc.add(new THREE.HemisphereLight(lin('#22305f'), lin('#050608'), .32));
    const fill = new THREE.DirectionalLight(lin('#7f8fc4'), .45); fill.position.set(-20, 14, 30); sc.add(fill);
    const ml = new THREE.DirectionalLight(lin('#b9c6ff'), .8); ml.position.copy(moonPos).normalize().multiplyScalar(60); sc.add(ml);
    /* the hills */
    { const geo = new THREE.PlaneGeometry(320, 320, 180, 180); geo.rotateX(-Math.PI / 2); const p = geo.attributes.position, col = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), dc = Math.hypot(x - 1, z), plateau = smooth(14, 34, dc); let y = (fbm(x * .018 + 3, z * .018) - .45) * 26 * plateau + (z < -60 ? (z + 60) * -.12 * fbm(x * .01, 5) : 0); if (z > 30) y -= (z - 30) * .1; p.setY(i, y - .02);
        const c = lin('#0e1a13').lerp(lin('#1b2219'), clamp(y / 14)); col.set([c.r, c.g, c.b], i * 3); }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
      sc.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }))); }
    /* the tower */
    const TX = 6, tower = stoneTower({ R: 2, H: 12, rows: 28, N: 24, base: '#9b9486' }); tower.position.set(TX, 0, 0); sc.add(tower);
    const winM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.25, .48, .1) });
    [[-.55, 3.4], [-.2, 6.1], [-.85, 8.6], [.15, 10.3], [-.45, 1.2]].forEach(([a, y], i) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(i === 4 ? .9 : .2, i === 4 ? 1.7 : .8), winM); const ang = Math.PI / 2 + a; w.position.set(TX + Math.cos(ang) * 2.31, y, Math.sin(ang) * 2.31); w.lookAt(TX + Math.cos(ang) * 10, y, Math.sin(ang) * 10); sc.add(w); });
    const torch = new THREE.PointLight(lin('#ff9a3c'), 1.6, 7, 2); torch.position.set(TX + .2, 2.3, 2.9); sc.add(torch);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2, .6) })); flame.position.copy(torch.position); flame.scale.y = 1.8; sc.add(flame);
    /* the house beside it, its windows lit */
    { const hg = new THREE.Group(); hg.position.set(-13, 0, -9); hg.rotation.y = .3;
      const wall = new THREE.Mesh(new THREE.BoxGeometry(8, 3.6, 5), new THREE.MeshStandardMaterial({ color: lin('#9c9078'), roughness: .9 })); wall.position.y = 1.8; hg.add(wall);
      const tri = new THREE.Shape(); tri.moveTo(-2.9, 0); tri.lineTo(0, 2); tri.lineTo(2.9, 0); tri.lineTo(-2.9, 0);
      const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 8.8, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: lin('#4a2019'), roughness: .8 })); roof.rotation.y = Math.PI / 2; roof.position.set(-4.4, 3.6, 0); hg.add(roof);
      const wm = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, .42, .09) }); [[-2.6, 1.4], [-.9, 1.4], [.9, 1.4], [2.6, 1.4], [-1.7, 2.9], [1.7, 2.9]].forEach(([x, y]) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(.75, .95), wm); w.position.set(x, y, 2.51); hg.add(w); });
      sc.add(hg); }
    /* dark tree line */
    { const tm = new THREE.MeshStandardMaterial({ color: lin('#0d1611'), roughness: 1 }); for (let i = 0; i < 26; i++) { const a = -1.2 + i * .1 + Math.random() * .05, d = 22 + Math.random() * 14; const t = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 + Math.random() * 1.4, 0), tm); t.position.set(Math.sin(a) * d, 1 + Math.random(), -Math.cos(a) * d - 6); t.scale.y = 1.4; sc.add(t); } }
    /* fireflies */
    const FN = 140, fp = new Float32Array(FN * 3), fs = new Float32Array(FN); for (let i = 0; i < FN; i++) { fp.set([TX - 10 + Math.random() * 20, .5 + Math.random() * 4, -6 + Math.random() * 14], i * 3); fs[i] = Math.random(); }
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3)); fg.setAttribute('aS', new THREE.BufferAttribute(fs, 1));
    const fmat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uPx: { value: rI.getPixelRatio() } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute float aS; uniform float uT, uPx; varying float vA; void main(){ vec3 p = position; p.x += sin(uT*.6 + aS*30.)*.6; p.y += sin(uT*.8 + aS*20.)*.4; vA = .5 + .5*sin(uT*2. + aS*60.); vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv; gl_PointSize = 5.*uPx*(10./-mv.z); }',
      fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord-.5); if (d > .5) discard; gl_FragColor = vec4(vec3(2.4,1.8,.6)*vA*(1.-d*2.), 1.); }' });
    sc.add(new THREE.Points(fg, fmat));
    /* the dragon */
    const dragon = makeDragon({ body: '#0e1220', wing: '#141a2a' }); dragon.scale.setScalar(.85); sc.add(dragon);
    const top = new THREE.Vector3(TX, tower.userData.top + .95, 0);
    const path = new THREE.CatmullRomCurve3([new THREE.Vector3(-62, 12, -44), new THREE.Vector3(-30, 16, -32), new THREE.Vector3(-17, 18, -22), new THREE.Vector3(2, 15.5, -14), new THREE.Vector3(13, 15, -4), new THREE.Vector3(10, 15.6, 2), new THREE.Vector3(top.x + 1, top.y + .7, .5), top.clone()]);
    /* bloom */
    const comp = new THREE.EffectComposer(rI); const rpI = new THREE.RenderPass(sc, cam); { const f = rpI.render.bind(rpI); rpI.render = (...a) => { const tm = a[0].toneMapping; a[0].toneMapping = THREE.NoToneMapping; f(...a); a[0].toneMapping = tm; }; } comp.addPass(rpI);
    const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(512, 512), .9, .55, .9); comp.addPass(bloom);
    let narrow = false;
    BF.fit(rI, cam, gcv, (w, h) => { narrow = w / h < .85; comp.setSize(w, h); bloom.resolution.set(w, h); });
    const t0 = performance.now(); let out = 0, named = false; const look = new THREE.Vector3(), q = new THREE.Quaternion(), m4 = new THREE.Matrix4(), ahead = new THREE.Vector3(), upv = new THREE.Vector3(0, 1, 0);
    BF.loop(gcv, () => {
      const s = FIX >= 0 ? FIX : (performance.now() - t0) / 1000;
      sc.userData.stars.uniforms.uT.value = s; fmat.uniforms.uT.value = s; moon.lookAt(cam.position);
      /* camera rises from the valley and settles on the tower */
      const k = ease(clamp(s / 4.6)); const zBase = narrow ? 52 : 36;
      cam.position.set(THREE.MathUtils.lerp(-6, -4, k), THREE.MathUtils.lerp(1.4, 5, k) + out * 4, THREE.MathUtils.lerp(zBase + 9, zBase, k) - out * 10);
      look.set(narrow ? TX - 2 : 1.5, THREE.MathUtils.lerp(9.5, 8.5, k) + out * 3, 0); cam.lookAt(look);
      /* the flight */
      const fk = clamp((s - .2) / 3.9), pe = ease(fk), p = path.getPoint(pe); dragon.position.copy(p);
      const landed = fk >= 1;
      if (!landed) { path.getPoint(Math.min(1, pe + .015), ahead); m4.lookAt(ahead, p, upv); q.setFromRotationMatrix(m4); q.multiply(new THREE.Quaternion().setFromAxisAngle(upv, -Math.PI / 2)); dragon.quaternion.slerp(q, .2); const bank = clamp((ahead.x - p.x) * -.6, -.6, .6); dragon.rotateX(bank * .2); }
      else { q.setFromAxisAngle(upv, Math.PI + .35); dragon.quaternion.slerp(q, FIX >= 0 ? 1 : .08); }
      const land = smooth(3.5, 4.3, s);
      const flap = landed ? .8 + Math.sin(s * 2.2) * .1 : Math.sin(s * (9 - land * 4)) * (1.05 - land * .5) + .15;
      dragon.userData.pose(s, flap + out * Math.sin(s * 16) * .8, land * .35, land > .5 ? 'perch' : 'fly');
      if (out) { dragon.position.y += out * out * 6; dragon.position.z += out * 3; }
      torch.intensity = 2.2 + Math.sin(s * 13) * .35 + Math.sin(s * 7.3) * .25; flame.scale.set(1 + Math.sin(s * 17) * .1, 1.8 + Math.sin(s * 11) * .25, 1);
      if (!named && s > 3.3) { named = true; gate.classList.add('named'); }
      comp.render();
    });
    if (FIX < 0) BF.gate((done) => { const s0 = performance.now(); const step = () => { const kk = (performance.now() - s0) / 1000; out = Math.min(1, kk); if (kk < 1) requestAnimationFrame(step); else { gate.classList.add('out'); setTimeout(done, 800); } }; step(); }, { auto: 5200, max: 7000 });
  }

  /* ===================== the estate model ===================== */
  const mcv = $('#mcv'), box = $('#model');
  const r = BF.gl(mcv, { dpr: 1.75, alpha: false });
  const PL = [
    { k: 'casa', ro: 'Casa', ru: 'Дом', lro: 'Camerele și sufrageria cu masa lungă, sub acoperișul roșu.', lru: 'Комнаты и столовая с длинным столом, под красной крышей.', img: 'steps', w: 461, h: 820, alt: 'Fațada casei din piatră, cu scările largi și balconul de lemn', at: [-2.2, 3.6, -3.4] },
    { k: 'turn', ro: 'Turnul', ru: 'Башня', lro: 'Turn rotund de piatră, cu dragonul cocoțat sus.', lru: 'Круглая каменная башня, на вершине дракон.', img: 'tower', w: 461, h: 820, alt: 'Turnul de piatră cu creneluri și dragonul verde pe vârf', at: [4.2, 5.4, -3.2] },
    { k: 'sauna', ro: 'Sauna hobbit', ru: 'Сауна-хоббит', lro: 'Sub iarbă, cu ușă rotundă de bușteni și un dragon deasupra; înăuntru, lemn deschis și perete de sare.', lru: 'Под травой, с круглой дверью из брёвен и драконом сверху; внутри светлое дерево и соляная стена.', img: 'cellar-door', w: 461, h: 820, alt: 'Intrarea rotundă a saunei, între bușteni, cu firma Sauna și un dragon pe acoperișul de iarbă', at: [-4.8, 2.0, 2.9] },
    { k: 'piscina', ro: 'Piscina', ru: 'Бассейн', lro: 'În fața casei, cu vedere spre turn.', lru: 'Перед домом, с видом на башню.', img: 'pool', w: 820, h: 615, alt: 'Piscina cu prelată albastră pe gazon, casa și turnul în spate', at: [1.4, .9, 1.8] },
    { k: 'ciubar', ro: 'Ciubărul', ru: 'Чан', lro: 'Ciubăr din lemn, încălzit cu lemne.', lru: 'Деревянный чан, топится дровами.', img: 'tub3', w: 615, h: 820, alt: 'Ciubărul de lemn văzut de sus, cu băncuța rotundă', at: [-2.4, 1.6, 3.2] },
    { k: 'foc', ro: 'Vatra', ru: 'Очаг', lro: 'Focul de seară, sub cerul liber.', lru: 'Вечерний огонь под открытым небом.', img: 'fire', w: 615, h: 820, alt: 'Focul din vatra de piatră, seara, cu un pahar de vin', at: [3.6, 1.2, 4.6] },
  ];
  let cur = 0, pins = [];
  const show = (i, fly = true) => {
    cur = i; const p = PL[i];
    $('#pNum').textContent = String(i + 1); $('#pName').textContent = T(p.ro, p.ru); $('#pLine').textContent = T(p.lro, p.lru);
    const im = $('#pImg'); im.src = `img/${p.img}-s.webp`; im.width = p.w; im.height = p.h; im.alt = p.alt;
    pins.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    $$('#plist button').forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
    if (fly && setGoal) setGoal(p.at);
  };
  let setGoal = null;
  BF.onLang(() => { $('#plist').innerHTML = PL.map((p, i) => `<li><button type="button" data-i="${i}">${i + 1}. ${T(p.ro, p.ru)}</button></li>`).join(''); show(cur, false); });
  $('#plist').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) show(+b.dataset.i); });
  if (!r) return;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  const sc = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(32, 1, .1, 300);
  const DAY = { bg: lin('#e5d6b8'), hemiS: lin('#dfe8ff'), hemiG: lin('#6b5a3a'), hemi: .9, sun: 2.0, sunC: lin('#fff1d6'), exp: 1.0 };
  const NIGHT = { bg: lin('#0c1228'), hemiS: lin('#2b3a78'), hemiG: lin('#0a0b10'), hemi: .16, sun: .22, sunC: lin('#9fb2ff'), exp: .85 };
  const hemi = new THREE.HemisphereLight(DAY.hemiS, DAY.hemiG, DAY.hemi); sc.add(hemi);
  const sun = new THREE.DirectionalLight(DAY.sunC, DAY.sun); sun.position.set(-12, 18, 10); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 60 }); sun.shadow.bias = -.0006; sun.shadow.normalBias = .02; sc.add(sun);
  /* the plinth: earth sides, a lawn on top */
  const R0 = 10;
  { const side = new THREE.Mesh(new THREE.CylinderGeometry(R0, R0 * .96, 1.6, 96, 4, true), new THREE.MeshStandardMaterial({ color: lin('#6d4f34'), roughness: 1, side: THREE.DoubleSide })); side.position.y = -.8; sc.add(side);
    const strata = new THREE.Mesh(new THREE.CylinderGeometry(R0 * 1.001, R0 * .985, .3, 96, 1, true), new THREE.MeshStandardMaterial({ color: lin('#4f8a3a'), roughness: 1 })); strata.position.y = -.15; sc.add(strata);
    const bot = new THREE.Mesh(new THREE.CircleGeometry(R0 * .96, 64), new THREE.MeshStandardMaterial({ color: lin('#4a3524') })); bot.rotation.x = Math.PI / 2; bot.position.y = -1.6; sc.add(bot);
    const lg = new THREE.CircleGeometry(R0, 128, 0, Math.PI * 2); lg.rotateX(-Math.PI / 2); const p = lg.attributes.position, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), n = fbm(x * .35, z * .35), stripe = Math.sin((x + z * .2) * 1.6) > 0 ? 1 : .94; const c = lin('#5f9a42').lerp(lin('#7fb04f'), n).multiplyScalar(stripe); col.set([c.r, c.g, c.b], i * 3); }
    lg.setAttribute('color', new THREE.BufferAttribute(col, 3)); const lawn = new THREE.Mesh(lg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 })); lawn.receiveShadow = true; sc.add(lawn); }
  const stoneM = new THREE.MeshStandardMaterial({ color: lin('#d8ccb4'), roughness: .9 });
  const add = (geo, mat, x, y, z, o = {}) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (o.ry) m.rotation.y = o.ry; if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz; m.castShadow = o.cast !== false; m.receiveShadow = true; sc.add(m); return m; };
  /* night lights collect here */
  const glows = []; const glowM = (c) => { const m = new THREE.MeshStandardMaterial({ color: lin('#2b3340'), emissive: lin(c), emissiveIntensity: 0, roughness: .2 }); glows.push(m); return m; };
  const onePass = (rp) => { const f = rp.render.bind(rp); rp.render = (...a) => { const tm = a[0].toneMapping; a[0].toneMapping = THREE.NoToneMapping; f(...a); a[0].toneMapping = tm; }; return rp; };
  /* the house */
  { const H = new THREE.Group(); H.position.set(-2.2, 0, -3.6); sc.add(H);
    const wallM = new THREE.MeshStandardMaterial({ color: lin('#ece0c6'), roughness: .85 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(5.6, .7, 3.4), new THREE.MeshStandardMaterial({ color: lin('#a89983'), roughness: .95 })); base.position.y = .35; H.add(base);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.4, 3.2), wallM); wall.position.y = 1.9; H.add(wall);
    const tri = new THREE.Shape(); tri.moveTo(-2, 0); tri.lineTo(0, 1.25); tri.lineTo(2, 0); tri.lineTo(-2, 0);
    const roofM = new THREE.MeshStandardMaterial({ color: lin('#b2462c'), roughness: .7 });
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 6, bevelEnabled: false }), roofM); roof.rotation.y = Math.PI / 2; roof.position.set(-3, 3.1, 0); H.add(roof);
    const gab = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 1.2, bevelEnabled: false }), roofM); gab.scale.set(.6, .8, 1); gab.position.set(0, 3.1, .9); H.add(gab);
    const wM = glowM('#ffb766');
    [[-1.8, 1.7], [-.6, 1.7], [.6, 1.7], [1.8, 1.7], [-1.2, 2.7], [1.2, 2.7]].forEach(([x, y]) => { const w = new THREE.Mesh(new THREE.BoxGeometry(.6, .8, .05), wM); w.position.set(x, y, 1.62); H.add(w); });
    const balc = new THREE.Mesh(new THREE.BoxGeometry(5.6, .08, .9), new THREE.MeshStandardMaterial({ color: lin('#7a5636') })); balc.position.set(0, 2.25, 2.05); H.add(balc);
    for (let i = 0; i < 15; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.05, .5, .05), balc.material); s.position.set(-2.75 + i * .39, 2.5, 2.48); H.add(s); }
    const rail = new THREE.Mesh(new THREE.BoxGeometry(5.6, .06, .06), balc.material); rail.position.set(0, 2.76, 2.48); H.add(rail);
    const steps = new THREE.Mesh(new THREE.BoxGeometry(1.4, .35, .9), stoneM); steps.position.set(0, .17, 2.1); H.add(steps);
    const chim = new THREE.Mesh(new THREE.BoxGeometry(.4, 1.1, .4), new THREE.MeshStandardMaterial({ color: lin('#8c7d68') })); chim.position.set(1.8, 4.1, -.6); H.add(chim);
    H.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }
  /* the tower, with its little green dragon */
  const tw = stoneTower({ R: .95, H: 4.6, rows: 15, N: 14, depth: .32, base: '#d6c8ad', seed: 4 }); tw.position.set(4.2, 0, -3.2); sc.add(tw);
  { const slits = glowM('#ffb766'); [[1.6, .2], [2.8, -.3], [3.8, .4]].forEach(([y, a]) => { const w = new THREE.Mesh(new THREE.BoxGeometry(.1, .4, .05), slits); const ang = Math.PI / 2 + a; w.position.set(4.2 + Math.cos(ang) * 1.12, y, -3.2 + Math.sin(ang) * 1.12); w.lookAt(4.2 + Math.cos(ang) * 5, y, -3.2 + Math.sin(ang) * 5); sc.add(w); }); }
  const dTop = makeDragon({ body: '#2e6b57', wing: '#8a4a2b', rough: .45 }); dTop.scale.setScalar(.16); dTop.position.set(4.2, tw.userData.top + .1, -3.2); dTop.rotation.y = -1.9; sc.add(dTop); dTop.userData.pose(0, .95, .4, 'perch');
  /* the hobbit cellar: a turf mound, a round door, logs, a dragon over it */
  { const C = new THREE.Group(); C.position.set(-5.6, 0, 1.4); C.rotation.y = .5; sc.add(C);
    const tg = new THREE.CylinderGeometry(1.5, 1.5, 3.2, 40, 1, false, 0, Math.PI); tg.rotateX(Math.PI / 2); tg.rotateZ(Math.PI / 2); const turf = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ color: lin('#5d9440'), roughness: 1, side: THREE.DoubleSide })); C.add(turf);
    const face = new THREE.Mesh(new THREE.CircleGeometry(1.5, 40, 0, Math.PI), new THREE.MeshStandardMaterial({ color: lin('#c9b48f'), roughness: .95 })); face.position.z = 1.61; C.add(face);
    const door = new THREE.Mesh(new THREE.CircleGeometry(.62, 32), new THREE.MeshStandardMaterial({ color: lin('#6b4224'), roughness: .7 })); door.position.set(0, .62, 1.63); C.add(door);
    const ringD = new THREE.Mesh(new THREE.TorusGeometry(.66, .07, 8, 32), new THREE.MeshStandardMaterial({ color: lin('#3c2a1b') })); ringD.position.set(0, .62, 1.64); C.add(ringD);
    const logM = new THREE.MeshStandardMaterial({ color: lin('#7a5636'), roughness: .9 });
    for (let i = 0; i < 6; i++) { const a = Math.PI * (i + .5) / 6, lg = new THREE.Mesh(new THREE.CylinderGeometry(.13, .15, .9, 10), logM); lg.position.set(Math.cos(a) * 1.25, Math.sin(a) * 1.25, 1.7); lg.rotation.x = Math.PI / 2; C.add(lg); }
    const lamp = glowM('#ffb766'); const lp = new THREE.Mesh(new THREE.BoxGeometry(.18, .26, .1), lamp); lp.position.set(.85, 1.05, 1.7); C.add(lp);
    const d2 = makeDragon({ body: '#2e6b57', wing: '#8a4a2b', rough: .45 }); d2.scale.setScalar(.2); d2.position.set(0, 1.55, .7); d2.rotation.y = -1.35; d2.userData.pose(1.2, .9, .4, 'perch'); C.add(d2);
    C.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }
  /* the pool: a stone deck and water that moves */
  const waterU = { uT: { value: 0 }, uN: { value: 0 } };
  { add(new THREE.BoxGeometry(5.6, .16, 2.8), stoneM, 1.4, .08, 1.8);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.2), new THREE.ShaderMaterial({ uniforms: waterU,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform float uT, uN; varying vec2 vUv; void main(){ vec2 p = vUv*vec2(10.,4.4); float c = 0.; for (int i = 0; i < 3; i++){ float fi = float(i); p += vec2(sin(p.y*1.3 + uT*.9 + fi), cos(p.x*1.1 - uT*.7 + fi*2.)) * .35; c += abs(sin(p.x + p.y)); } c = pow(1. - c/3., 3.); vec3 deep = mix(vec3(.05,.42,.62), vec3(.02,.2,.42), uN), shallow = mix(vec3(.3,.8,.9), vec3(.15,.75,.95), uN); vec3 col = mix(deep, shallow, smoothstep(.0,.5,vUv.y*.5 + .25)) + c*mix(.35,.8,uN); col *= mix(1., 1.15, uN); gl_FragColor = vec4(col,1.); }' }));
    water.rotation.x = -Math.PI / 2; water.position.set(1.4, .17, 1.8); sc.add(water); }
  /* the hot tub: staves, hoops, water, a stove pipe, steam */
  const steamU = { uT: { value: 0 } };
  { const T0 = new THREE.Group(); T0.position.set(-2.4, 0, 3.2); sc.add(T0);
    const stave = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .8, 28, 1, true), new THREE.MeshStandardMaterial({ color: lin('#9a6a3e'), roughness: .8, side: THREE.DoubleSide })); stave.position.y = .4; T0.add(stave);
    [.15, .65].forEach((y) => { const h = new THREE.Mesh(new THREE.TorusGeometry(.63, .025, 6, 32), new THREE.MeshStandardMaterial({ color: lin('#2a2a2a'), metalness: .6, roughness: .4 })); h.rotation.x = Math.PI / 2; h.position.y = y; T0.add(h); });
    const wtr = new THREE.Mesh(new THREE.CircleGeometry(.6, 28), new THREE.MeshStandardMaterial({ color: lin('#3b7d8c'), roughness: .1, metalness: .1 })); wtr.rotation.x = -Math.PI / 2; wtr.position.y = .66; T0.add(wtr);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.8, 10), new THREE.MeshStandardMaterial({ color: lin('#1d1d1d'), metalness: .5, roughness: .5 })); pipe.position.set(.75, .9, -.1); T0.add(pipe);
    const sn = 60, sp = new Float32Array(sn * 3), ss = new Float32Array(sn); for (let i = 0; i < sn; i++) { sp.set([(Math.random() - .5) * .8, .7, (Math.random() - .5) * .8], i * 3); ss[i] = Math.random(); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('aS', new THREE.BufferAttribute(ss, 1));
    T0.add(new THREE.Points(sg, new THREE.ShaderMaterial({ uniforms: steamU, transparent: true, depthWrite: false,
      vertexShader: 'attribute float aS; uniform float uT; varying float vA; void main(){ float k = fract(uT*.18 + aS); vec3 p = position + vec3(sin(aS*20. + uT)*.1*k, k*1.4, cos(aS*13.)*.1*k); vA = (1.-k)*.35; vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv; gl_PointSize = (18. + 30.*k)*(10./-mv.z); }',
      fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord-.5); if (d > .5) discard; gl_FragColor = vec4(vec3(1.), vA*(1.-d*2.)); }' })));
    T0.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }
  /* the fire pit */
  const fireL = new THREE.PointLight(lin('#ff8a33'), 0, 7, 2); fireL.position.set(3.6, .8, 4.6); sc.add(fireL);
  const fireM = new THREE.MeshBasicMaterial({ color: new THREE.Color(.25, .12, .05) });
  { for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; add(new THREE.DodecahedronGeometry(.18, 0), new THREE.MeshStandardMaterial({ color: lin('#8d8273'), roughness: 1 }), 3.6 + Math.cos(a) * .55, .14, 4.6 + Math.sin(a) * .55); }
    add(new THREE.ConeGeometry(.28, .7, 8), fireM, 3.6, .45, 4.6, { cast: false }); }
  /* paths of flat stones */
  { const pm = new THREE.MeshStandardMaterial({ color: lin('#cfc2a8'), roughness: .95 });
    const lay = (a, b, n) => { for (let i = 0; i < n; i++) { const t = i / (n - 1), x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; const s = add(new THREE.CylinderGeometry(.32 + hash(i, n) * .1, .34, .06, 7), pm, x + (hash(i, 3) - .5) * .25, .03, z + (hash(3, i) - .5) * .25, { cast: false }); s.rotation.y = hash(i, i) * 3; } };
    lay([.5, 9], [-.6, -1.4], 14); lay([-.6, 1.2], [-4.6, 2.8], 7); lay([.6, 1.2], [3.6, 4.0], 6); lay([1.6, -1.6], [3.6, -2.2], 4); }
  /* trees and bushes on the rim */
  { const leafM = [lin('#3f7a35'), lin('#4f8a3a'), lin('#2f6a30')].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: .9, flatShading: true })); const trunkM = new THREE.MeshStandardMaterial({ color: lin('#5a4128') });
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + hash(i, 1) * .2; if (Math.cos(a) > .55 && Math.sin(a) > -.2) continue; const d = 8 + hash(i, 2) * 1.3; const x = Math.cos(a) * d, z = Math.sin(a) * d; const h = 1.2 + hash(i, 5) * 1.4;
      add(new THREE.CylinderGeometry(.08, .12, h, 6), trunkM, x, h / 2, z); const c = add(new THREE.IcosahedronGeometry(.7 + hash(i, 7) * .5, 1), leafM[i % 3], x, h + .5, z); c.scale.y = 1.15; }
    for (let i = 0; i < 14; i++) { const x = -1 + (i % 7) * .55 - 3, z = -1.4; if (i > 6) continue; add(new THREE.IcosahedronGeometry(.28, 0), leafM[1], x + 2.2, .22, z); }
    [[-1.2, 4.8], [-.4, 6.2], [1.6, 6.4], [2.4, 5.2], [5.6, .2], [6.2, -1.2]].forEach(([x, z], i) => add(new THREE.IcosahedronGeometry(.32 + hash(i, 9) * .15, 0), leafM[i % 3], x, .28, z)); }
  /* garden lamps along the path */
  const lampLights = [];
  [[-.9, 7], [1.3, 6.2], [-1.4, 3.6], [1.0, 3.2], [2.8, -1.6]].forEach(([x, z]) => { add(new THREE.CylinderGeometry(.04, .05, .9, 6), new THREE.MeshStandardMaterial({ color: lin('#222') }), x, .45, z); const b = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), glowM('#ffcf8a')); b.position.set(x, .95, z); sc.add(b); const L = new THREE.PointLight(lin('#ffbb66'), 0, 3.4, 2); L.position.set(x, 1, z); sc.add(L); lampLights.push(L); });
  /* stars for the night */
  const starM = new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0 });
  { const n = 500, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = Math.random() * Math.PI * 2, v = Math.acos(Math.random() * .9); p.set([Math.cos(u) * Math.sin(v) * 120, Math.cos(v) * 120, Math.sin(u) * Math.sin(v) * 120], i * 3); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); sc.add(new THREE.Points(g, starM)); }
  /* bloom for the night */
  const comp = new THREE.EffectComposer(r); comp.addPass(onePass(new THREE.RenderPass(sc, cam))); const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(512, 512), .7, .5, .85); comp.addPass(bloom);
  /* orbit: drag to turn, a target that flies to the place */
  let az = .5, pol = .98, rad = 26, gAz = az, gPol = pol, gRad = rad; const tgt = new THREE.Vector3(0, .6, 0), gTgt = tgt.clone();
  let drag = false, px = 0, py = 0, idle = 0, night = 0, gNight = 0;
  mcv.addEventListener('pointerdown', (e) => { drag = true; px = e.clientX; py = e.clientY; mcv.setPointerCapture(e.pointerId); idle = 0; });
  mcv.addEventListener('pointermove', (e) => { if (!drag) return; gAz -= (e.clientX - px) * .006; gPol = clamp(gPol - (e.clientY - py) * .004, .45, 1.32); px = e.clientX; py = e.clientY; });
  const up = () => { drag = false; }; mcv.addEventListener('pointerup', up); mcv.addEventListener('pointercancel', up);
  setGoal = (at) => { gTgt.set(at[0], Math.max(.6, at[1] * .5), at[2]); gRad = 15; idle = 0; let d = Math.atan2(at[0], at[2] + 8) - gAz; d = ((d + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; gAz += d * .6; };
  $$('.tools button').forEach((b) => b.addEventListener('click', () => { gNight = b.dataset.tod === 'night' ? 1 : 0; $$('.tools button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }));
  /* numbered pins, projected each frame */
  const pinsEl = $('#pins'); pinsEl.innerHTML = PL.map((p, i) => `<button type="button" class="pin" data-i="${i}" aria-pressed="${i === 0}" aria-label="${p.ro}">${i + 1}</button>`).join(''); pins = $$('.pin', pinsEl);
  BF.onLang(() => pins.forEach((b, i) => b.setAttribute('aria-label', `${i + 1}. ${T(PL[i].ro, PL[i].ru)}`)));
  pinsEl.addEventListener('click', (e) => { const b = e.target.closest('.pin'); if (b) show(+b.dataset.i); });
  BF.fit(r, cam, mcv, (w, h) => { comp.setSize(w, h); bloom.resolution.set(w, h); });
  const v = new THREE.Vector3(), cbg = new THREE.Color(); const t0 = performance.now();
  BF.loop(mcv, () => {
    const t = (performance.now() - t0) / 1000;
    idle++; if (!drag && idle > 300 && !BF.reduce) { gAz += .0012; if (idle > 600) { gRad += (26 - gRad) * .01; gTgt.lerp(new THREE.Vector3(0, .6, 0), .01); } }
    az += (gAz - az) * .08; pol += (gPol - pol) * .08; rad += (gRad - rad) * .06; tgt.lerp(gTgt, .06); night += (gNight - night) * .06;
    cam.position.set(tgt.x + rad * Math.sin(pol) * Math.sin(az), tgt.y + rad * Math.cos(pol), tgt.z + rad * Math.sin(pol) * Math.cos(az)); cam.lookAt(tgt);
    /* day to night */
    cbg.copy(DAY.bg).lerp(NIGHT.bg, night); r.setClearColor(cbg, 1); sc.background = cbg;
    hemi.color.copy(DAY.hemiS).lerp(NIGHT.hemiS, night); hemi.groundColor.copy(DAY.hemiG).lerp(NIGHT.hemiG, night); hemi.intensity = THREE.MathUtils.lerp(DAY.hemi, NIGHT.hemi, night);
    sun.color.copy(DAY.sunC).lerp(NIGHT.sunC, night); sun.intensity = THREE.MathUtils.lerp(DAY.sun, NIGHT.sun, night); r.toneMappingExposure = THREE.MathUtils.lerp(DAY.exp, NIGHT.exp, night);
    glows.forEach((m) => (m.emissiveIntensity = night * 1.5)); lampLights.forEach((L) => (L.intensity = night * 1.2)); starM.opacity = night;
    const fl = .8 + Math.sin(t * 13) * .15 + Math.sin(t * 7) * .1; fireL.intensity = night * 3 * fl; fireM.color.setRGB(.25 + night * 3.4 * fl, .12 + night * 1.5 * fl, .05 + night * .3);
    waterU.uT.value = t; waterU.uN.value = night; steamU.uT.value = t;
    if (night > .02) comp.render(); else r.render(sc, cam);
    const W = mcv.clientWidth, H = mcv.clientHeight;
    PL.forEach((p, i) => { v.set(...p.at); v.project(cam); const ok = v.z < 1 && Math.abs(v.x) < 1.02 && Math.abs(v.y) < 1.02; pins[i].style.visibility = ok ? 'visible' : 'hidden'; pins[i].style.left = ((v.x + 1) / 2 * W) + 'px'; pins[i].style.top = ((1 - v.y) / 2 * H) + 'px'; });
  });
})();
