-- Схема базы данных MediaGallery

CREATE DATABASE IF NOT EXISTS mediagallery CHARACTER SET utf8mb4;
USE mediagallery;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type ENUM('image', 'video', 'audio') NOT NULL,
    category_id INT NOT NULL,
    file_path VARCHAR(255),
    source_url VARCHAR(500),
    author_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (author_id) REFERENCES users(id)
);

INSERT IGNORE INTO categories (name) VALUES
    ('Фотографии'),
    ('Музыка'),
    ('Обучение'),
    ('Развлечения'),
    ('Другое');
