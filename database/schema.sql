CREATE DATABASE IF NOT EXISTS finance_dashboard;
USE finance_dashboard;

-- Single default user (no auth needed)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    icon VARCHAR(50) DEFAULT 'fa-tag'
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL DEFAULT 1,
    category_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255),
    transaction_date DATE NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Budgets
CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL DEFAULT 1,
    category_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    UNIQUE KEY unique_budget (user_id, category_id, month, year)
);

-- Seed default user
INSERT INTO users (username) VALUES ('default') 
ON DUPLICATE KEY UPDATE username = 'default';

-- Seed categories
INSERT INTO categories (name, type, icon) VALUES
('Salary', 'income', 'fa-briefcase'),
('Freelance', 'income', 'fa-laptop'),
('Investment', 'income', 'fa-chart-line'),
('Food', 'expense', 'fa-utensils'),
('Rent', 'expense', 'fa-home'),
('Transport', 'expense', 'fa-car'),
('Shopping', 'expense', 'fa-shopping-bag'),
('Entertainment', 'expense', 'fa-film'),
('Utilities', 'expense', 'fa-bolt'),
('Healthcare', 'expense', 'fa-heartbeat'),
('Others', 'expense', 'fa-ellipsis-h');


USE finance_dashboard;

-- Sample income transactions
INSERT INTO transactions
(user_id, category_id, amount, description, transaction_date, type)
VALUES
(1, 1, 55000.00, 'Monthly salary', '2026-10-01', 'income'),
(1, 2, 8500.00, 'Website development', '2026-10-03', 'income'),
(1, 3, 2500.00, 'Investment returns', '2026-10-05', 'income'),
(1, 1, 55000.00, 'Monthly salary advance', '2026-10-15', 'income'),
(1, 2, 6000.00, 'Freelance project payment', '2026-10-18', 'income'),
(1, 3, 1200.00, 'Dividend income', '2026-10-20', 'income'),

-- Sample expense transactions
(1, 4, 450.00, 'Grocery shopping', '2026-10-02', 'expense'),
(1, 4, 320.00, 'Restaurant', '2026-10-04', 'expense'),
(1, 5, 12000.00, 'Monthly house rent', '2026-10-01', 'expense'),
(1, 6, 1500.00, 'Fuel expenses', '2026-10-06', 'expense'),
(1, 7, 2500.00, 'Clothing purchase', '2026-10-08', 'expense'),
(1, 8, 800.00, 'Movie tickets', '2026-10-09', 'expense'),
(1, 9, 1800.00, 'Electricity bill', '2026-10-10', 'expense'),
(1, 10, 650.00, 'Medical expenses', '2026-10-11', 'expense'),
(1, 4, 700.00, 'Weekly groceries', '2026-10-12', 'expense'),
(1, 6, 400.00, 'Bus and auto fare', '2026-10-14', 'expense'),
(1, 7, 1200.00, 'Household items', '2026-10-16', 'expense'),
(1, 8, 500.00, 'Entertainment subscription', '2026-10-17', 'expense'),
(1, 9, 900.00, 'Internet bill', '2026-10-19', 'expense'),
(1, 11, 750.00, 'Miscellaneous expenses', '2026-10-21', 'expense');



USE finance_dashboard;

INSERT INTO budgets
(user_id, category_id, amount, month, year)
VALUES
(1, 4, 6000.00, 10, 2026),   -- Food
(1, 5, 12000.00, 10, 2026),  -- Rent
(1, 6, 3000.00, 10, 2026),   -- Transport
(1, 7, 4000.00, 10, 2026),   -- Shopping
(1, 8, 2000.00, 10, 2026),   -- Entertainment
(1, 9, 2500.00, 10, 2026),   -- Utilities
(1, 10, 1500.00, 10, 2026),  -- Healthcare
(1, 11, 1000.00, 10, 2026)   -- Others
ON DUPLICATE KEY UPDATE
amount = VALUES(amount);
