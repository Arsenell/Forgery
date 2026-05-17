# Blade Archive

Blade Archive is a cinematic fantasy sword showcase website for a university 3D interactive web application coursework project.

## Technologies

- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- Three.js
- WebGL
- GLTF/GLB models
- OrbitControls
- Post-processing bloom

## Features

- Responsive dark fantasy UI
- Interactive Three.js sword viewer
- Three switchable GLB sword models
- Orbit camera controls
- Lighting rigs for material, forge, and studio viewing
- Camera view buttons for full, blade, hilt, and profile views
- Exposure control
- Wireframe toggle
- Ambient/interaction audio system with procedural fallbacks
- Collection cards with 3D previews

## Running Locally

Use a local web server so the GLB models load correctly:

```bash
python -m http.server 5173
```

Then open:

```text
http://127.0.0.1:5173
```

## Coursework Notes

The project demonstrates WebGL rendering, model loading, camera control, lighting control, 3D content swapping, UI interaction, responsive design, and media integration.
