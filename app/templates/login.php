<?php
// Подключение к базе данных
$host = "localhost";
$dbname = "rosseti_db";
$username = "postgres";
$password = "123";
$conn = new PDO("pgsql:host=$host;dbname=$dbname", $username, $password);

// Проверка данных формы
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST['email'];
    $pass = $_POST['password'];

    // Получаем пользователя по email
    $sql = "SELECT * FROM users WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($pass, $user['hashed_password'])) {
        echo "Авторизация успешна!";
        // Тут можно установить сессию или JWT-токен
    } else {
        echo "Неверный email или пароль!";
    }
}
?>
