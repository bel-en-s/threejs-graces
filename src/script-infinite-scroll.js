const lerp = (start, end, factor) => start + (end - start) * factor;

const config = {
  SCROLL_SPEED: 0.75,
  LERP_FACTOR: 0.05,
  BUFFER_SIZE: 15,
  CLEANUP_THRESHOLD: 50,
  MAX_VELOCITY: 120,
  SNAP_DURATION: 500,
};

const projectData = [
  { title: "Rauw Alejando", image: "assets/img2.jpeg", isAlternate: false },
  { title: "Tienda Lizboa", image: "textures/1.jpg", isAlternate: true },
  { title: "Filoza", image: "textures/1.jpg", isAlternate: false },
  { title: "Liquid Soleil", image: "textures/1.jpg", isAlternate: true },
  { title: "Vacuum", image: "textures/1.jpg", isAlternate: false },
  { title: "Synthesis", image: "textures/1.jpg", isAlternate: true },
];

const state = {
  currentY: 0,
  targetY: 0,
  lastY: 0,
  scrollVelocity: 0,
  isDragging: false,
  startY: 0,
  projects: new Map(),
  parallaxImages: new Map(),
  projectHeight: window.innerHeight,
  isSnapping: false,
  snapStartTime: 0,
  snapStartY: 0,
  snapTargetY: 0,
  lastScrollTime: Date.now(),
  isScrolling: false,
};

function preloadImages(imageUrls, callback) {
  let loaded = 0;
  const total = imageUrls.length;

  imageUrls.forEach((url) => {
    const img = new Image();
    img.src = url;
    img.onload = img.onerror = () => {
      loaded++;
      if (loaded === total) callback();
    };
  });
}

const createParallaxImage = (imageElement) => {
  let bounds = null;
  let currentTranslateY = 0;
  let targetTranslateY = 0;

  const updateBounds = () => {
    const rect = imageElement.getBoundingClientRect();
    bounds = {
      top: rect.top + window.scrollY,
      bottom: rect.bottom + window.scrollY,
    };
  };

  const update = (scroll) => {
    if (!bounds) return;
    const relativeScroll = -scroll - bounds.top;
    targetTranslateY = relativeScroll * 0.2;
    currentTranslateY = lerp(currentTranslateY, targetTranslateY, 0.1);
    imageElement.style.transform = `translateY(${currentTranslateY}px) scale(1.5)`;
  };

  updateBounds();
  return { update, updateBounds };
};

const getProjectData = (index) => {
  const dataIndex = ((Math.abs(index) % projectData.length) + projectData.length) % projectData.length;
  return projectData[dataIndex];
};

const createProjectElement = (index) => {
  if (state.projects.has(index)) return;

  const template = document.querySelector(".template");
  if (!template) return console.error("Template element not found");

  const project = template.cloneNode(true);
  project.classList.remove("template");
  project.classList.add("project");
  project.style.display = "flex";

  const data = getProjectData(index);
  const projectNumber = (index % projectData.length + projectData.length) % projectData.length + 1;

  const sides = project.querySelectorAll(".side");
  const imgs = project.querySelectorAll("img");
  const titles = project.querySelectorAll("h1");

  if (data.isAlternate) {
    if (imgs[0] && titles[0] && titles[1]) {
      imgs[0].src = data.image;
      imgs[0].alt = data.title;
      titles[0].textContent = data.title;
      titles[1].textContent = String(projectNumber).padStart(2, "0");
    }
  } else {
    if (imgs[0] && titles[0] && titles[1]) {
      imgs[0].src = data.image;
      imgs[0].alt = data.title;
      titles[0].textContent = data.title;
      titles[1].textContent = String(projectNumber).padStart(2, "0");
      if (sides.length === 2) {
        sides[0].parentNode.insertBefore(sides[1], sides[0]);
      }
    }
  }

  project.style.transform = `translateY(${index * state.projectHeight}px)`;

  const projectList = document.querySelector(".project-list");
  if (projectList) {
    projectList.appendChild(project);
    state.projects.set(index, project);
  } else {
    console.error("Project list not found");
    return;
  }

  const img = project.querySelector("img");
  if (img) {
    const fullPath = new URL(data.image, window.location.href).href;
    console.log(`Cargando imagen: ${fullPath}`);
    img.onerror = () => console.error(`❌ No se pudo cargar la imagen: ${data.image}`);
    img.onload = () => console.log(`✅ Imagen cargada: ${data.image}`);
    state.parallaxImages.set(index, createParallaxImage(img));
  }
};

