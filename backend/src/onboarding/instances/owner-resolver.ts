import { NotFoundException } from '@nestjs/common';
import { PoolClient } from 'pg';

export async function resolveOwnerId(
  client: PoolClient,
  ownerType: 'EMPLOYEE' | 'HR' | 'DEPARTMENT_ADMIN',
  employeeId: string,
  employeeDepartmentId: string,
  creatingHrUserId: string,
): Promise<string> {
  if (ownerType === 'EMPLOYEE') {
    return employeeId;
  }

  if (ownerType === 'HR') {
    return creatingHrUserId;
  }

  // DEPARTMENT_ADMIN — find the Admin whose department_id matches
  const { rows } = await client.query<{ id: string }>(
    `SELECT id FROM users
     WHERE role = 'ADMIN' AND department_id = $1 AND is_active = true
     ORDER BY created_at ASC
     LIMIT 1`,
    [employeeDepartmentId],
  );

  if (rows.length === 0) {
    throw new NotFoundException(
      `No active Admin found for this department. Please assign a Department Admin before creating onboarding instances.`,
    );
  }

  return rows[0].id;
}