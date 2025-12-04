import { expect, test } from 'vitest';
import { formatDateTime } from '../../src/utils/datetime';

test('formatDateTime', () => {
  expect(formatDateTime(new Date('2025-08-21 10:00:00'), 'YYYY-MM-DD')).toBe('2025-08-21');
});
