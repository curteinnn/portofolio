// GLB nodes are generically named Object_2, Object_3, etc.; material names identify clickable parts.
// cameraFocus.position/target are world coordinates after Center + the model's Y rotation.
// hotspotPosition is in the model group's local coordinates before its Y rotation and Center offset.
export const SCENE_ITEMS = {
  BassDrum: {
    id: "bass-drum",
    hotspotPosition: [2.1, 2.4, -2.73],
    tag: "01 / DRUM",
    title: "Drum",
    layout: "drum",
    description: "Gue membangun pengalaman digital dengan fokus pada fungsi, detail, dan interaksi.",
    note: "WEB DEVELOPER · ALDRY DIAN RENO",
    text: "Aldry Dian Reno — Web Developer. Gue membangun pengalaman digital dengan fokus pada fungsi, detail, dan interaksi.",
    cameraFocus: {
      enabled: true,
      position: [-1.84, -0.49, 1.38],
      target: [-2.74, -1.29, -2.22],
      fov: 32,
      duration: 1.25,
      easing: "power3.inOut",
    },
  },
  "Mic.001": {
    id: "microphone",
    hotspotPosition: [0.5, 4.36, 0.18],
    tag: "02 / MIC",
    title: "Microphone",
    layout: "microphone",
    description: "Gue suka mengubah ide menjadi website yang mudah dipahami, nyaman digunakan, dan punya karakter visual yang kuat.",
    note: "IDE → INTERFACE → EXPERIENCE",
    text: "Gue suka mengubah ide menjadi website yang mudah dijelajdaaaaaaaaaaaaaaaaaaaaaaaaaedaedaefaefaefefaaefffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    cameraFocus: {
      enabled: true,
      position: [1.33, 1.25, 2.98],
      target: [0.18, 0.67, -0.62],
      fov: 35,
      duration: 1.1,
      easing: "power3.inOut",
    },
  },
  "Monitor.001": {
    id: "monitor",
    hotspotPosition: [-0.18, 3.47, -4.97],
    tag: "03 / SPEAKER",
    title: "Speaker",
    layout: "speaker",
    description: "Setiap bagian website, dari struktur sampai antarmuka, dirancang untuk bekerja sebagai satu pengalaman yang utuh.",
    note: "STRUCTURE · INTERFACE · EXPERIENCE",
    text: "Setiap bagian website, dari struktur sampai antarmuka, dirancang untuk bekerja sebagai satu pengalaman yang utuh.",
    cameraFocus: {
      enabled: true,
      position: [-3.8, 0.6, 3.06],
      target: [-4.97, -0.22, 0.06],
      fov: 36,
      duration: 1.15,
      easing: "power3.inOut",
    },
  },
  Crate: {
    id: "amplifier",
    hotspotPosition: [4.4, 1.4, -0.8],
    tag: "04 / AMPLIFIER",
    title: "Amplifier",
    layout: "amplifier",
    description: "Gue merangkai teknologi dan visual agar setiap halaman menyampaikan pesan dengan jelas.",
    note: "BUILDING DIGITAL EXPERIENCES",
    text: "Perangkat amplifier di panggung. Klik untuk melihat detailnya.",
    cameraFocus: {
      enabled: true,
      position: [0.4, -1.5, -1.12],
      target: [-0.8, -2.29, -4.52],
      fov: 35,
      duration: 1.2,
      easing: "power3.inOut",
    },
  },
  "Light.002": {
    id: "stage-light-right",
    hotspotPosition: [3.57, 5.79, 3.44],
    tag: "05 / STAGE LIGHT",
    title: "Lampu panggung",
    layout: "stage-light",
    description: "Sorot panggung membentuk fokus dan suasana pada scene interaktif ini.",
    note: "DETAILS SHAPE THE MOOD",
    text: "Sorot panggung membentuk fokus dan suasana pada scene interaktif ini.",
    cameraFocus: {
      enabled: true,
      position: [5.249, 3.35, -3.941],
      target: [3.436, 2.1, -3.69],
      fov: 32,
      duration: 1.2,
      easing: "power3.inOut",
    },
  },
};

export function getSceneItem(object) {
  const materials = Array.isArray(object.material)
    ? object.material
    : [object.material];
  const materialName = materials.find(
    (material) => SCENE_ITEMS[material?.name],
  )?.name;

  return materialName ? SCENE_ITEMS[materialName] : null;
}
