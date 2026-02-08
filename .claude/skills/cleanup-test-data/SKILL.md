---
name: cleanup-test-data
description: Clean up test data created by E2E tests. Removes test users, quizzes, and submissions from the database.
---

# Cleanup Test Data

This skill removes test data created by E2E tests from the database.

## What Gets Cleaned

Test data is identified by email patterns:
- `testuser*@example.com`
- `e2etest*@example.com`
- `test*@test.com`

And quiz titles:
- `*E2E Test*`
- `*Automated Test*`
- `*Test Quiz*` (only if owned by test users)

## Instructions

When this skill is invoked, execute the cleanup script:

### Step 1: Run the Cleanup Script

```bash
npx ts-node scripts/cleanup-test-data.ts
```

Or if ts-node is not available, use tsx:

```bash
npx tsx scripts/cleanup-test-data.ts
```

### Step 2: Report Results

The script will output:
- Number of test users found and deleted
- Number of quizzes deleted (cascaded)
- Number of submissions deleted (cascaded)
- Any errors encountered

### Alternative: Manual Prisma Commands

If the script doesn't exist or fails, you can run cleanup manually using Prisma:

```bash
# Delete test users (cascades to delete their quizzes, submissions, answers)
npx prisma db execute --stdin <<EOF
DELETE FROM users
WHERE email LIKE 'testuser%@example.com'
   OR email LIKE 'e2etest%@example.com'
   OR email LIKE 'test%@test.com';
EOF
```

## Safety Features

- Only deletes data matching specific test patterns
- Uses database transactions for atomicity
- Reports what will be deleted before deleting (dry-run mode available)
- Does NOT delete real user data

## Dry Run Mode

To see what would be deleted without actually deleting:

```bash
npx tsx scripts/cleanup-test-data.ts --dry-run
```

## Notes

- Cascade deletes handle related records (quizzes, questions, options, submissions, answers)
- Run this after E2E tests to keep the database clean
- Safe to run multiple times (idempotent)
