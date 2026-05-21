let manifestPromise = null;

export function loadManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch('/data/lessons.json').then((res) => {
      if (!res.ok) throw new Error(`lessons.json: ${res.status}`);
      return res.json();
    });
  }
  return manifestPromise;
}

export function findLesson(manifest, id) {
  return manifest.lessons.find((l) => l.id === id) || null;
}
