/**
 * Deletes a user from Neon Auth using the Neon Management API.
 * Must be called AFTER the user is deleted from Prisma.
 *
 * Requires env vars:
 *   NEON_API_KEY     — from Neon Console → Account Settings → API Keys
 *   NEON_PROJECT_ID  — from Neon Console → Project Settings
 *   NEON_BRANCH_ID   — from Neon Console → Branches (e.g. br-xxx)
 */
export async function deleteNeonAuthUser(authUserId: string): Promise<void> {
  const apiKey = process.env.NEON_API_KEY;
  const projectId = process.env.NEON_PROJECT_ID;
  const branchId = process.env.NEON_BRANCH_ID;

  if (!apiKey || !projectId || !branchId) {
    console.warn('deleteNeonAuthUser: missing NEON_API_KEY, NEON_PROJECT_ID, or NEON_BRANCH_ID — skipping auth cleanup');
    return;
  }

  const url = `https://console.neon.tech/api/v2/projects/${projectId}/branches/${branchId}/auth/users/${authUserId}`;

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const body = await res.text();
      console.warn(`deleteNeonAuthUser: Neon API returned ${res.status} — ${body}`);
    }
  } catch (err) {
    console.warn('deleteNeonAuthUser: fetch error (non-fatal):', err);
  }
}