const createInitialProjects = () => {
  for (let i = -config.BUFFER_SIZE; i <= config.BUFFER_SIZE; i++) {
    createProjectElement(i);
  }
};

const getCurrentIndex = () => Math.round(-state.targetY / state.projectHeight);

const checkAndCreateProjects = () => {
  const currentIndex = getCurrentIndex();
  const min = currentIndex - config.BUFFER_SIZE;
  const max = currentIndex + config.BUFFER_SIZE;

  for (let i = min; i <= max; i++) {
    if (!state.projects.has(i)) {
      createProjectElement(i);
    }
  }

  state.projects.forEach((project, index) => {
    if (index < currentIndex - config.CLEANUP_THRESHOLD || index > currentIndex + config.CLEANUP_THRESHOLD) {
      project.remove();
      state.projects.delete(index);
      state.parallaxImages.delete(index);
    }
  });
};

const getClosestSnapPoint = () => {
  const index = Math.round(-state.targetY / state.projectHeight);
  return -index * state.projectHeight;
};

const initiateSnap = () => {
  state.isSnapping = true;
  state.snapStartTime = Date.now();
  state.snapStartY = state.targetY;
  state.snapTargetY = getClosestSnapPoint();
};

const updateSnap = () => {
  const elapsed = Date.now() - state.snapStartTime;
  const progress = Math.min(elapsed / config.SNAP_DURATION, 1);
  const t = 1 - Math.pow(1 - progress, 3);
  state.targetY = state.snapStartY + (state.snapTargetY - state.snapStartY) * t;
  if (progress >= 1) {
    state.isSnapping = false;
    state.targetY = state.snapTargetY;
  }
};

const animate = () => {
  const now = Date.now();
  const idle = now - state.lastScrollTime;

  if (!state.isSnapping && !state.isDragging && idle > 100) {
    const snapPoint = getClosestSnapPoint();
    if (Math.abs(state.targetY - snapPoint) > 1) initiateSnap();
  }

  if (state.isSnapping) updateSnap();

  if (!state.isDragging) {
    state.currentY += (state.targetY - state.currentY) * config.LERP_FACTOR;
  }

  checkAndCreateProjects();

  state.projects.forEach((project, index) => {
    const y = index * state.projectHeight + state.currentY;
    project.style.transform = `translateY(${y}px)`;
    const parallax = state.parallaxImages.get(index);
    if (parallax) parallax.update(state.currentY);
  });

  requestAnimationFrame(animate);
};

const handleWheel = (e) => {
  e.preventDefault();
  state.isSnapping = false;
  state.lastScrollTime = Date.now();
  const delta = e.deltaY * config.SCROLL_SPEED;
  state.targetY -= Math.max(Math.min(delta, config.MAX_VELOCITY), -config.MAX_VELOCITY);
};

const handleTouchStart = (e) => {
  state.isDragging = true;
  state.isSnapping = false;
  state.startY = e.touches[0].clientY;
  state.lastY = state.targetY;
  state.lastScrollTime = Date.now();
};

const handleTouchMove = (e) => {
  if (!state.isDragging) return;
  const delta = (e.touches[0].clientY - state.startY) * 1.5;
  state.targetY = state.lastY + delta;
  state.lastScrollTime = Date.now();
};

const handleTouchEnd = () => {
  state.isDragging = false;
};

const handleResize = () => {
  state.projectHeight = window.innerHeight;
  state.projects.forEach((project, index) => {
    project.style.transform = `translateY(${index * state.projectHeight}px)`;
    const parallax = state.parallaxImages.get(index);
    if (parallax) parallax.updateBounds();
  });
};

const initializeScroll = () => {
  window.removeEventListener("wheel", handleWheel, { passive: false });
  window.removeEventListener("touchstart", handleTouchStart);
  window.removeEventListener("touchmove", handleTouchMove);
  window.removeEventListener("touchend", handleTouchEnd);
  window.removeEventListener("resize", handleResize);

  window.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("touchstart", handleTouchStart);
  window.addEventListener("touchmove", handleTouchMove);
  window.addEventListener("touchend", handleTouchEnd);
  window.addEventListener("resize", handleResize);

  createInitialProjects();
  window.__scrollStarted = true;
  animate();
};

window.startInfiniteScroll = () => {
  const urls = projectData.map(p => p.image);
  preloadImages(urls, () => {
    console.log("✅ Todas las imágenes precargadas.");
    initializeScroll();
  });
};
