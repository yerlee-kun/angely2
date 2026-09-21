const app = document.querySelector(".app");
const openButton = document.querySelector("#open-button");
const welcomeScreen = document.querySelector("#welcome-screen");
const messageScreen = document.querySelector("#message-screen");
const petalsContainer = document.querySelector("#falling-petals");
const backgroundMusic = document.querySelector("#background-music");
const musicButton = document.querySelector("#music-button");
const cosmicTitle = document.querySelector("#cosmic-title");
const recipientTitle = document.querySelector("#recipient-title");
const personalMessage = document.querySelector("#personal-message");
const signature = document.querySelector("#signature");
const closingCard = document.querySelector(".closing-card");
const universeCanvas = document.querySelector("#universe-canvas");
const universeContext = universeCanvas.getContext("2d");
const sunflowerImage = new Image();
sunflowerImage.decoding = "async";
sunflowerImage.src = "assets/girasol-joven.png";
const staticUniverseCanvas = document.createElement("canvas");
const staticUniverseContext = staticUniverseCanvas.getContext("2d");
const sunCanvas = document.createElement("canvas");
const sunContext = sunCanvas.getContext("2d");
let canvasMetrics = { width: 0, height: 0, pixelRatio: 0 };
let staticLayersDirty = true;
let animationFrameId = 0;
let animationStartTime = null;
let elapsedBeforePause = 0;

// CONFIG_START
const config = {
  para: "angely",
  de: "yerlee",
  mensaje: "Gracias por ser parte de mis días más bonitos...",
  frases: {
    cercano: [
      "Para ti pe ",
      "Sonríe pi",
      "Brillas",
      "Conmigo",
      "Gracias por estar",
      "Unica",
      "Mi favorita",
      "Qué linda flojis",
      "Te quiero",
    ],
    medio: [
      "Gracias por estar",
      "Sigue brillando",
      "Me alegras",
      "Hoy pensé en ti",
      "Qué bonito coincidir",
      "Te mereces flores",
      "Solo porque sí <3",
      "Qué bonito loca ",
    ],
    lejano: [
      "Para alegrarte",
      "Eres especial",
      "Siempre contigo",
      "Con cariño",
      "Quédate cerquita",
      "yo el insano?",
      "broster amarillo?",
    ],
  },
};
// CONFIG_END

const defaultConfig = JSON.parse(JSON.stringify(config));

const universeConfig = {
  title: "Feliz día de las Flores Amarillas",
};

const petalSettings = [
  [6, 13, 0, -22],
  [15, 10, 2.4, 30],
  [24, 15, 4.8, -18],
  [34, 11, 1.2, 26],
  [45, 14, 6, -34],
  [56, 9, 3.2, 20],
  [66, 16, 0.8, -28],
  [76, 11, 5.3, 32],
  [86, 14, 2, -24],
  [94, 10, 6.8, 18],
];

