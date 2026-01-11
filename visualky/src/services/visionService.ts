import { ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision";

let objectDetector: ObjectDetector | null = null;
let runningMode: "IMAGE" | "VIDEO" = "VIDEO";

export const initializeObjectDetector = async () => {
    if (objectDetector) return objectDetector;

    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    objectDetector = await ObjectDetector.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
            delegate: "GPU"
        },
        scoreThreshold: 0.5,
        runningMode: runningMode
    });

    return objectDetector;
};

export const detectObjects = async (video: HTMLVideoElement) => {
    if (!objectDetector) {
        await initializeObjectDetector();
    }

    if (objectDetector) {
        // If the video is not ready, return empty
        if (video.currentTime === 0) return [];

        const detections = objectDetector.detectForVideo(video, performance.now());
        return detections.detections;
    }
    return [];
};
