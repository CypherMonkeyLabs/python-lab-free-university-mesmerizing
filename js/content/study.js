/* Study size of a level, counted from the lessons that level links to. */
import { levels } from "./levels.js";
import { tracks } from "./catalog.js";
import { sectionFor } from "./sections.js";

function addLesson(keys, trackId, lessonId) {
  const track = tracks.find((item) => item.id === trackId);
  const lesson = track?.lessons.find((item) => item.id === lessonId);
  if (lesson) keys.add(`${trackId}/${lessonId}`);
}

export function studySpan(levelN) {
  const level = levels.find((item) => item.n === Number(levelN));
  const keys = new Set();
  if (!level) return { lessons: 0, minutes: 0 };
  for (const href of level.lessons) {
    let match = href.match(/^#\/lesson\/([a-z]+)\/([a-z0-9-]+)/);
    if (match) {
      addLesson(keys, match[1], match[2]);
      continue;
    }
    match = href.match(/^#\/track\/([a-z]+)/);
    if (match) {
      const track = tracks.find((item) => item.id === match[1]);
      track?.lessons.forEach((lesson) => keys.add(`${track.id}/${lesson.id}`));
      continue;
    }
    match = href.match(/^#\/section\/([a-z]+)/);
    if (match) {
      tracks.forEach((track) => {
        track.lessons.forEach((lesson) => {
          if (sectionFor(`#/lesson/${track.id}/${lesson.id}`) === match[1]) keys.add(`${track.id}/${lesson.id}`);
        });
      });
    }
  }
  let minutes = 0;
  keys.forEach((key) => {
    const [trackId, lessonId] = key.split("/");
    const track = tracks.find((item) => item.id === trackId);
    const lesson = track?.lessons.find((item) => item.id === lessonId);
    minutes += lesson?.minutes || 0;
  });
  return { lessons: keys.size, minutes };
}

export function studyLabel(levelN) {
  const span = studySpan(levelN);
  return `about ${span.lessons} lessons, about ${span.minutes} min`;
}
