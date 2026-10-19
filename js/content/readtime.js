/* Read time from the words on the page.
   200 words a minute, plus 3 minutes for each runnable exercise, rounded, at least 2. */

export function lessonPlainText(lesson) {
  const parts = [];
  const push = (value) => {
    if (value) parts.push(String(value));
  };
  push(lesson.title);
  push(lesson.summary);
  push(lesson.diagramCaption);
  push(lesson.mistake);
  (lesson.learn || []).forEach(push);
  (lesson.sections || []).forEach((section) => {
    push(section.heading);
    push(String(section.html || "").replace(/<[^>]+>/g, " "));
  });
  if (lesson.exercise) push(lesson.exercise.prompt);
  (lesson.check || []).forEach((question) => {
    push(question.prompt);
    (question.choices || []).forEach(push);
    push(question.why);
  });
  if (lesson.sample) {
    push(lesson.sample.code);
    push(lesson.sample.output);
    push(lesson.sample.note);
  }
  return parts.join(" ");
}

export function lessonWords(lesson) {
  const words = lessonPlainText(lesson).match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g);
  return words ? words.length : 0;
}

/* A lesson counts as one runnable exercise when it has an exercise object. */
export function lessonMinutes(lesson) {
  const exercises = lesson.exercise ? 1 : 0;
  return Math.max(2, Math.round(lessonWords(lesson) / 200) + exercises * 3);
}

export function stampMinutes(tracks) {
  tracks.forEach((track) => {
    track.lessons.forEach((lesson) => {
      lesson.words = lessonWords(lesson);
      lesson.minutes = lessonMinutes(lesson);
    });
  });
}
