// ====================== Глобальные переменные ======================
const API_BASE_URL = 'http://localhost:8000';
const AUTH_ENDPOINTS = {
    login: '/auth/login',
    register: '/auth/register',
    forgot: '/auth/forgot-password',
    validate: '/auth/validate-token'
};

// ====================== Основные функции аутентификации ======================
async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.login}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка входа');
        }

        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

async function registerUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.register}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка регистрации');
        }

        return await response.json();
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

async function forgotPassword(email) {
    try {
        const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.forgot}`, {
            method: 'POST',
            headers: {
                'Content.googleapis.com': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка восстановления пароля');
        }

        return await response.json();
    } catch (error) {
        console.error('Forgot password error:', error);
        throw error;
    }
}

async function validateToken() {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    try {
        const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.validate}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Невалидный токен');
        }

        return await response.json();
    } catch (error) {
        console.error('Token validation error:', error);
        localStorage.removeItem('authToken');
        throw error;
    }
}

// ====================== Обработчики событий ======================
function handleLoginFormSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    loginUser(email, password)
        .then(() => {
            window.location.href = '/profile';
        })
        .catch(error => {
            document.getElementById('login-error').textContent = error.message;
            document.getElementById('login-error').style.display = 'block';
        });
}

function handleRegisterFormSubmit(e) {
    e.preventDefault();
    const userData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirm-password').value
    };

    registerUser(userData)
        .then(() => {
            window.location.href = '/login';
        })
        .catch(error => {
            document.getElementById('register-error').textContent = error.message;
            document.getElementById('register-error').style.visibility = 'visible';
        });
}

function handleForgotPasswordFormSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const btn = document.getElementById('submitBtn');
    const spinner = document.getElementById('spinner');
    const btnText = document.getElementById('btnText');

    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'block';

    forgotPassword(email)
        .then(() => {
            alert('Письмо с инструкциями отправлено на ваш email');
            window.location.href = '/login';
        })
        .catch(error => {
            document.getElementById('error-message').textContent = error.message;
            document.getElementById('error-message').style.display = 'block';
        })
        .finally(() => {
            btn.disabled = false;
            btnText.style.display = 'inline';
            spinner.style.display = 'none';
        });
}

// ====================== Вспомогательные функции ======================
function togglePasswordVisibility(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function checkAuthStatus() {
    return validateToken()
        .then(user => {
            if (user) {
                // Пользователь аутентифицирован
                document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'block');
                document.querySelectorAll('.guest-required').forEach(el => el.style.display = 'none');
                return true;
            }
            return false;
        })
        .catch(() => false);
}

// ====================== Инициализация ======================
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация форм
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', handleLoginFormSubmit);
    }

    if (document.getElementById('registerForm')) {
        document.getElementById('registerForm').addEventListener('submit', handleRegisterFormSubmit);
    }

    if (document.getElementById('forgotPasswordForm')) {
        document.getElementById('forgotPasswordForm').addEventListener('submit', handleForgotPasswordFormSubmit);
    }

    // Инициализация кнопок показа пароля
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', () => {
            const input = button.closest('.form-group').querySelector('input[type="password"]');
            const icon = button.querySelector('i');
            togglePasswordVisibility(input.id, icon);
        });
    });

    // Проверка статуса аутентификации
    checkAuthStatus();
});
