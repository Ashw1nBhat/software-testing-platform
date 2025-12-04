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
    status_name VARCHAR(50) PRIMARY KEY
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
    test_run_id  BIGINT UNSIGNED NOT NULL,
    test_case_id BIGINT UNSIGNED NOT NULL,
    status_name  VARCHAR(50) NOT NULL,
    notes        VARCHAR(1000),
    PRIMARY KEY (test_run_id, test_case_id),
    CONSTRAINT fk_trc_run FOREIGN KEY (test_run_id) REFERENCES `Test_Runs`(test_run_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_trc_case FOREIGN KEY (test_case_id) REFERENCES `Test_Cases`(test_case_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_trc_status FOREIGN KEY (status_name) REFERENCES `Statuses`(status_name) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

INSERT INTO `Statuses` (status_name) VALUES ('PASS') ON DUPLICATE KEY UPDATE status_name = status_name;
INSERT INTO `Statuses` (status_name) VALUES ('FAIL') ON DUPLICATE KEY UPDATE status_name = status_name;

INSERT INTO `Organizations` (organization_id, name, description, address, pin_code)
VALUES (1, 'Acme QA Labs', 'Manual testing center of excellence', '123 Quality Ave, Test City', '123456');

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

INSERT INTO `Test_Run_Cases` (test_run_id, test_case_id, status_name, notes)
VALUES
  (1, 1, 'PASS', 'Validated on build 1.2.3'),
  (1, 2, 'FAIL', 'Error message missing after 3rd attempt');

DROP PROCEDURE IF EXISTS create_user;
DROP PROCEDURE IF EXISTS login_user;

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

DELIMITER ;
