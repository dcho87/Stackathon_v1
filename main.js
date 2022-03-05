import * as faceapi from "./libs/face-api.esm.js";
const THREE = window.MINDAR.FACE.THREE;
const loader = new THREE.TextureLoader();

document.addEventListener("DOMContentLoaded", () => {
  const start = async () => {
    const optionsTinyFace = new faceapi.TinyFaceDetectorOptions({
      inputSize: 128, //size at which image is processed ; smaller the faster ; must be divisble by 32
      scoreThreshold: 0.3,
    });
    const models = "./models/";
    await faceapi.nets.tinyFaceDetector.load(models);
    await faceapi.nets.faceLandmark68Net.load(models);
    await faceapi.nets.faceExpressionNet.load(models);

    const mindarThree = new window.MINDAR.FACE.MindARThree({
      container: document.body,
    });
    const { renderer, scene, camera } = mindarThree;

    const textures = {};

    textures["angry"] = await loader.load("./emojis/angry.jpeg");
    textures["fearful"] = await loader.load("./emojis/fearful.png");
    textures["happy"] = await loader.load("./emojis/happy.png");
    textures["neutral"] = await loader.load("./emojis/neutral.jpeg");
    textures["sad"] = await loader.load("./emojis/sad.png");

    const geometry = new THREE.PlaneGeometry(0.5, 0.5);
    const material = new THREE.MeshBasicMaterial({ map: textures["neutral"] });
    const plane = new THREE.Mesh(geometry, material);
    const anchor = mindarThree.addAnchor(10);
    anchor.group.add(plane);

    await mindarThree.start();
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    const video = mindarThree.video;

    const expressions = ["happy", "sad", "angry", "neutral", "fearful"];

    let lastExpression = "neutral";

    const detection = async () => {
      const results = await faceapi
        .detectSingleFace(video, optionsTinyFace)
        .withFaceLandmarks()
        .withFaceExpressions();

      if (results && results.expressions) {
        let newExpression = "neutral";
        for (let i = 0; i < expressions.length; i++) {
          if (results.expressions[expressions[i]] > 0.5) {
            newExpression = expressions[i];
          }
        }
        if (newExpression !== lastExpression) {
          material.map = textures[newExpression];
          material.needsUpdate = true;
        }
        lastExpression = newExpression;
      }
      window.requestAnimationFrame(detection);
    };
    window.requestAnimationFrame(detection);

    const stopButton = document.querySelector("#stopButton");
    stopButton.addEventListener("click", () => {
      mindarThree.stop();
      mindarThree.renderer.setAnimationLoop(null);
      window.location.reload();
    });
  };
  const startButton = document.querySelector("#startButton");
  startButton.addEventListener("click", () => {
    start();
  });
});
