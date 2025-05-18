// КОНФИГУРАЦИЯ
const CONFIG = {
  API_BASE_URL: '/api', // Базовый URL API
  TOKEN_KEY: 'rosseti_auth_token', // Ключ для хранения токена
  USER_DATA_KEY: 'rosseti_user_data' // Ключ для хранения данных пользователя
};

// ЭЛЕМЕНТЫ ДОМ
const DOM = {
  get loginBtn() { return document.getElementById('loginBtn') },
  get registerBtn() { return document.getElementById('registerBtn') },
  get userPanel() { return document.getElementById('userPanel') },
  get loginForm() { return document.getElementById('loginForm') },
  get registerForm() { return document.getElementById('registerForm') }
};

// СОСТОЯНИЕ ПРИЛОЖЕНИЯ
const STATE = {
  isAuthenticated: false,
  currentUser: null
};

// ИНИЦИАЛИЗАЦИЯ
function init() {
  setupEventListeners();
  checkAuthStatus();
}

// НАСТРОЙКА ОБРАБОТЧИКОВ СОБЫТИЙ
function setupEventListeners() {
  // Для форм
  if (DOM.registerForm) {
    DOM.registerForm.addEventListener('submit', handleRegister);
  }
  
  if (DOM.loginForm) {
    DOM.loginForm.addEventListener('submit', handleLogin);
  }
  
  // Для кнопок
  if (DOM.loginBtn) {
    DOM.loginBtn.addEventListener('click', () => {
      // Логика кнопки "Войти"
    });
  }
  
  if (DOM.registerBtn) {
    DOM.registerBtn.addEventListener('click', () => {
      // Логика кнопки "Регистрация"
    });
  }
}

// ПРОВЕРКА АВТОРИЗАЦИИ
async function checkAuthStatus() {
  const token = localStorage.getItem(CONFIG.TOKEN_KEY);
  if (!token) return;

  try {
    const response = await apiRequest('/auth/check', 'GET', null, token);
    if (response.ok) {
      const userData = await response.json();
      updateAuthState(userData);
    }
  } catch (error) {
    console.error('Ошибка проверки авторизации:', error);
  }
}

// ОБНОВЛЕНИЕ СОСТОЯНИЯ
function updateAuthState(userData) {
  STATE.isAuthenticated = true;
  STATE.currentUser = userData;
  localStorage.setItem(CONFIG.USER_DATA_KEY, JSON.stringify(userData));
  updateUI();
}

// ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
function updateUI() {
  if (STATE.isAuthenticated) {
    // Показываем элементы для авторизованных
    if (DOM.userPanel) DOM.userPanel.style.display = 'block';
    if (DOM.loginBtn) DOM.loginBtn.style.display = 'none';
    if (DOM.registerBtn) DOM.registerBtn.style.display = 'none';
  } else {
    // Показываем элементы для гостей
    if (DOM.userPanel) DOM.userPanel.style.display = 'none';
    if (DOM.loginBtn) DOM.loginBtn.style.display = 'block';
    if (DOM.registerBtn) DOM.registerBtn.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Получаем элементы формы регистрации
  const registerForm = document.getElementById('registerForm');
  const togglePasswordBtn = document.querySelector('.toggle-password');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');

  // Обработчик переключения видимости пароля
  if (togglePasswordBtn) {
      togglePasswordBtn.addEventListener('click', function() {
          const icon = this.querySelector('i');
          if (passwordInput.type === 'password') {
              passwordInput.type = 'text';
              icon.classList.remove('fa-eye');
              icon.classList.add('fa-eye-slash');
          } else {
              passwordInput.type = 'password';
              icon.classList.remove('fa-eye-slash');
              icon.classList.add('fa-eye');
          }
      });
  }

  // Валидация паролей
  function validatePasswords() {
      if (passwordInput && confirmPasswordInput) {
          if (passwordInput.value !== confirmPasswordInput.value) {
              confirmPasswordInput.setCustomValidity('Пароли не совпадают');
              return false;
          } else {
              confirmPasswordInput.setCustomValidity('');
              return true;
          }
      }
      return true;
  }

  if (passwordInput && confirmPasswordInput) {
      passwordInput.addEventListener('input', validatePasswords);
      confirmPasswordInput.addEventListener('input', validatePasswords);
  }

  // script.js
document.addEventListener('DOMContentLoaded', function() {
  // Получаем элементы формы
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const togglePasswordBtn = document.querySelector('.toggle-password');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');

  // Функция для переключения видимости пароля
  function togglePasswordVisibility() {
      if (passwordInput && togglePasswordBtn) {
          togglePasswordBtn.addEventListener('click', function() {
              const icon = this.querySelector('i');
              if (passwordInput.type === 'password') {
                  passwordInput.type = 'text';
                  icon.classList.remove('fa-eye');
                  icon.classList.add('fa-eye-slash');
              } else {
                  passwordInput.type = 'password';
                  icon.classList.remove('fa-eye-slash');
                  icon.classList.add('fa-eye');
              }
          });
      }
  }

  // Функция валидации паролей
  function validatePasswords() {
      if (passwordInput && confirmPasswordInput) {
          return passwordInput.value === confirmPasswordInput.value;
      }
      return false;
  }

  // Обработчик формы регистрации
  function handleRegister(e) {
      e.preventDefault();
      
      if (!validatePasswords()) {
          alert('Пароли не совпадают');
          return;
      }

      const formData = {
          fullname: document.getElementById('fullname').value,
          email: document.getElementById('email').value,
          password: passwordInput.value
      };

      console.log('Отправка данных регистрации:', formData);
      // Здесь будет логика отправки на сервер
      alert('Регистрация успешна!');
  }

  // Обработчик формы входа
  function handleLogin(e) {
      e.preventDefault();
      const formData = {
          email: document.getElementById('loginEmail').value,
          password: document.getElementById('loginPassword').value
      };
      console.log('Отправка данных входа:', formData);
      // Здесь будет логика отправки на сервер
      alert('Вход выполнен!');
  }

  // Настройка обработчиков событий
  function setupEventListeners() {
      if (registerForm) {
          registerForm.addEventListener('submit', handleRegister);
      }
      if (loginForm) {
          loginForm.addEventListener('submit', handleLogin);
      }
      togglePasswordVisibility();
  }

  // Инициализация
  function init() {
      setupEventListeners();
  }

  init();
});



// ПОМОЩНИК ДЛЯ API
async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : null
  });
  
  if (!response.ok) {
    throw new Error('Ошибка запроса');
  }
  
  return response;
}
document.getElementById("forgotPasswordForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Предотвращаем перезагрузку страницы
    
    const email = document.getElementById("email").value;
    
    // Здесь можно добавить AJAX-запрос к вашему серверу
    console.log("Password reset requested for:", email);
    
    alert("If the email exists, a password reset link has been sent to " + email);
});

// ЗАПУСК ПРИЛОГИЖЕНИЯ
document.addEventListener('DOMContentLoaded', init)});
