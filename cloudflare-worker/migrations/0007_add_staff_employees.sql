-- Add known ALBA Space staff accounts to the existing employee role.
-- Safe to re-run: user_roles primary key plus INSERT OR IGNORE prevents duplicates.
-- If an email does not exist in users yet, no row is created; re-run after that user signs in.

INSERT OR IGNORE INTO user_roles (user_id, role_id, granted_by)
SELECT u.id, r.id, NULL
FROM users u
JOIN roles r ON r.code = 'employee'
WHERE lower(u.email) IN (
  lower('idrisalbayrak10@gmail.com'),
  lower('rikir8284@gmail.com')
);