function createPetals() {
  const fragment = document.createDocumentFragment();

  petalSettings.forEach(([left, size, delay, drift], index) => {
    const petal = document.createElement("span");
    petal.className = "falling-petal";
    petal.style.setProperty("--left", `${left}%`);
    petal.style.setProperty("--size", `${size}px`);
    petal.style.setProperty("--delay", `${delay}s`);
    petal.style.setProperty("--duration", `${8 + (index % 4)}s`);
    petal.style.setProperty("--drift", `${drift}px`);
    fragment.appendChild(petal);
  });

  petalsContainer.appendChild(fragment);
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function pseudoRandom(seed) {
  const value = Math.sin(seed * 91.3458) * 47453.5453;
  return value - Math.floor(value);
}

const isLowPerformanceDevice =
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
  (navigator.deviceMemory && navigator.deviceMemory <= 4);
const particleDensity = isLowPerformanceDevice ? 1.65 : 2.15;

function getParticleProfile(seed) {
  const level = pseudoRandom(seed);
  const variation = pseudoRandom(seed + 173);

  if (level < 0.75) {
    return {
      sizeScale: 0.65,
      baseAlpha: 0.25 + variation * 0.26,
      blur: 0,
    };
  }

  if (level < 0.95) {
    return {
      sizeScale: 1.25,
      baseAlpha: 0.4 + variation * 0.24,
      blur: 0,
    };
  }

  return {
    sizeScale: 2.1,
    baseAlpha: 0.5 + variation * 0.2,
    blur: 1.4,
  };
}

const groundLights = Array.from({ length: Math.round(900 * particleDensity) }, (_, index) => {
  const radius = 70 + Math.sqrt(pseudoRandom(index + 3)) * 1500;
  const angle = pseudoRandom(index + 41) * Math.PI * 2;
  const profile = getParticleProfile(index + 503);
  const goldenChance = radius < 650 ? 0.06 : 0.02;
  return {
    x: Math.cos(angle) * radius,
    z: Math.sin(angle) * radius,
    ...profile,
    isGolden: pseudoRandom(index + 719) < goldenChance,
  };
});

const visibleStarCount = isLowPerformanceDevice ? 360 : 560;
const skyStars = Array.from({ length: visibleStarCount }, (_, index) => {
  const x = pseudoRandom(index + 121);
  const y = pseudoRandom(index + 233);
  const profile = getParticleProfile(index + 827);
  const nearCenter = Math.hypot(x - 0.5, y - 0.54) < 0.25;
  return {
    x,
    y,
    ...profile,
    size: (0.5 + pseudoRandom(index + 341) * 0.55) * profile.sizeScale,
    isGolden: pseudoRandom(index + 1277) < (nearCenter ? 0.06 : 0.015),
  };
});

const centralSun = { x: 0, y: 42, z: 0 };
const flowerRings = [
  { name: "cercano", radius: 270, count: 8, offset: 0.18, speedAdjustment: 0.1 },
  { name: "medio", radius: 500, count: 12, offset: 0.47, speedAdjustment: 0.15 },
  { name: "lejano", radius: 750, count: 18, offset: 0.08, speedAdjustment: 0.4 },
];

const allFlowers = flowerRings.flatMap((ring, ringIndex) =>
  Array.from({ length: ring.count }, (_, flowerIndex) => {
    const ringMessages = config.frases[ring.name];
    const baseAngle = ring.offset + (flowerIndex * Math.PI * 2) / ring.count;
    const angularStep = (Math.PI * 2) / ring.count;
    const angleVariation =
      (pseudoRandom(ringIndex * 101 + flowerIndex + 17) - 0.5) * angularStep * 0.18;
    const radiusVariation =
      0.94 + pseudoRandom(ringIndex * 151 + flowerIndex + 29) * 0.12;
    const angle = baseAngle + angleVariation;
    const radius = ring.radius * radiusVariation;

    return {
      x: centralSun.x + Math.cos(angle) * radius,
      z: centralSun.z + Math.sin(angle) * radius,
      angle,
      radius,
      ringName: ring.name,
      flowerIndex,
      speedAdjustment: ring.speedAdjustment,
      phrase: ringMessages[flowerIndex % ringMessages.length],
      labelOpacity: 0,
      collisionOpacity: 0,
      scale: 0.88 + pseudoRandom(ringIndex * 211 + flowerIndex + 43) * 0.24,
    };
  }),
);

function getFlowerWorldPosition(flower, scene) {
  const angle = flower.angle + scene.orbitAngle * flower.speedAdjustment;
  return {
    x: centralSun.x + Math.cos(angle) * flower.radius,
    z: centralSun.z + Math.sin(angle) * flower.radius,
    angle,
  };
}

function resizeUniverseCanvas(measuredWidth, measuredHeight) {
  const width = measuredWidth || universeCanvas.clientWidth;
  const height = measuredHeight || universeCanvas.clientHeight;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  if (
    universeCanvas.width !== Math.round(width * pixelRatio) ||
    universeCanvas.height !== Math.round(height * pixelRatio)
  ) {
    universeCanvas.width = Math.round(width * pixelRatio);
    universeCanvas.height = Math.round(height * pixelRatio);
    staticUniverseCanvas.width = universeCanvas.width;
    staticUniverseCanvas.height = universeCanvas.height;
    sunCanvas.width = universeCanvas.width;
    sunCanvas.height = universeCanvas.height;
    staticLayersDirty = true;
  }

  universeContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  staticUniverseContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  sunContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  canvasMetrics = { width, height, pixelRatio };
  return { width, height };
}

function worldToView(x, y, z, scene) {
  const deltaX = x - scene.cameraX;
  const deltaY = y - scene.cameraY;
  const deltaZ = z - scene.cameraZ;

  return {
    x: deltaX * scene.rightX + deltaY * scene.rightY + deltaZ * scene.rightZ,
    y: deltaX * scene.upX + deltaY * scene.upY + deltaZ * scene.upZ,
    z: deltaX * scene.forwardX + deltaY * scene.forwardY + deltaZ * scene.forwardZ,
  };
}

function projectWorldPoint(x, y, z, scene) {
  const view = worldToView(x, y, z, scene);
  if (view.z <= 1) return null;

  return {
    x: scene.centerX + (view.x * scene.focalLength) / view.z,
    y: scene.centerY - (view.y * scene.focalLength) / view.z,
    depth: view.z,
  };
}

function projectGroundPoint(x, z, scene) {
  return projectWorldPoint(x, 0, z, scene);
}

function drawBackground(context, width, height, horizon) {
  const sky = context.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#010203");
  sky.addColorStop(1, "#070604");
  context.fillStyle = sky;
  context.fillRect(0, 0, width, horizon + 1);

  const ground = context.createLinearGradient(0, horizon, 0, height);
  ground.addColorStop(0, "#080704");
  ground.addColorStop(0.55, "#050504");
  ground.addColorStop(1, "#020202");
  context.fillStyle = ground;
  context.fillRect(0, horizon, width, height - horizon);
}

function drawSkyStars(context, width, height) {
  context.save();
  skyStars.forEach((star) => {
    context.globalAlpha = clamp(star.baseAlpha, 0.04, 0.58);
    context.fillStyle = star.isGolden ? "#ffe59a" : "#ffffff";
    context.shadowColor = star.isGolden
      ? "rgba(255, 207, 74, 0.35)"
      : "rgba(255, 255, 255, 0.24)";
    context.shadowBlur = star.blur;
    context.beginPath();
    context.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
    context.fill();
  });
  context.restore();
}

function drawCentralSun(context, scene) {
  const point = projectWorldPoint(centralSun.x, centralSun.y, centralSun.z, scene);
  if (!point) return;

  const previousRadius = clamp((47 * scene.focalLength) / point.depth, 10.3, 17.6);
  const radius = previousRadius * 1.4;
  const glowPulse = 1;
  const haloRadius = previousRadius * 3.36 * glowPulse;

  context.save();
  const halo = context.createRadialGradient(
    point.x,
    point.y,
    radius * 0.65,
    point.x,
    point.y,
    haloRadius,
  );
  halo.addColorStop(0, "rgba(255, 225, 70, 0.24)");
  halo.addColorStop(0.45, "rgba(255, 193, 30, 0.1)");
  halo.addColorStop(1, "rgba(255, 176, 0, 0)");
  context.fillStyle = halo;
  context.beginPath();
  context.arc(point.x, point.y, haloRadius, 0, Math.PI * 2);
  context.fill();
  context.restore();

  context.save();
  context.translate(point.x, point.y);
  context.filter = `blur(${Math.max(2, radius * 0.22)}px)`;
  context.globalCompositeOperation = "screen";
  const rayCount = 16;
  for (let index = 0; index < rayCount; index += 1) {
    context.save();
    context.rotate((index * Math.PI * 2) / rayCount);
    context.globalAlpha =
      (0.2 + pseudoRandom(index + 1409) * 0.075) * glowPulse;
    const rayLength =
      radius * (1.62 + pseudoRandom(index + 1511) * 0.58) * glowPulse;
    const rayWidth = radius * (index % 2 === 0 ? 0.1 : 0.07);
    const ray = context.createLinearGradient(0, -radius * 0.7, 0, -rayLength);
    ray.addColorStop(0, "rgba(255, 225, 92, 0.8)");
    ray.addColorStop(1, "rgba(255, 200, 25, 0)");
    context.fillStyle = ray;
    context.beginPath();
    context.ellipse(
      0,
      -(radius * 0.72 + rayLength) / 2,
      rayWidth,
      (rayLength - radius * 0.72) / 2,
      0,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.restore();
  }
  context.restore();

  context.save();
  context.shadowColor = "rgba(255, 211, 35, 0.65)";
  context.shadowBlur = 14 * glowPulse;
  const sunGradient = context.createRadialGradient(
    point.x - radius * 0.25,
    point.y - radius * 0.3,
    1,
    point.x,
    point.y,
    radius,
  );
  sunGradient.addColorStop(0, "#fff7a8");
  sunGradient.addColorStop(0.48, "#ffe13d");
  sunGradient.addColorStop(1, "#d99300");
  context.fillStyle = sunGradient;
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawGroundLights(context, scene) {
  groundLights.forEach((light) => {
    const point = projectGroundPoint(light.x, light.z, scene);
    if (!point || point.x < -4 || point.x > scene.width + 4 || point.y > scene.height + 4) return;

    const size = clamp((170 / point.depth) * 1.8 * light.sizeScale, 0.28, 2.8);
    context.globalAlpha = clamp(light.baseAlpha, 0.035, 0.56);
    context.fillStyle = light.isGolden ? "#ffe27b" : "#ffffff";
    context.beginPath();
    context.arc(point.x, point.y, size, 0, Math.PI * 2);
    context.fill();
  });
  context.globalAlpha = 1;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function smoothstep(start, end, value) {
  const progress = clamp((value - start) / (end - start), 0, 1);
  return progress * progress * (3 - 2 * progress);
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function getLabelAngleVisibility(flowerAngle, scene) {
  const relativeAngle = normalizeDegrees(
    ((flowerAngle - scene.orbitAngle) * 180) / Math.PI + 270,
  );

  if (relativeAngle < 190 || relativeAngle > 350) return 0;
  if (relativeAngle < 200) return smoothstep(190, 200, relativeAngle);
  if (relativeAngle <= 340) return 1;
  return 1 - smoothstep(340, 350, relativeAngle);
}

function getFlowerLayout(flower, point, scene) {
  const size = clamp((62 * scene.focalLength * flower.scale) / point.depth, 9, 108);
  const labelTextScale = scene.width < 600 ? 1.6 : 1.3;
  const fontSize = clamp(size * 0.18, 9, 16) * labelTextScale;
  const labelGap = clamp(size * 0.09, 3, 9);
  const estimatedWidth = clamp(
    flower.phrase.length * fontSize * 0.54,
    34 * labelTextScale,
    132 * labelTextScale,
  );
  const labelX = point.x;
  const labelY = point.y + labelGap;

  return {
    size,
    fontSize,
    labelX,
    labelY,
    labelBounds: {
      left: labelX - estimatedWidth / 2 - 5,
      right: labelX + estimatedWidth / 2 + 5,
      top: labelY - 4,
      bottom: labelY + fontSize * 1.45 + 4,
    },
  };
}

function rectanglesOverlap(first, second, padding = 7) {
  return !(
    first.right + padding < second.left ||
    first.left > second.right + padding ||
    first.bottom + padding < second.top ||
    first.top > second.bottom + padding
  );
}

function updateFlowerLabels(scene, projectedFlowers) {
  const maximumVisibleLabels = scene.width < 440 ? 9 : 13;
  const candidates = projectedFlowers
    .map(({ flower, point, position, layout }) => {
      if (!flower.phrase) return null;
      const angleVisibility = getLabelAngleVisibility(position.angle, scene);
      if (angleVisibility <= 0) return null;

      return {
        flower,
        point,
        layout,
        angleVisibility,
        score: angleVisibility + flower.collisionOpacity * 0.18 - point.depth * 0.00008,
      };
    })
    .filter(Boolean)
    .sort((first, second) => second.score - first.score);

  const selectedFlowers = new Set();
  const occupiedBounds = [];

  candidates.some((candidate) => {
    const overlaps = occupiedBounds.some((bounds) =>
      rectanglesOverlap(candidate.layout.labelBounds, bounds),
    );

    if (!overlaps) {
      selectedFlowers.add(candidate.flower);
      occupiedBounds.push(candidate.layout.labelBounds);
    }

    return selectedFlowers.size >= maximumVisibleLabels;
  });

  const candidateFlowers = new Set(candidates.map(({ flower }) => flower));
  allFlowers.forEach((flower) => {
    const collisionTarget = selectedFlowers.has(flower) ? 1 : 0;
    const collisionFadeSpeed = prefersReducedMotion ? 1 : 0.1;
    flower.collisionOpacity +=
      (collisionTarget - flower.collisionOpacity) * collisionFadeSpeed;
    if (!candidateFlowers.has(flower)) flower.labelOpacity = 0;
  });

  candidates.forEach(({ flower, angleVisibility }) => {
    flower.labelOpacity = angleVisibility * flower.collisionOpacity;
  });
}

function drawFlowerLabel(text, x, y, fontSize, opacity) {
  if (!text) return;

  universeContext.save();
  universeContext.globalAlpha = opacity;
  universeContext.font = `${fontSize}px "Segoe Print", "Comic Sans MS", cursive`;
  universeContext.textAlign = "center";
  universeContext.textBaseline = "top";
  universeContext.lineWidth = Math.max(2, fontSize * 0.22);
  universeContext.strokeStyle = "rgba(0, 0, 0, 0.82)";
  universeContext.fillStyle = "#fff5c2";
  universeContext.shadowColor = "rgba(255, 216, 60, 0.72)";
  universeContext.shadowBlur = 7;
  universeContext.strokeText(text, x, y);
  universeContext.fillText(text, x, y);
  universeContext.restore();
}

function drawFlower(point, layout) {
  if (!sunflowerImage.complete || sunflowerImage.naturalWidth === 0) return;

  const { size } = layout;
  universeContext.save();
  universeContext.shadowColor = "rgba(255, 199, 30, 0.48)";
  universeContext.shadowBlur = Math.max(2, size * 0.12);
  universeContext.translate(point.x, point.y);
  universeContext.drawImage(sunflowerImage, -size / 2, -size, size, size);
  universeContext.restore();
}

function getProjectedFlowers(scene) {
  return allFlowers
    .map((flower) => {
      const position = getFlowerWorldPosition(flower, scene);
      const point = projectGroundPoint(position.x, position.z, scene);
      return point
        ? { flower, position, point, layout: getFlowerLayout(flower, point, scene) }
        : null;
    })
    .filter(Boolean)
    .sort((first, second) => second.point.depth - first.point.depth);
}

function drawFlowers(scene, layer, projectedFlowers) {
  const sunDepth = worldToView(centralSun.x, centralSun.y, centralSun.z, scene).z;
  projectedFlowers.forEach(({ flower, point, layout }) => {
    const isBehind = point.depth > sunDepth;
    if ((layer === "behind") !== isBehind) return;
    if (point.x < -100 || point.x > scene.width + 100 || point.y > scene.height + 90) return;

    drawFlower(point, layout);

    if (flower.phrase && flower.labelOpacity > 0) {
      drawFlowerLabel(
        flower.phrase,
        layout.labelX,
        layout.labelY,
        layout.fontSize,
        flower.labelOpacity,
      );
    }
  });
}

function createScene(width, height, requestedOrbitAngle) {
  const orbitAngle = prefersReducedMotion ? 0 : requestedOrbitAngle;
  const cameraOrbitRadius = 900;
  const cameraX = centralSun.x + Math.cos(orbitAngle) * cameraOrbitRadius;
  const cameraY = centralSun.y + Math.tan(Math.PI / 6) * cameraOrbitRadius;
  const cameraZ = centralSun.z + Math.sin(orbitAngle) * cameraOrbitRadius;
  const targetDeltaX = centralSun.x - cameraX;
  const targetDeltaY = centralSun.y - cameraY;
  const targetDeltaZ = centralSun.z - cameraZ;
  const targetDistance = Math.hypot(targetDeltaX, targetDeltaY, targetDeltaZ);
  const forwardX = targetDeltaX / targetDistance;
  const forwardY = targetDeltaY / targetDistance;
  const forwardZ = targetDeltaZ / targetDistance;
  const horizontalForwardLength = Math.hypot(forwardX, forwardZ);
  const rightX = -forwardZ / horizontalForwardLength;
  const rightY = 0;
  const rightZ = forwardX / horizontalForwardLength;
  return {
    width,
    height,
    orbitAngle,
    centerX: width / 2,
    centerY: height * 0.29,
    horizon: height * 0.16,
    focalLength: height * 0.65,
    cameraX,
    cameraY,
    cameraZ,
    forwardX,
    forwardY,
    forwardZ,
    rightX,
    rightY,
    rightZ,
    upX: -rightZ * forwardY,
    upY: rightZ * forwardX - rightX * forwardZ,
    upZ: rightX * forwardY,
  };
}

function renderStaticLayers(scene) {
  const { width, height, pixelRatio } = canvasMetrics;
  staticUniverseContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  staticUniverseContext.clearRect(0, 0, width, height);
  drawBackground(staticUniverseContext, width, height, scene.horizon);
  drawSkyStars(staticUniverseContext, width, height);
  drawGroundLights(staticUniverseContext, scene);

  sunContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  sunContext.clearRect(0, 0, width, height);
  drawCentralSun(sunContext, scene);
  staticLayersDirty = false;
}

function renderUniverse(timestamp = 0) {
  if (!canvasMetrics.width || !canvasMetrics.height) resizeUniverseCanvas();
  const { width, height } = canvasMetrics;
  if (!width || !height) return;

  if (animationStartTime === null) animationStartTime = timestamp - elapsedBeforePause;
  const elapsed = timestamp - animationStartTime;
  // 27.5 s = 16.5 s / 0.60: conserva exactamente el 60 % de la velocidad anterior.
  const orbitDuration = 27500;
  const orbitAngle = prefersReducedMotion ? 0 : (elapsed / orbitDuration) * Math.PI * 2;
  const scene = createScene(width, height, orbitAngle);

  if (staticLayersDirty) renderStaticLayers(createScene(width, height, 0));
  const projectedFlowers = getProjectedFlowers(scene);

  universeContext.clearRect(0, 0, width, height);
  universeContext.drawImage(staticUniverseCanvas, 0, 0, width, height);
  updateFlowerLabels(scene, projectedFlowers);
  drawFlowers(scene, "behind", projectedFlowers);
  universeContext.drawImage(sunCanvas, 0, 0, width, height);
  drawFlowers(scene, "front", projectedFlowers);

  if (!prefersReducedMotion && app.classList.contains("is-open") && !document.hidden) {
    animationFrameId = requestAnimationFrame(renderUniverse);
  }
}

function startUniverse() {
  if (animationFrameId || prefersReducedMotion) {
    if (prefersReducedMotion) renderUniverse(performance.now());
    return;
  }
  animationStartTime = null;
  animationFrameId = requestAnimationFrame((timestamp) => {
    animationFrameId = 0;
    renderUniverse(timestamp);
  });
}

function pauseUniverse() {
  if (animationStartTime !== null) {
    elapsedBeforePause = performance.now() - animationStartTime;
  }
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = 0;
  animationStartTime = null;
}

if ("ResizeObserver" in window) {
  new ResizeObserver(([entry]) => {
    if (!entry) return;
    resizeUniverseCanvas(entry.contentRect.width, entry.contentRect.height);
  }).observe(universeCanvas);
} else {
  window.addEventListener("resize", () => resizeUniverseCanvas(), { passive: true });
}

// Prepara el trabajo pesado cuando el navegador esté libre, no dentro del primer toque.
if ("requestIdleCallback" in window) {
  requestIdleCallback(
    () => {
      if (!canvasMetrics.width || !canvasMetrics.height) resizeUniverseCanvas();
      if (staticLayersDirty && canvasMetrics.width && canvasMetrics.height) {
        renderStaticLayers(createScene(canvasMetrics.width, canvasMetrics.height, 0));
      }
    },
    { timeout: 1500 },
  );
}

function applyConfigToPage(activeConfig = config) {
  recipientTitle.textContent = `Para ${activeConfig.para}`;
  personalMessage.textContent = activeConfig.mensaje;
  signature.textContent = `— ${activeConfig.de}`;

  allFlowers.forEach((flower) => {
    const ringMessages = activeConfig.frases[flower.ringName];
    flower.phrase = ringMessages[flower.flowerIndex % ringMessages.length];
  });
}

cosmicTitle.textContent = universeConfig.title;
cosmicTitle.hidden = !universeConfig.title;
applyConfigToPage();
createPetals();

if ("IntersectionObserver" in window) {
  const closingCardObserver = new IntersectionObserver(
    ([entry], observer) => {
      if (!entry.isIntersecting) return;
      closingCard.classList.add("is-visible");
      observer.unobserve(closingCard);
    },
    {
      root: messageScreen,
      threshold: 0.18,
      rootMargin: "0px 0px -24px",
    },
  );

  closingCardObserver.observe(closingCard);
} else {
  closingCard.classList.add("is-visible");
}

function updateMusicButton(isPlaying) {
  const action = isPlaying ? "Pausar música" : "Reproducir música";
  musicButton.classList.toggle("is-paused", !isPlaying);
  musicButton.textContent = isPlaying ? "♪" : "♩";
  musicButton.setAttribute("aria-label", action);
  musicButton.title = action;
}

async function playMusic() {
  backgroundMusic.volume = 0.35;

  try {
    await backgroundMusic.play();
    updateMusicButton(true);
  } catch {
    updateMusicButton(false);
  }
}

openButton.addEventListener("click", () => {
  app.classList.add("is-open");
  welcomeScreen.setAttribute("aria-hidden", "true");
  messageScreen.setAttribute("aria-hidden", "false");
  startUniverse();
  playMusic();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pauseUniverse();
  } else if (app.classList.contains("is-open")) {
    startUniverse();
  }
});

musicButton.addEventListener("click", () => {
  if (backgroundMusic.paused) {
    playMusic();
    return;
  }

  backgroundMusic.pause();
  updateMusicButton(false);
});

// GENERATOR_ONLY_START
const generatorForm = document.querySelector("#generator-form");
const generatorFor = document.querySelector("#generator-for");
const generatorFrom = document.querySelector("#generator-from");
const generatorMessage = document.querySelector("#generator-message");
const phraseFields = document.querySelector("#phrase-fields");
const previewButton = document.querySelector("#preview-button");
const downloadButton = document.querySelector("#download-button");
const generatorStatus = document.querySelector("#generator-status");
const editablePhraseSlots = Object.entries(defaultConfig.frases).flatMap(
  ([ringName, phrases]) => phrases.map((_, phraseIndex) => [ringName, phraseIndex]),
);

function createPhraseFields() {
  const fragment = document.createDocumentFragment();

  editablePhraseSlots.forEach(([ringName, phraseIndex], fieldIndex) => {
    const wrapper = document.createElement("div");
    const label = document.createElement("label");
    const input = document.createElement("input");
    const inputId = `generator-phrase-${fieldIndex}`;

    wrapper.className = "phrase-field";
    label.htmlFor = inputId;
    label.textContent = `${ringName} ${phraseIndex + 1}`;
    input.id = inputId;
    input.type = "text";
    input.maxLength = 30;
    input.placeholder = defaultConfig.frases[ringName][phraseIndex];
    input.dataset.ring = ringName;
    input.dataset.index = String(phraseIndex);
    wrapper.append(label, input);
    fragment.appendChild(wrapper);
  });

  phraseFields.appendChild(fragment);
}

function initializeGenerator() {
  generatorFor.value = config.para;
  generatorFrom.value = config.de;
  generatorMessage.value = config.mensaje;
  createPhraseFields();
}

function cloneDefaultPhrases() {
  return JSON.parse(JSON.stringify(defaultConfig.frases));
}

function collectGeneratorConfig() {
  const requiredFields = [generatorFor, generatorFrom, generatorMessage];

  requiredFields.forEach((field) => {
    field.setCustomValidity(field.value.trim() ? "" : "Completa este campo.");
  });

  if (!generatorForm.reportValidity()) return null;

  const phrases = cloneDefaultPhrases();
  phraseFields.querySelectorAll("input").forEach((input) => {
    const value = input.value.trim();
    if (!value) return;
    phrases[input.dataset.ring][Number(input.dataset.index)] = value;
  });

  return {
    para: generatorFor.value.trim(),
    de: generatorFrom.value.trim(),
    mensaje: generatorMessage.value.trim(),
    frases: phrases,
  };
}

function updateActiveConfig(nextConfig) {
  config.para = nextConfig.para;
  config.de = nextConfig.de;
  config.mensaje = nextConfig.mensaje;
  config.frases = JSON.parse(JSON.stringify(nextConfig.frases));
  applyConfigToPage(config);
}

function slugifyName(value) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "personalizado"
  );
}

function safeJson(value) {
  return JSON.stringify(value, null, 2)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function removeGeneratorFromHtml(source) {
  const documentCopy = new DOMParser().parseFromString(source, "text/html");
  documentCopy.querySelector("#generator-panel")?.remove();
  return `<!DOCTYPE html>\n${documentCopy.documentElement.outerHTML}`;
}

function removeGeneratorCss(source) {
  return source.replace(
    /\/\* GENERATOR_ONLY_START \*\/[\s\S]*?\/\* GENERATOR_ONLY_END \*\//g,
    "",
  );
}

function createPersonalizedScript(source, personalizedConfig) {
  const configBlock = `// CONFIG_START\nconst config = ${safeJson(personalizedConfig)};\n// CONFIG_END`;
  return source
    .replace(/\/\/ CONFIG_START[\s\S]*?\/\/ CONFIG_END/, configBlock)
    .replace(/\/\/ GENERATOR_ONLY_START[\s\S]*?\/\/ GENERATOR_ONLY_END/g, "");
}

async function fetchFile(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`No se pudo cargar ${path}.`);
  return new Uint8Array(await response.arrayBuffer());
}

const crcTable = Array.from({ length: 256 }, (_, tableIndex) => {
  let value = tableIndex;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function calculateCrc32(bytes) {
  let crc = 0xffffffff;
  bytes.forEach((byte) => {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
  };
}

function createZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  const { date, time } = getDosDateTime(new Date());
  let localOffset = 0;
  let centralSize = 0;

  files.forEach((file) => {
    const name = encoder.encode(file.name.replace(/\\/g, "/"));
    const data = file.data instanceof Uint8Array ? file.data : encoder.encode(file.data);
    const crc = calculateCrc32(data);
    const localHeader = new Uint8Array(30 + name.length);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, time, true);
    localView.setUint16(12, date, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, name.length, true);
    localHeader.set(name, 30);
    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + name.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, time, true);
    centralView.setUint16(14, date, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, localOffset, true);
    centralHeader.set(name, 46);
    centralParts.push(centralHeader);

    localOffset += localHeader.length + data.length;
    centralSize += centralHeader.length;
  });

  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, localOffset, true);

  return new Blob([...localParts, ...centralParts, endRecord], {
    type: "application/zip",
  });
}

async function buildPersonalizedZip(personalizedConfig) {
  const decoder = new TextDecoder();
  const [htmlBytes, cssBytes, scriptBytes, flowerImage, music] = await Promise.all([
    fetchFile("index.html"),
    fetchFile("style.css"),
    fetchFile("script.js"),
    fetchFile("assets/girasol-joven.png"),
    fetchFile("assets/there-is-romance.mp3"),
  ]);

  const finalHtml = removeGeneratorFromHtml(decoder.decode(htmlBytes));
  const finalCss = removeGeneratorCss(decoder.decode(cssBytes));
  const finalScript = createPersonalizedScript(decoder.decode(scriptBytes), personalizedConfig);

  return createZip([
    { name: "index.html", data: finalHtml },
    { name: "style.css", data: finalCss },
    { name: "script.js", data: finalScript },
    { name: "assets/girasol-joven.png", data: flowerImage },
    { name: "assets/there-is-romance.mp3", data: music },
  ]);
}

previewButton.addEventListener("click", () => {
  const nextConfig = collectGeneratorConfig();
  if (!nextConfig) return;

  updateActiveConfig(nextConfig);
  generatorStatus.textContent = "Vista previa actualizada.";
  messageScreen.scrollTo({ top: 0, behavior: "smooth" });
});

downloadButton.addEventListener("click", async () => {
  const nextConfig = collectGeneratorConfig();
  if (!nextConfig) return;

  downloadButton.disabled = true;
  previewButton.disabled = true;
  generatorStatus.textContent = "Preparando tu ZIP...";

  try {
    updateActiveConfig(nextConfig);
    const zip = await buildPersonalizedZip(nextConfig);
    const downloadUrl = URL.createObjectURL(zip);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `flores-${slugifyName(nextConfig.para)}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    generatorStatus.textContent = "ZIP listo para subir a Netlify.";
  } catch (error) {
    console.error(error);
    generatorStatus.textContent =
      "No se pudo crear el ZIP. Abre la página con Live Server e inténtalo nuevamente.";
  } finally {
    downloadButton.disabled = false;
    previewButton.disabled = false;
  }
});

initializeGenerator();
// GENERATOR_ONLY_END
