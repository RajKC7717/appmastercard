// tests/helpers/db.js
// -----------------------------------------------------------------------------
// Shared Prisma client + seed-data query helpers.
// Tests call these to look up real UUIDs from the seeded database.
// -----------------------------------------------------------------------------

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

/** Returns the first NGO ADMIN user from the seed. */
export async function getAdmin() {
  return prisma.ngoUser.findFirst({ where: { role: 'ADMIN' } });
}

/** Returns the second NGO ADMIN user from the seed. */
export async function getAdmin2() {
  const admins = await prisma.ngoUser.findMany({ where: { role: 'ADMIN' }, take: 2 });
  return admins[1] ?? admins[0];
}

/** Returns the NGO STAFF user from the seed. */
export async function getStaff() {
  return prisma.ngoUser.findFirst({ where: { role: 'STAFF' } });
}

/** Returns the Mastercard company record. */
export async function getMastercard() {
  return prisma.company.findFirst({ where: { companyName: 'Mastercard' } });
}

/** Returns the BNY Mellon company record. */
export async function getBNY() {
  return prisma.company.findFirst({ where: { companyName: 'BNY Mellon' } });
}

/** Returns the Infosys company record. */
export async function getInfosys() {
  return prisma.company.findFirst({ where: { companyName: 'Infosys' } });
}

/** Returns the Mastercard SPOC CompanyUser. */
export async function getMcSpoc() {
  const mc = await getMastercard();
  return prisma.companyUser.findFirst({ where: { companyId: mc.companyId, role: 'SPOC' } });
}

/** Returns the BNY SPOC CompanyUser. */
export async function getBnySpoc() {
  const bny = await getBNY();
  return prisma.companyUser.findFirst({ where: { companyId: bny.companyId, role: 'SPOC' } });
}

/** Returns the first Mastercard VOLUNTEER. */
export async function getMcVol() {
  const mc = await getMastercard();
  return prisma.companyUser.findFirst({
    where: { companyId: mc.companyId, role: 'VOLUNTEER' },
    orderBy: { name: 'asc' },
  });
}

/** Returns the second Mastercard VOLUNTEER. */
export async function getMcVol2() {
  const mc = await getMastercard();
  const vols = await prisma.companyUser.findMany({
    where: { companyId: mc.companyId, role: 'VOLUNTEER' },
    orderBy: { name: 'asc' },
    take: 2,
  });
  return vols[1] ?? vols[0];
}

/** Returns the first Infosys VOLUNTEER. */
export async function getInfVol() {
  const inf = await getInfosys();
  return prisma.companyUser.findFirst({
    where: { companyId: inf.companyId, role: 'VOLUNTEER' },
    orderBy: { name: 'asc' },
  });
}

/** Returns a completed past event belonging to Mastercard. */
export async function getMcCompletedEvent() {
  const mc = await getMastercard();
  return prisma.event.findFirst({
    where: { companyId: mc.companyId, status: 'COMPLETED' },
  });
}

/** Returns the Mastercard UPCOMING event (zero registrations/feedback). */
export async function getMcUpcomingEvent() {
  const mc = await getMastercard();
  return prisma.event.findFirst({ where: { companyId: mc.companyId, status: 'UPCOMING' } });
}

/** Returns the BNY completed event. */
export async function getBnyCompletedEvent() {
  const bny = await getBNY();
  return prisma.event.findFirst({ where: { companyId: bny.companyId, status: 'COMPLETED' } });
}

/** Returns an EventRegistration for a given (eventId, userId) pair. */
export async function getRegistration(eventId, userId) {
  return prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
}

/** Returns the first Feedback for a given eventId. */
export async function getFirstFeedbackForEvent(eventId) {
  return prisma.feedback.findFirst({
    include: { registration: true },
    where: { registration: { eventId } },
  });
}
