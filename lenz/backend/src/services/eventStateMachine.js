/**
 * Le cycle de vie d'un événement est entièrement dérivé des dates fixées
 * par le créateur, comparées à l'instant présent. Il n'y a pas de colonne
 * "statut" en base : l'état est toujours recalculé, ce qui évite tout
 * problème de synchronisation (cron, tâche planifiée, etc.).
 *
 * États possibles :
 *  - AVANT_OUVERTURE : now < open_at
 *  - OUVERT          : open_at <= now < close_at   (dépôt + vote possibles)
 *  - EN_VOTE         : close_at <= now < vote_end_at (vote seul possible)
 *  - CLOTURE         : now >= vote_end_at
 */
function getEventState(event, now = new Date()) {
  const nowTime = now.getTime();
  const openAt = new Date(event.open_at).getTime();
  const closeAt = new Date(event.close_at).getTime();
  const voteEndAt = new Date(event.vote_end_at).getTime();

  if (nowTime < openAt) return 'AVANT_OUVERTURE';
  if (nowTime < closeAt) return 'OUVERT';
  if (nowTime < voteEndAt) return 'EN_VOTE';
  return 'CLOTURE';
}

function canUploadPhoto(event, now = new Date()) {
  // Le dépôt n'est possible qu'entre l'ouverture et la fermeture,
  // pour tout le monde, y compris le photographe officiel.
  return getEventState(event, now) === 'OUVERT';
}

function canVote(event, now = new Date()) {
  const state = getEventState(event, now);
  return state === 'OUVERT' || state === 'EN_VOTE';
}

function isClosed(event, now = new Date()) {
  return getEventState(event, now) === 'CLOTURE';
}

module.exports = { getEventState, canUploadPhoto, canVote, isClosed };
