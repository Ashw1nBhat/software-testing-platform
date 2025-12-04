CREATE DATABASE IF NOT EXISTS testing_platform;
USE testing_platform;

DROP TABLE IF EXISTS `Test_Run_Cases`;
DROP TABLE IF EXISTS `Test_Steps`;
DROP TABLE IF EXISTS `Test_Cases`;
DROP TABLE IF EXISTS `Test_Runs`;
DROP TABLE IF EXISTS `Projects`;
DROP TABLE IF EXISTS `Statuses`;
DROP TABLE IF EXISTS `Users`;
DROP TABLE IF EXISTS `Organizations`;

CREATE TABLE `Organizations` (
    organization_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    description     VARCHAR(1000),
    address         VARCHAR(300),
    pin_code        VARCHAR(20) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE `Users` (
    user_id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT UNSIGNED NOT NULL,
    user_name       VARCHAR(150) NOT NULL,
    employee_code   VARCHAR(50) NOT NULL UNIQUE,
    designation     VARCHAR(100),
    join_date       DATE NOT NULL,
    role            VARCHAR(15) NOT NULL CHECK (role IN ('TEST_WRITER', 'TESTER')),
    password_md5    CHAR(32) NOT NULL,
    CONSTRAINT fk_user_org FOREIGN KEY (organization_id) REFERENCES `Organizations`(organization_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `Projects` (
    project_id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT UNSIGNED NOT NULL,
    name            VARCHAR(150) NOT NULL,
    description     VARCHAR(1000),
    CONSTRAINT fk_project_org FOREIGN KEY (organization_id) REFERENCES `Organizations`(organization_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `Test_Cases` (
    test_case_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id   BIGINT UNSIGNED NOT NULL,
    title        VARCHAR(200) NOT NULL,
    description  VARCHAR(1000),
    CONSTRAINT fk_case_project FOREIGN KEY (project_id) REFERENCES `Projects`(project_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `Test_Steps` (
    test_step_id  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    test_case_id  BIGINT UNSIGNED NOT NULL,
    description   VARCHAR(1000) NOT NULL,
    required_data VARCHAR(500),
    CONSTRAINT fk_step_case FOREIGN KEY (test_case_id) REFERENCES `Test_Cases`(test_case_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `Statuses` (
    organization_id BIGINT UNSIGNED NOT NULL,
    status_name     VARCHAR(50) NOT NULL,
    color_hex       CHAR(7) NOT NULL DEFAULT '#9ca3af',
    PRIMARY KEY (organization_id, status_name),
    CONSTRAINT fk_status_org FOREIGN KEY (organization_id) REFERENCES `Organizations`(organization_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `Test_Runs` (
    test_run_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id  BIGINT UNSIGNED NOT NULL,
    tester_id   BIGINT UNSIGNED NOT NULL,
    name        VARCHAR(150) NOT NULL,
    description VARCHAR(1000),
    CONSTRAINT fk_run_project FOREIGN KEY (project_id) REFERENCES `Projects`(project_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_run_tester FOREIGN KEY (tester_id) REFERENCES `Users`(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `Test_Run_Cases` (
    test_run_id      BIGINT UNSIGNED NOT NULL,
    test_case_id     BIGINT UNSIGNED NOT NULL,
    organization_id  BIGINT UNSIGNED NOT NULL,
    status_name      VARCHAR(50) NOT NULL,
    notes            VARCHAR(1000),
    PRIMARY KEY (test_run_id, test_case_id),
    CONSTRAINT fk_trc_run FOREIGN KEY (test_run_id) REFERENCES `Test_Runs`(test_run_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_trc_case FOREIGN KEY (test_case_id) REFERENCES `Test_Cases`(test_case_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_trc_status FOREIGN KEY (organization_id, status_name) REFERENCES `Statuses`(organization_id, status_name) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_trc_status_org FOREIGN KEY (organization_id) REFERENCES `Organizations`(organization_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

INSERT INTO `Organizations` (organization_id, name, description, address, pin_code)
VALUES (1, 'Acme QA Labs', 'Manual testing center of excellence', '123 Quality Ave, Test City', '123456');

INSERT INTO `Statuses` (organization_id, status_name, color_hex) VALUES (1, 'UNSET', '#9ca3af') ON DUPLICATE KEY UPDATE color_hex = VALUES(color_hex);
INSERT INTO `Statuses` (organization_id, status_name, color_hex) VALUES (1, 'PASS', '#22c55e') ON DUPLICATE KEY UPDATE color_hex = VALUES(color_hex);
INSERT INTO `Statuses` (organization_id, status_name, color_hex) VALUES (1, 'FAIL', '#ef4444') ON DUPLICATE KEY UPDATE color_hex = VALUES(color_hex);

INSERT INTO `Users` (user_id, organization_id, user_name, employee_code, designation, join_date, role, password_md5)
VALUES
  (1, 1, 'Tara Tester', 'EMP-1001', 'QA Analyst', '2024-01-15', 'TESTER', MD5('testerpass')),
  (2, 1, 'Walt Writer', 'EMP-1002', 'Test Writer', '2023-11-01', 'TEST_WRITER', MD5('writerpass'));

INSERT INTO `Projects` (project_id, organization_id, name, description)
VALUES
  (1, 1, 'Mobile Banking App', 'Regression suite for v2 releases'),
  (2, 1, 'Web Portal', 'Smoke tests for customer portal');

INSERT INTO `Test_Cases` (test_case_id, project_id, title, description)
VALUES
  (1, 1, 'Login with valid credentials', 'User logs in with correct username/password'),
  (2, 1, 'Login with invalid password', 'Ensure lockout after failed attempts'),
  (3, 2, 'Add item to cart', 'Add product and verify cart count'),
  (4, 2, 'Checkout with credit card', 'Complete purchase using valid credit card');

INSERT INTO `Test_Steps` (test_step_id, test_case_id, description, required_data)
VALUES
  (1, 1, 'Open app and navigate to login screen', NULL),
  (2, 1, 'Enter valid username and password', 'username: demo_user; password: P@ssw0rd'),
  (3, 1, 'Tap Login and verify dashboard loads', NULL),
  (4, 2, 'Open app and navigate to login screen', NULL),
  (5, 2, 'Enter valid username and wrong password', 'username: demo_user; password: wrongpass'),
  (6, 2, 'Attempt login; verify error message', NULL),
  (7, 3, 'Open portal and sign in', 'username: shopper; password: Shop123!'),
  (8, 3, 'Search for product and add to cart', 'product: Wireless Mouse'),
  (9, 3, 'Verify cart badge shows count 1', NULL),
  (10, 4, 'Proceed to checkout', NULL),
  (11, 4, 'Enter shipping details', 'address: 123 Quality Ave'),
  (12, 4, 'Enter credit card and place order', 'cc: 4111111111111111 exp 12/28 cvv 123'),
  (13, 4, 'Verify order confirmation page displays', NULL);

INSERT INTO `Test_Runs` (test_run_id, project_id, tester_id, name, description)
VALUES (1, 1, 1, 'Sprint 12 Regression', 'Core login coverage');

INSERT INTO `Test_Run_Cases` (test_run_id, test_case_id, organization_id, status_name, notes)
VALUES
  (1, 1, 1, 'PASS', 'Validated on build 1.2.3'),
  (1, 2, 1, 'FAIL', 'Error message missing after 3rd attempt');

DROP PROCEDURE IF EXISTS create_user;
DROP PROCEDURE IF EXISTS login_user;
DROP PROCEDURE IF EXISTS get_roles;
DROP PROCEDURE IF EXISTS list_projects_by_org;
DROP PROCEDURE IF EXISTS create_project_for_org;
DROP PROCEDURE IF EXISTS update_project_for_org;
DROP PROCEDURE IF EXISTS delete_project_for_org;
DROP PROCEDURE IF EXISTS list_test_cases_by_project;
DROP PROCEDURE IF EXISTS create_test_case_for_org;
DROP PROCEDURE IF EXISTS update_test_case_for_org;
DROP PROCEDURE IF EXISTS delete_test_case_for_org;
DROP PROCEDURE IF EXISTS list_test_steps_for_case;
DROP PROCEDURE IF EXISTS create_test_step_for_case;
DROP PROCEDURE IF EXISTS delete_test_steps_for_case;
DROP PROCEDURE IF EXISTS list_users_in_org;
DROP PROCEDURE IF EXISTS list_test_cases_by_org;
DROP PROCEDURE IF EXISTS list_test_runs_by_project;
DROP PROCEDURE IF EXISTS create_test_run_for_org;
DROP PROCEDURE IF EXISTS update_test_run_for_org;
DROP PROCEDURE IF EXISTS delete_test_run_for_org;
DROP PROCEDURE IF EXISTS list_test_run_cases;
DROP PROCEDURE IF EXISTS add_test_run_case_for_org;
DROP PROCEDURE IF EXISTS delete_test_run_cases_for_run;
DROP PROCEDURE IF EXISTS update_test_run_case_for_org;
DROP PROCEDURE IF EXISTS list_statuses;
DROP PROCEDURE IF EXISTS create_status;
DROP PROCEDURE IF EXISTS update_status;
DROP PROCEDURE IF EXISTS delete_status;

DELIMITER //

CREATE PROCEDURE create_user(
    IN p_organization_id BIGINT UNSIGNED,
    IN p_user_name VARCHAR(150),
    IN p_employee_code VARCHAR(50),
    IN p_designation VARCHAR(100),
    IN p_join_date DATE,
    IN p_role VARCHAR(15),
    IN p_password VARCHAR(255)
)
BEGIN
    INSERT INTO `Users` (
        organization_id, user_name, employee_code,
        designation, join_date, role, password_md5
    )
    VALUES (
        p_organization_id, p_user_name, p_employee_code,
        p_designation, p_join_date, p_role, MD5(p_password)
    );
    SELECT LAST_INSERT_ID() AS user_id;
END//

CREATE PROCEDURE login_user(
    IN p_user_name VARCHAR(150),
    IN p_password VARCHAR(255)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO v_exists
    FROM `Users`
    WHERE user_name = p_user_name
      AND password_md5 = MD5(p_password);

    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid credentials', MYSQL_ERRNO = 1045;
    ELSE
        SELECT user_id, organization_id, user_name, role
        FROM `Users`
        WHERE user_name = p_user_name
          AND password_md5 = MD5(p_password);
    END IF;
END//

CREATE PROCEDURE get_roles()
BEGIN
    SELECT 'TEST_WRITER' AS role
    UNION SELECT 'TESTER';
END//

CREATE PROCEDURE list_projects_by_org(
    IN p_user_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;

    SELECT project_id, name, description
    FROM `Projects`
    WHERE organization_id = v_org_id
    ORDER BY project_id DESC;
END//

CREATE PROCEDURE create_project_for_org(
    IN p_user_id BIGINT UNSIGNED,
    IN p_name VARCHAR(150),
    IN p_description VARCHAR(1000)
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;

    INSERT INTO `Projects` (organization_id, name, description)
    VALUES (v_org_id, p_name, p_description);

    SELECT LAST_INSERT_ID() AS project_id;
END//

CREATE PROCEDURE update_project_for_org(
    IN p_user_id BIGINT UNSIGNED,
    IN p_project_id BIGINT UNSIGNED,
    IN p_name VARCHAR(150),
    IN p_description VARCHAR(1000)
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;

    UPDATE `Projects`
    SET name = p_name,
        description = p_description
    WHERE project_id = p_project_id
      AND organization_id = v_org_id;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Project not found or not in organization';
    END IF;

    SELECT p_project_id AS project_id;
END//

CREATE PROCEDURE delete_project_for_org(
    IN p_user_id BIGINT UNSIGNED,
    IN p_project_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;

    DELETE FROM `Projects`
    WHERE project_id = p_project_id
      AND organization_id = v_org_id;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Project not found or not in organization';
    END IF;

    SELECT p_project_id AS project_id;
END//

CREATE PROCEDURE list_test_cases_by_project(
    IN p_user_id BIGINT UNSIGNED,
    IN p_project_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    DECLARE v_project_org BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;
    SELECT organization_id INTO v_project_org FROM `Projects` WHERE project_id = p_project_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;
    IF v_project_org IS NULL OR v_project_org <> v_org_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Project not found or not in organization';
    END IF;

    SELECT test_case_id, project_id, title, description
    FROM `Test_Cases`
    WHERE project_id = p_project_id
    ORDER BY test_case_id DESC;
END//

CREATE PROCEDURE create_test_case_for_org(
    IN p_user_id BIGINT UNSIGNED,
    IN p_project_id BIGINT UNSIGNED,
    IN p_title VARCHAR(200),
    IN p_description VARCHAR(1000)
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    DECLARE v_project_org BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;
    SELECT organization_id INTO v_project_org FROM `Projects` WHERE project_id = p_project_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;
    IF v_project_org IS NULL OR v_project_org <> v_org_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Project not found or not in organization';
    END IF;

    INSERT INTO `Test_Cases` (project_id, title, description)
    VALUES (p_project_id, p_title, p_description);

    SELECT LAST_INSERT_ID() AS test_case_id;
END//

CREATE PROCEDURE update_test_case_for_org(
    IN p_user_id BIGINT UNSIGNED,
    IN p_test_case_id BIGINT UNSIGNED,
    IN p_title VARCHAR(200),
    IN p_description VARCHAR(1000)
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    DECLARE v_case_org BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;
    SELECT organization_id INTO v_case_org
    FROM `Test_Cases` tc
    JOIN `Projects` p ON tc.project_id = p.project_id
    WHERE tc.test_case_id = p_test_case_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;
    IF v_case_org IS NULL OR v_case_org <> v_org_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Test case not found or not in organization';
    END IF;

    UPDATE `Test_Cases`
    SET title = p_title,
        description = p_description
    WHERE test_case_id = p_test_case_id;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Test case not found';
    END IF;

    SELECT p_test_case_id AS test_case_id;
END//

CREATE PROCEDURE delete_test_case_for_org(
    IN p_user_id BIGINT UNSIGNED,
    IN p_test_case_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    DECLARE v_case_org BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;
    SELECT organization_id INTO v_case_org
    FROM `Test_Cases` tc
    JOIN `Projects` p ON tc.project_id = p.project_id
    WHERE tc.test_case_id = p_test_case_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;
    IF v_case_org IS NULL OR v_case_org <> v_org_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Test case not found or not in organization';
    END IF;

    DELETE FROM `Test_Cases`
    WHERE test_case_id = p_test_case_id;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Test case not found';
    END IF;

    SELECT p_test_case_id AS test_case_id;
END//

CREATE PROCEDURE list_test_steps_for_case(
    IN p_user_id BIGINT UNSIGNED,
    IN p_test_case_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    DECLARE v_case_org BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;
    SELECT organization_id INTO v_case_org
    FROM `Test_Cases` tc
    JOIN `Projects` p ON tc.project_id = p.project_id
    WHERE tc.test_case_id = p_test_case_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;
    IF v_case_org IS NULL OR v_case_org <> v_org_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Test case not found or not in organization';
    END IF;

    SELECT test_step_id, test_case_id, description, required_data
    FROM `Test_Steps`
    WHERE test_case_id = p_test_case_id
    ORDER BY test_step_id ASC;
END//

CREATE PROCEDURE create_test_step_for_case(
    IN p_user_id BIGINT UNSIGNED,
    IN p_test_case_id BIGINT UNSIGNED,
    IN p_description VARCHAR(1000),
    IN p_required_data VARCHAR(500)
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    DECLARE v_case_org BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;
    SELECT organization_id INTO v_case_org
    FROM `Test_Cases` tc
    JOIN `Projects` p ON tc.project_id = p.project_id
    WHERE tc.test_case_id = p_test_case_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;
    IF v_case_org IS NULL OR v_case_org <> v_org_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Test case not found or not in organization';
    END IF;

    INSERT INTO `Test_Steps` (test_case_id, description, required_data)
    VALUES (p_test_case_id, p_description, p_required_data);

    SELECT LAST_INSERT_ID() AS test_step_id;
END//

CREATE PROCEDURE delete_test_steps_for_case(
    IN p_user_id BIGINT UNSIGNED,
    IN p_test_case_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    DECLARE v_case_org BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;
    SELECT organization_id INTO v_case_org
    FROM `Test_Cases` tc
    JOIN `Projects` p ON tc.project_id = p.project_id
    WHERE tc.test_case_id = p_test_case_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;
    IF v_case_org IS NULL OR v_case_org <> v_org_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Test case not found or not in organization';
    END IF;

    DELETE FROM `Test_Steps` WHERE test_case_id = p_test_case_id;
END//

CREATE PROCEDURE list_users_in_org(
    IN p_user_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;

    SELECT user_id, user_name, role, designation
    FROM `Users`
    WHERE organization_id = v_org_id
    ORDER BY user_id;
END//

CREATE PROCEDURE list_test_cases_by_org(
    IN p_user_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;

    SELECT tc.test_case_id,
           tc.project_id,
           tc.title,
           tc.description,
           p.name AS project_name
    FROM `Test_Cases` tc
    JOIN `Projects` p ON tc.project_id = p.project_id
    WHERE p.organization_id = v_org_id
    ORDER BY tc.test_case_id DESC;
END//

CREATE PROCEDURE list_test_runs_by_project(
    IN p_user_id BIGINT UNSIGNED,
    IN p_project_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    DECLARE v_project_org BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;
    SELECT organization_id INTO v_project_org FROM `Projects` WHERE project_id = p_project_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;
    IF v_project_org IS NULL OR v_project_org <> v_org_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Project not found or not in organization';
    END IF;

    SELECT tr.test_run_id,
           tr.project_id,
           tr.tester_id,
           tr.name,
           tr.description,
           u.user_name AS tester_name
    FROM `Test_Runs` tr
    JOIN `Users` u ON tr.tester_id = u.user_id
    WHERE tr.project_id = p_project_id
    ORDER BY tr.test_run_id DESC;
END//

CREATE PROCEDURE create_test_run_for_org(
    IN p_user_id BIGINT UNSIGNED,
    IN p_project_id BIGINT UNSIGNED,
    IN p_tester_id BIGINT UNSIGNED,
    IN p_name VARCHAR(150),
    IN p_description VARCHAR(1000)
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    DECLARE v_project_org BIGINT UNSIGNED;
    DECLARE v_tester_org BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;
    SELECT organization_id INTO v_project_org FROM `Projects` WHERE project_id = p_project_id;
    SELECT organization_id INTO v_tester_org FROM `Users` WHERE user_id = p_tester_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;
    IF v_project_org IS NULL OR v_project_org <> v_org_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Project not found or not in organization';
    END IF;
    IF v_tester_org IS NULL OR v_tester_org <> v_org_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tester not in organization';
    END IF;

    INSERT INTO `Test_Runs` (project_id, tester_id, name, description)
    VALUES (p_project_id, p_tester_id, p_name, p_description);

    SELECT LAST_INSERT_ID() AS test_run_id;
END//

CREATE PROCEDURE update_test_run_for_org(
    IN p_user_id BIGINT UNSIGNED,
    IN p_test_run_id BIGINT UNSIGNED,
    IN p_tester_id BIGINT UNSIGNED,
    IN p_name VARCHAR(150),
    IN p_description VARCHAR(1000)
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    DECLARE v_run_org BIGINT UNSIGNED;
    DECLARE v_tester_org BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;
    SELECT organization_id INTO v_run_org
    FROM `Test_Runs` tr
    JOIN `Projects` p ON tr.project_id = p.project_id
    WHERE tr.test_run_id = p_test_run_id;
    SELECT organization_id INTO v_tester_org FROM `Users` WHERE user_id = p_tester_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;
    IF v_run_org IS NULL OR v_run_org <> v_org_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Test run not found or not in organization';
    END IF;
    IF v_tester_org IS NULL OR v_tester_org <> v_org_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tester not in organization';
    END IF;

    UPDATE `Test_Runs`
    SET tester_id = p_tester_id,
        name = p_name,
        description = p_description
    WHERE test_run_id = p_test_run_id;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Test run not found';
    END IF;

    SELECT p_test_run_id AS test_run_id;
END//

CREATE PROCEDURE delete_test_run_for_org(
    IN p_user_id BIGINT UNSIGNED,
    IN p_test_run_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    DECLARE v_run_org BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;
    SELECT organization_id INTO v_run_org
    FROM `Test_Runs` tr
    JOIN `Projects` p ON tr.project_id = p.project_id
    WHERE tr.test_run_id = p_test_run_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;
    IF v_run_org IS NULL OR v_run_org <> v_org_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Test run not found or not in organization';
    END IF;

    DELETE FROM `Test_Runs` WHERE test_run_id = p_test_run_id;
    SELECT p_test_run_id AS test_run_id;
END//

CREATE PROCEDURE list_test_run_cases(
    IN p_user_id BIGINT UNSIGNED,
    IN p_test_run_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    DECLARE v_run_org BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;
    SELECT organization_id INTO v_run_org
    FROM `Test_Runs` tr
    JOIN `Projects` p ON tr.project_id = p.project_id
    WHERE tr.test_run_id = p_test_run_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;
    IF v_run_org IS NULL OR v_run_org <> v_org_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Test run not found or not in organization';
    END IF;

    SELECT trc.test_case_id, trc.status_name, trc.notes, tc.title, tc.description, s.color_hex
    FROM `Test_Run_Cases` trc
    JOIN `Test_Cases` tc ON trc.test_case_id = tc.test_case_id
    JOIN `Statuses` s ON s.organization_id = v_run_org AND s.status_name = trc.status_name
    WHERE trc.test_run_id = p_test_run_id;
END//

CREATE PROCEDURE add_test_run_case_for_org(
    IN p_user_id BIGINT UNSIGNED,
    IN p_test_run_id BIGINT UNSIGNED,
    IN p_test_case_id BIGINT UNSIGNED,
    IN p_status VARCHAR(50)
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    DECLARE v_run_org BIGINT UNSIGNED;
    DECLARE v_case_org BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;
    SELECT organization_id INTO v_run_org
    FROM `Test_Runs` tr
    JOIN `Projects` p ON tr.project_id = p.project_id
    WHERE tr.test_run_id = p_test_run_id;
    SELECT organization_id INTO v_case_org
    FROM `Test_Cases` tc
    JOIN `Projects` p ON tc.project_id = p.project_id
    WHERE tc.test_case_id = p_test_case_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;
    IF v_run_org IS NULL OR v_run_org <> v_org_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Test run not found or not in organization';
    END IF;
    IF v_case_org IS NULL OR v_case_org <> v_org_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Test case not found or not in organization';
    END IF;

    INSERT INTO `Test_Run_Cases` (test_run_id, test_case_id, organization_id, status_name, notes)
    VALUES (p_test_run_id, p_test_case_id, v_org_id, p_status, NULL);
END//

CREATE PROCEDURE delete_test_run_cases_for_run(
    IN p_user_id BIGINT UNSIGNED,
    IN p_test_run_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    DECLARE v_run_org BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;
    SELECT organization_id INTO v_run_org
    FROM `Test_Runs` tr
    JOIN `Projects` p ON tr.project_id = p.project_id
    WHERE tr.test_run_id = p_test_run_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;
    IF v_run_org IS NULL OR v_run_org <> v_org_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Test run not found or not in organization';
    END IF;

    DELETE FROM `Test_Run_Cases` WHERE test_run_id = p_test_run_id;
END//


CREATE PROCEDURE update_test_run_case_for_org(
    IN p_user_id BIGINT UNSIGNED,
    IN p_test_run_id BIGINT UNSIGNED,
    IN p_test_case_id BIGINT UNSIGNED,
    IN p_status VARCHAR(50),
    IN p_notes VARCHAR(1000)
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    DECLARE v_run_org BIGINT UNSIGNED;
    DECLARE v_case_org BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;
    SELECT organization_id INTO v_run_org
    FROM `Test_Runs` tr
    JOIN `Projects` p ON tr.project_id = p.project_id
    WHERE tr.test_run_id = p_test_run_id;
    SELECT organization_id INTO v_case_org
    FROM `Test_Cases` tc
    JOIN `Projects` p ON tc.project_id = p.project_id
    WHERE tc.test_case_id = p_test_case_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;
    IF v_run_org IS NULL OR v_run_org <> v_org_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Test run not found or not in organization';
    END IF;
    IF v_case_org IS NULL OR v_case_org <> v_org_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Test case not found or not in organization';
    END IF;

    UPDATE `Test_Run_Cases`
    SET status_name = p_status,
        notes = p_notes
    WHERE test_run_id = p_test_run_id
      AND test_case_id = p_test_case_id;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Test run case not found';
    END IF;
END//

CREATE PROCEDURE list_statuses(
    IN p_user_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;

    SELECT status_name, color_hex
    FROM `Statuses`
    WHERE organization_id = v_org_id
    ORDER BY status_name;
END//

CREATE PROCEDURE create_status(
    IN p_user_id BIGINT UNSIGNED,
    IN p_status_name VARCHAR(50),
    IN p_color_hex CHAR(7)
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;

    INSERT INTO `Statuses` (organization_id, status_name, color_hex)
    VALUES (v_org_id, p_status_name, p_color_hex);
    SELECT p_status_name AS status_name;
END//

CREATE PROCEDURE update_status(
    IN p_user_id BIGINT UNSIGNED,
    IN p_status_name VARCHAR(50),
    IN p_color_hex CHAR(7)
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;

    UPDATE `Statuses`
    SET color_hex = p_color_hex
    WHERE organization_id = v_org_id AND status_name = p_status_name;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Status not found';
    END IF;

    SELECT p_status_name AS status_name;
END//

CREATE PROCEDURE delete_status(
    IN p_user_id BIGINT UNSIGNED,
    IN p_status_name VARCHAR(50)
)
BEGIN
    DECLARE v_org_id BIGINT UNSIGNED;
    DECLARE v_unset_exists INT DEFAULT 0;
    SELECT organization_id INTO v_org_id FROM `Users` WHERE user_id = p_user_id;

    IF v_org_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;

    IF p_status_name = 'UNSET' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete default status UNSET';
    END IF;

    SELECT COUNT(*) INTO v_unset_exists FROM `Statuses` WHERE organization_id = v_org_id AND status_name = 'UNSET';
    IF v_unset_exists = 0 THEN
        INSERT INTO `Statuses` (organization_id, status_name, color_hex) VALUES (v_org_id, 'UNSET', '#9ca3af');
    END IF;

    UPDATE `Test_Run_Cases`
    SET status_name = 'UNSET'
    WHERE organization_id = v_org_id AND status_name = p_status_name;

    DELETE FROM `Statuses` WHERE organization_id = v_org_id AND status_name = p_status_name;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Status not found';
    END IF;
END//
DELIMITER ;

