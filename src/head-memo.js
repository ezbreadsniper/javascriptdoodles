/**
 * Per-head memo for pose-independent skull queries. A character's `head` is
 * the same object for its whole life, and the renderer asks the same
 * questions of it at the same coordinates every frame, so the answers are
 * kept alongside it. Cached answers are shared: callers must not mutate them.
 */
const headMemo = new WeakMap();
const MAX_ANSWERS_PER_HEAD = 50000;

export function memoizeForHead(head, key, compute) {
  let answers = headMemo.get(head);
  if (!answers) headMemo.set(head, (answers = new Map()));
  if (answers.size > MAX_ANSWERS_PER_HEAD) answers.clear();
  let answer = answers.get(key);
  if (answer === undefined) answers.set(key, (answer = compute()));
  return answer;
}
