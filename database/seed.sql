-- Default Roles
INSERT INTO oles (ole_id, ole_name, description) VALUES
(1, 'admin', 'System administrator'),
(2, 'user', 'Regular application user')
ON DUPLICATE KEY UPDATE description = VALUES(description);
