<?php
// Подключение к базе данных
$host = "localhost";
$dbname = "rosseti_db";
$username = "postgres";
$password = "123";
$conn = new PDO("pgsql:host=$host;dbname=$dbname", $username, $password);

// Проверка данных формы
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $user = $_POST['username'];
    $email = $_POST['email'];
    $pass = $_POST['password'];
    $confirm_pass = $_POST['confirm-password'];

    // Проверка совпадения паролей
    if ($pass !== $confirm_pass) {
        die("Пароли не совпадают!");
    }

    // Хеширование пароля
    $hashed_pass = password_hash($pass, PASSWORD_DEFAULT);

    // Вставка данных в базу
    $sql = "INSERT INTO users (username, email, hashed_password) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);

    if ($stmt->execute([$user, $email, $hashed_pass])) {
        echo "Пользователь зарегистрирован!";
    } else {
        echo "Ошибка регистрации!";
    }
}
?>
