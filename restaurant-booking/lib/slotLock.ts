import { randomUUID } from "crypto";

// Durée du verrou en millisecondes (5 minutes)
const LOCK_DURATION_MS = 5 * 60 * 1000;

// Structure d'un verrou
export interface SlotLock {
  lockId: string;
  sessionId: string;
  date: string;
  time: string;
  partySize: number;
  tableId: string;
  createdAt: Date;
  expiresAt: Date;
}

// Stockage en mémoire des verrous
// Clé: "date_time_tableId" (ex: "2024-03-15_19:30_table-123")
const locks = new Map<string, SlotLock>();

// Index par lockId pour recherche rapide
const locksByIdIndex = new Map<string, string>();

// Générer la clé du verrou
function generateLockKey(date: string, time: string, tableId: string): string {
  return `${date}_${time}_${tableId}`;
}

// Nettoyer les verrous expirés
export function cleanExpiredLocks(): number {
  const now = new Date();
  let cleanedCount = 0;

  for (const [key, lock] of locks.entries()) {
    if (lock.expiresAt < now) {
      locks.delete(key);
      locksByIdIndex.delete(lock.lockId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`[SlotLock] Nettoyé ${cleanedCount} verrou(s) expiré(s)`);
  }

  return cleanedCount;
}

// Vérifier si une table est verrouillée pour un créneau
export function isTableLocked(
  date: string,
  time: string,
  tableId: string,
  excludeSessionId?: string
): boolean {
  cleanExpiredLocks();

  const key = generateLockKey(date, time, tableId);
  const lock = locks.get(key);

  if (!lock) {
    return false;
  }

  // Si c'est le même session, ce n'est pas considéré comme verrouillé
  if (excludeSessionId && lock.sessionId === excludeSessionId) {
    return false;
  }

  return lock.expiresAt > new Date();
}

// Obtenir tous les verrous actifs pour un créneau (date + time)
export function getLocksForSlot(
  date: string,
  time: string,
  excludeSessionId?: string
): SlotLock[] {
  cleanExpiredLocks();

  const now = new Date();
  const result: SlotLock[] = [];

  for (const lock of locks.values()) {
    if (
      lock.date === date &&
      lock.time === time &&
      lock.expiresAt > now &&
      (!excludeSessionId || lock.sessionId !== excludeSessionId)
    ) {
      result.push(lock);
    }
  }

  return result;
}

// Créer un nouveau verrou
export function createLock(
  sessionId: string,
  date: string,
  time: string,
  partySize: number,
  tableId: string
): SlotLock {
  cleanExpiredLocks();

  const key = generateLockKey(date, time, tableId);

  // Vérifier si déjà verrouillé par un autre
  const existingLock = locks.get(key);
  if (existingLock && existingLock.sessionId !== sessionId && existingLock.expiresAt > new Date()) {
    throw new Error("Ce créneau est déjà réservé temporairement par un autre utilisateur");
  }

  // Supprimer l'ancien verrou de cette session si existe
  const existingSessionLock = getSessionLock(sessionId);
  if (existingSessionLock) {
    releaseLock(existingSessionLock.lockId);
  }

  const now = new Date();
  const lock: SlotLock = {
    lockId: randomUUID(),
    sessionId,
    date,
    time,
    partySize,
    tableId,
    createdAt: now,
    expiresAt: new Date(now.getTime() + LOCK_DURATION_MS),
  };

  locks.set(key, lock);
  locksByIdIndex.set(lock.lockId, key);

  console.log(
    `[SlotLock] Verrou créé: ${lock.lockId} pour ${date} ${time} (table: ${tableId})`
  );

  return lock;
}

// Récupérer un verrou par son ID
export function getLockById(lockId: string): SlotLock | null {
  cleanExpiredLocks();

  const key = locksByIdIndex.get(lockId);
  if (!key) {
    return null;
  }

  const lock = locks.get(key);
  if (!lock || lock.expiresAt < new Date()) {
    return null;
  }

  return lock;
}

// Récupérer le verrou actif d'une session
export function getSessionLock(sessionId: string): SlotLock | null {
  cleanExpiredLocks();

  const now = new Date();
  for (const lock of locks.values()) {
    if (lock.sessionId === sessionId && lock.expiresAt > now) {
      return lock;
    }
  }

  return null;
}

// Libérer un verrou par son ID
export function releaseLock(lockId: string): boolean {
  const key = locksByIdIndex.get(lockId);
  if (!key) {
    return false;
  }

  const lock = locks.get(key);
  if (lock) {
    locks.delete(key);
    locksByIdIndex.delete(lockId);
    console.log(`[SlotLock] Verrou libéré: ${lockId}`);
    return true;
  }

  return false;
}

// Libérer tous les verrous d'une session
export function releaseSessionLocks(sessionId: string): number {
  let releasedCount = 0;

  for (const [key, lock] of locks.entries()) {
    if (lock.sessionId === sessionId) {
      locks.delete(key);
      locksByIdIndex.delete(lock.lockId);
      releasedCount++;
    }
  }

  if (releasedCount > 0) {
    console.log(
      `[SlotLock] Libéré ${releasedCount} verrou(s) pour la session ${sessionId}`
    );
  }

  return releasedCount;
}

// Vérifier si un verrou est valide pour une réservation
export function validateLockForReservation(
  lockId: string,
  sessionId: string,
  date: string,
  time: string
): { valid: boolean; error?: string } {
  cleanExpiredLocks();

  const lock = getLockById(lockId);

  if (!lock) {
    return { valid: false, error: "Verrou introuvable ou expiré" };
  }

  if (lock.sessionId !== sessionId) {
    return { valid: false, error: "Ce verrou n'appartient pas à cette session" };
  }

  if (lock.date !== date || lock.time !== time) {
    return {
      valid: false,
      error: "Le verrou ne correspond pas au créneau demandé",
    };
  }

  if (lock.expiresAt < new Date()) {
    return { valid: false, error: "Le verrou a expiré" };
  }

  return { valid: true };
}

// Prolonger un verrou existant
export function extendLock(lockId: string, additionalMs: number = LOCK_DURATION_MS): SlotLock | null {
  const lock = getLockById(lockId);
  if (!lock) {
    return null;
  }

  const key = locksByIdIndex.get(lockId);
  if (!key) {
    return null;
  }

  lock.expiresAt = new Date(Date.now() + additionalMs);
  locks.set(key, lock);

  console.log(`[SlotLock] Verrou prolongé: ${lockId} jusqu'à ${lock.expiresAt.toISOString()}`);

  return lock;
}

// Obtenir les statistiques des verrous
export function getLockStats(): {
  total: number;
  active: number;
  expired: number;
} {
  const now = new Date();
  let active = 0;
  let expired = 0;

  for (const lock of locks.values()) {
    if (lock.expiresAt > now) {
      active++;
    } else {
      expired++;
    }
  }

  return {
    total: locks.size,
    active,
    expired,
  };
}

// Durée du verrou exportée pour le client
export const LOCK_DURATION_SECONDS = LOCK_DURATION_MS / 1000;
