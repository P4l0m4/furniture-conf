import {
  Group,
  Mesh,
  MeshStandardMaterial,
  BoxGeometry,
  CylinderGeometry,
  Vector3,
  Color,
  PointLight,
  SphereGeometry,
  MeshBasicMaterial,
  PointLightHelper,
  DirectionalLight,
  Object3D,
  SpotLight,
} from "three";

const palette = {
  wood: new Color("#b07d47"),
  fabric: new Color("#9aa5b1"),
  dark: new Color("#333333"),
  light: new Color("#dddddd"),
};

function mat(color: Color) {
  return new MeshStandardMaterial({
    color,
    roughness: 1,
    metalness: 0,
    flatShading: true,
  });
}

function withShadow<T extends Mesh | Group>(o: T) {
  o.traverse?.((c: any) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  // pour Mesh simple
  // @ts-ignore
  if ((o as any).isMesh) {
    (o as any).castShadow = true;
    (o as any).receiveShadow = true;
  }
  return o;
}

// largeur, épaisseur, profondeur
export function makeTable(size = new Vector3(15, 0.3, 8)) {
  const g = new Group();

  // Hauteur des pieds
  const legHeight = 4;

  // Plateau positionné sur les pieds
  const top = new Mesh(
    new BoxGeometry(size.x, size.y, size.z),
    mat(palette.wood)
  );
  top.position.y = legHeight + size.y / 2; // posé sur les pieds
  top.castShadow = true;
  top.receiveShadow = true;
  g.add(top);

  // Pieds
  const legGeo = new BoxGeometry(1, legHeight, 1);
  const legMat = mat(palette.dark);

  const offs = [
    [+size.x / 2 - 0.5, legHeight / 2, +size.z / 2 - 0.5],
    [+size.x / 2 - 0.5, legHeight / 2, -size.z / 2 + 0.5],
    [-size.x / 2 + 0.5, legHeight / 2, +size.z / 2 - 0.5],
    [-size.x / 2 + 0.5, legHeight / 2, -size.z / 2 + 0.5],
  ];

  offs.forEach(([x, y, z]) => {
    const leg = new Mesh(legGeo, legMat);
    leg.position.set(x, y, z); // centre des pieds à mi-hauteur
    leg.castShadow = true;
    leg.receiveShadow = true;
    g.add(leg);
  });

  return withShadow(g);
}

export function makeChair() {
  const g = new Group();
  const seat = new Mesh(new BoxGeometry(0.6, 0.08, 0.6), mat(palette.fabric));
  seat.position.y = 0.45;
  g.add(seat);
  const back = new Mesh(new BoxGeometry(0.6, 0.7, 0.08), mat(palette.fabric));
  back.position.set(0, 0.85, -0.26);
  g.add(back);
  const legGeo = new BoxGeometry(0.08, 0.45, 0.08);
  const legMat = mat(palette.dark);
  const offs = [
    [0.26, 0.225, 0.26],
    [0.26, 0.225, -0.26],
    [-0.26, 0.225, 0.26],
    [-0.26, 0.225, -0.26],
  ];
  offs.forEach(([x, y, z]) => {
    const leg = new Mesh(legGeo, legMat);
    leg.position.set(x, y, z);
    g.add(leg);
  });

  g.scale.set(6, 6, 6);

  return withShadow(g);
}

export function makeSofa(size = new Vector3(20, 4, 8)) {
  const g = new Group();

  // proportions relatives
  const baseH = size.y / 4;
  const seatH = size.y / 3;
  const backH = size.y;

  const backThick = size.z / 4;
  const armThick = size.x / 8;
  const armDepth = size.z;
  const armH = (baseH + seatH) * 1.5;

  // base
  const base = new Mesh(
    new BoxGeometry(size.x, baseH, size.z),
    mat(palette.fabric)
  );
  base.position.y = baseH / 2;
  g.add(base);

  // siège
  const seatW = size.x - armThick * 2;
  const seatD = size.z - backThick;
  const seat = new Mesh(
    new BoxGeometry(seatW, seatH, seatD),
    mat(palette.fabric)
  );
  seat.position.set(0, baseH + seatH / 2, backThick / 2); // aligné avec l'avant du dossier
  g.add(seat);

  // dossier (entre les accoudoirs)
  const back = new Mesh(
    new BoxGeometry(seatW, backH, backThick),
    mat(palette.fabric)
  );
  back.position.set(0, baseH + backH / 2, -size.z / 2 + backThick / 2);
  g.add(back);

  // accoudoirs
  const armGeo = new BoxGeometry(armThick, armH, armDepth);
  const armL = new Mesh(armGeo, mat(palette.fabric));

  armL.position.set(-size.x / 2 + armThick / 2, armH / 2, 0);
  const armR = armL.clone();
  armR.position.set(+size.x / 2 - armThick / 2, armH / 2, 0);
  g.add(armL, armR);

  return withShadow(g);
}

export function makeShelf() {
  const g = new Group();
  const sideGeo = new BoxGeometry(0.12, 1.8, 0.35);
  const shelfGeo = new BoxGeometry(0.9, 0.06, 0.35);
  const m = mat(palette.wood);
  const left = new Mesh(sideGeo, m);
  left.position.set(-0.5, 0.9, 0);
  const right = new Mesh(sideGeo, m);
  right.position.set(0.5, 0.9, 0);
  g.add(left, right);
  for (let i = 0; i < 5; i++) {
    const s = new Mesh(shelfGeo, m);
    s.position.set(0, 0.2 + i * 0.4, 0);
    g.add(s);
  }

  g.scale.set(8, 8, 5);
  return withShadow(g);
}

export function makeLamp() {
  const g = new Group();

  // dimensions
  const baseH = 0.1;
  const poleH = 8;
  const shadeH = 1.2;

  // base
  const base = new Mesh(
    new CylinderGeometry(0.15, 0.3, baseH, 24),
    mat(palette.dark)
  );
  base.position.y = baseH / 2;
  g.add(base);

  // pied
  const pole = new Mesh(
    new CylinderGeometry(0.03, 0.03, poleH, 24),
    mat(palette.dark)
  );
  pole.position.y = baseH + poleH / 2;
  g.add(pole);

  // abat-jour (large en bas, étroit en haut)
  const shade = new Mesh(
    new CylinderGeometry(0.18, 0.25, shadeH, 24),
    mat(palette.light)
  );
  shade.position.y = baseH + poleH + shadeH / 2;
  shade.castShadow = false;
  shade.receiveShadow = false;
  g.add(shade);

  // ampoule visible
  const bulbY = baseH + poleH + shadeH * 0.2;
  const bulb = new Mesh(
    new SphereGeometry(0.2, 12, 12),
    new MeshBasicMaterial({ color: 0xfff4cc })
  );
  bulb.position.set(0, bulbY - 0.2, 0);
  bulb.castShadow = false;
  bulb.receiveShadow = false;
  g.add(bulb);

  // lumière
  const light = new PointLight(0xfffdfa, 40, 60);
  light.position.set(0, bulbY - 0.3, 0);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.bias = -0.0005;
  g.add(light);

  g.scale.set(3, 1, 3);

  return withShadow(g);
}

export function makePlant() {
  const g = new Group();

  const potColor = new Color("#7a4f2a");
  const leafColor = new Color("#2e7d32");
  const soilColor = new Color("#3e2a1f");

  // pot
  const potH = 0.6;
  const potTop = 0.4;
  const potBottom = 0.3;
  const pot = new Mesh(
    new CylinderGeometry(potTop, potBottom, potH, 24),
    new MeshStandardMaterial({
      color: potColor,
      roughness: 1,
      metalness: 0,
      flatShading: true,
    })
  );
  pot.position.y = potH / 2;
  g.add(pot);

  // terre
  const soil = new Mesh(
    new CylinderGeometry(potTop * 0.9, potTop * 0.9, 0.05, 24),
    new MeshStandardMaterial({
      color: soilColor,
      roughness: 1,
      metalness: 0,
      flatShading: true,
    })
  );
  soil.position.y = potH - 0.04;
  g.add(soil);

  // tige
  const stemH = 1.5;
  const stem = new Mesh(
    new CylinderGeometry(0.1, 0.1, stemH, 12),
    new MeshStandardMaterial({
      color: leafColor,
      roughness: 1,
      metalness: 0,
      flatShading: true,
    })
  );
  stem.position.y = potH + stemH / 2;
  g.add(stem);

  // feuilles
  const leafGeo = new SphereGeometry(0.25, 12, 12);
  const leafMat = new MeshStandardMaterial({
    color: leafColor,
    roughness: 1,
    metalness: 0,
    flatShading: true,
  });

  function addLeaf(
    y: number,
    yaw: number,
    sx = 1.2,
    sy = 0.25,
    sz = 0.6,
    offset = 0.22
  ) {
    const leaf = new Mesh(leafGeo, leafMat);
    leaf.scale.set(sx, sy, sz);
    leaf.position.set(Math.cos(yaw) * offset, y, Math.sin(yaw) * offset);

    leaf.rotation.set(
      (Math.random() - 0.5) * 0.5, // inclinaison X aléatoire ~±15°
      yaw,
      (Math.random() - 0.5) * 0.5 // inclinaison Z aléatoire ~±15°
    );
    g.add(leaf);
  }

  // nombre aléatoire de feuilles entre 5 et 8
  const leafCount = Math.floor(Math.random() * 4) + 5;
  const y0 = potH + 0.3;
  for (let i = 0; i < leafCount; i++) {
    const y = y0 + i * (stemH / leafCount);
    const yaw = Math.random() * Math.PI * 2; // angle aléatoire
    const scaleX = 1 + Math.random() * 0.5;
    const scaleZ = 0.5 + Math.random() * 0.4;
    addLeaf(y, yaw, scaleX, 0.25, scaleZ);
  }

  g.scale.set(3, 3, 3);
  return withShadow(g);
}

export function makeWindowLight(
  size = new Vector3(8, 10, 0.2),
  intensity = 100
) {
  const g = new Group();

  // cadre
  const t = 0.3;
  const frameMat = new MeshStandardMaterial({
    color: new Color("#8a8a8a"),
    roughness: 1,
    metalness: 1,
    flatShading: true,
  });

  const parts: Mesh[] = [];
  parts.push(new Mesh(new BoxGeometry(t, size.y, t), frameMat));
  parts.push(new Mesh(new BoxGeometry(t, size.y, t), frameMat));
  parts.push(new Mesh(new BoxGeometry(size.x, t, t), frameMat));
  parts.push(new Mesh(new BoxGeometry(size.x, t, t), frameMat));
  parts[0].position.set(-size.x / 2 + t / 2, 0, 0);
  parts[1].position.set(+size.x / 2 - t / 2, 0, 0);
  parts[2].position.set(0, -size.y / 2 + t / 2, 0);
  parts[3].position.set(0, +size.y / 2 - t / 2, 0);
  parts.forEach((p) => g.add(p));

  // vitre
  const glass = new Mesh(
    new BoxGeometry(size.x - t * 2, size.y - t * 2, 0.01),
    new MeshStandardMaterial({
      color: new Color("#cfe9ff"),
      emissive: 0xfffdfa,
      emissiveIntensity: 10,
      roughness: 0.2,
      metalness: 0,
      transparent: true,
      opacity: 0.85,
    })
  );
  g.add(glass);

  const pointLight = new PointLight(0xfffdfa, intensity, 50);
  pointLight.position.set(0, 0, 2); // juste devant la vitre
  g.add(pointLight);

  // SpotLight simulant le faisceau entrant
  const spot = new SpotLight(0xfffdfa, intensity, 70, Math.PI / 4, 1, 2);
  // couleur, intensité, distance, angle, penumbra, decay
  spot.position.set(0, 4, 8); // juste devant la vitre
  spot.rotation.y = -Math.PI / 2; // orienté vers le bas
  spot.target.position.set(0, 0, 10); // vise vers le bas et l'intérieur
  g.add(spot);
  g.add(spot.target);

  spot.castShadow = true;
  spot.shadow.mapSize.set(2048, 2048);
  spot.shadow.bias = -0.0005;

  // position globale de la fenêtre dans la scène
  g.position.set(0, 10, 8);

  return withShadow(g);
}

export function makeBed(size = new Vector3(15, 3, 20)) {
  const g = new Group();

  // proportions
  const legH = 1.2;
  const legT = 0.8;
  const frameH = 0.6;
  const headH = 4;
  const headT = 0.8;
  const mattressH = Math.max(1.4, size.y - frameH); // épaisseur utile

  // cadre
  const frame = new Mesh(
    new BoxGeometry(size.x, frameH, size.z),
    mat(palette.wood)
  );
  frame.position.y = legH + frameH / 2;
  g.add(frame);

  // pieds
  const legGeo = new BoxGeometry(legT, legH, legT);
  const legMat = mat(palette.dark);
  const offs = [
    [+size.x / 2 - legT / 2, legH / 2, +size.z / 2 - legT / 2],
    [+size.x / 2 - legT / 2, legH / 2, -size.z / 2 + legT / 2],
    [-size.x / 2 + legT / 2, legH / 2, +size.z / 2 - legT / 2],
    [-size.x / 2 + legT / 2, legH / 2, -size.z / 2 + legT / 2],
  ];
  offs.forEach(([x, y, z]) => {
    const leg = new Mesh(legGeo, legMat);
    leg.position.set(x, y, z);
    g.add(leg);
  });

  // tête de lit
  const head = new Mesh(
    new BoxGeometry(size.x, headH, headT),
    mat(palette.wood)
  );
  head.position.set(0, legH + frameH + headH / 2, -size.z / 2 + headT / 2);
  g.add(head);

  // matelas
  const mattress = new Mesh(
    new BoxGeometry(size.x - 1, mattressH, size.z - 1),
    mat(palette.fabric)
  );
  mattress.position.y = legH + frameH + mattressH / 2;
  g.add(mattress);

  // oreillers
  const pillowGeo = new BoxGeometry((size.x - 3) / 2, 0.6, 2.2);
  const pillowMat = new MeshStandardMaterial({
    color: new Color("#eeeeee"),
    roughness: 1,
    metalness: 0,
    flatShading: true,
  });
  const pL = new Mesh(pillowGeo, pillowMat);
  const pR = pL.clone();
  const py = mattress.position.y + mattressH / 2 + 0.3;
  const pz = -size.z / 2 + headT + 1.4;
  pL.position.set(-((size.x - 2) / 4), py, pz);
  pR.position.set(+((size.x - 2) / 4), py, pz);
  g.add(pL, pR);

  return withShadow(g);
}

export function makeRug(size = new Vector3(20, 0.05, 15)) {
  const g = new Group();

  const rug = new Mesh(
    new BoxGeometry(size.x, size.y, size.z),
    new MeshStandardMaterial({
      color: new Color("#b94e48"), // couleur du tapis
      roughness: 0.9,
      metalness: 0,
      flatShading: true,
    })
  );

  // posé sur le sol (y ≈ 0)
  rug.position.y = size.y / 2;
  rug.receiveShadow = true;
  rug.castShadow = false;

  g.add(rug);

  return withShadow(g);
}

export const furnitureCatalog = [
  {
    type: "Bureau",
    factory: makeTable,
    icon: "desk_fill",
  },
  {
    type: "Chaise",
    factory: makeChair,
    icon: "chair_fill",
  },
  {
    type: "Fauteuil",
    factory: makeSofa,
    icon: "couch_fill",
  },
  {
    type: "Bibliothèque",
    factory: makeShelf,
    icon: "books_fill",
  },
  {
    type: "Lampe",
    factory: makeLamp,
    icon: "lamp_fill",
  },
  {
    type: "Plante",
    factory: makePlant,
    icon: "potted_plant_fill",
  },
  {
    type: "Fenêtre",
    factory: makeWindowLight,
    icon: "windows_logo_fill",
  },
  {
    type: "Lit",
    factory: makeBed,
    icon: "bed_fill",
  },
  {
    type: "Tapis",
    factory: makeRug,
    icon: "rug_fill",
  },
];
