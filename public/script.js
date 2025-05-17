// КОНФИГУРАЦИЯ
// Базовый URL для API запросов
const API_BASE_URL = '/api';
// Ключ для хранения токена авторизации в localStorage
const TOKEN_KEY = 'rosseti_auth_token';
// Ключ для хранения данных пользователя в localStorage
const USER_DATA_KEY = 'rosseti_user_data';

// КЭШ ДОМ-ЭЛЕМЕНТОВ
// Собираем все нужные элементы в одном объекте для удобства
const elements = {
  loginBtn: document.getElementById('loginBtn'), // Кнопка входа
  registerBtn: document.getElementById('registerBtn'), // Кнопка регистрации
  userPanel: document.getElementById('userPanel'), // Панель пользователя
  userName: document.getElementById('userName'), // Имя пользователя в шапке
  sidebarUserName: document.getElementById('sidebarUserName'), // Имя в сайдбаре
  sidebarUserEmail: document.getElementById('sidebarUserEmail'), // Email в сайдбаре
  loginForm: document.getElementById('loginForm'), // Форма входа
  registerForm: document.getElementById('registerForm'), // Форма регистрации
  loginModal: document.getElementById('loginModal'), // Модальное окно входа
  registerModal: document.getElementById('registerModal') // Модальное окно регистрации
};

// СОСТОЯНИЕ ПРИЛОЖЕНИЯ
const state = {
  isAuthenticated: false, // Авторизован ли пользователь
  currentUser: null // Данные текущего пользователя
};

// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
function init() {
  checkAuthStatus(); // Проверяем статус авторизации
  setupMobileMenu(); // Настраиваем мобильное меню
  setupContentSections(); // Настраиваем разделы контента
  setupFormHandlers(); // Настраиваем обработчики форм
  setupModalHandlers(); // Настраиваем модальные окна
  setupGlobalEventListeners(); // Глобальные обработчики событий
  setupTabs(); // Настраиваем табы
}

// ФУНКЦИИ АВТОРИЗАЦИИ

// Проверка статуса авторизации
async function checkAuthStatus() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return; // Если токена нет, выходим

  try {
    // Делаем запрос к API для проверки токена
    const response = await apiRequest('/me', 'GET', null, token);
    
    if (response.ok) {
      const userData = await response.json();
      updateAuthState(userData); // Обновляем состояние при успехе
    } else {
      clearAuthState(); // Очищаем состояние при ошибке
    }
  } catch (error) {
    console.error('Ошибка проверки авторизации:', error);
    clearAuthState();
  }
}

// Обновление состояния авторизации
function updateAuthState(userData) {
  state.isAuthenticated = true;
  state.currentUser = userData;
  
  // Сохраняем данные в localStorage
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  updateUIForAuthenticatedUser(userData); // Обновляем интерфейс
}

// Очистка состояния авторизации
function clearAuthState() {
  state.isAuthenticated = false;
  state.currentUser = null;
  
  // Удаляем данные из localStorage
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  updateUIForUnauthenticatedUser(); // Обновляем интерфейс
}

// ОБНОВЛЕНИЕ ИНТЕРФЕЙСА

// Для авторизованного пользователя
function updateUIForAuthenticatedUser(userData) {
  // Скрываем кнопки входа/регистрации, показываем панель пользователя
  if (elements.loginBtn) elements.loginBtn.style.display = 'none';
  if (elements.registerBtn) elements.registerBtn.style.display = 'none';
  if (elements.userPanel) elements.userPanel.style.display = 'flex';
  
  // Обновляем данные пользователя
  if (elements.userName) elements.userName.textContent = userData.username;
  if (elements.sidebarUserName) elements.sidebarUserName.textContent = userData.username;
  if (elements.sidebarUserEmail) elements.sidebarUserEmail.textContent = userData.email;
  
  // Скрываем предупреждение для неавторизованных
  const alert = document.querySelector('.alert');
  if (alert) alert.style.display = 'none';
}

// Для неавторизованного пользователя
function updateUIForUnauthenticatedUser() {
  // Показываем кнопки входа/регистрации, скрываем панель пользователя
  if (elements.loginBtn) elements.loginBtn.style.display = 'block';
  if (elements.registerBtn) elements.registerBtn.style.display = 'block';
  if (elements.userPanel) elements.userPanel.style.display = 'none';
  
  // Устанавливаем значения по умолчанию
  if (elements.sidebarUserName) elements.sidebarUserName.textContent = 'Гость';
  if (elements.sidebarUserEmail) elements.sidebarUserEmail.textContent = 'Не авторизован';
  
  // Показываем предупреждение для неавторизованных
  const alert = document.querySelector('.alert');
  if (alert) alert.style.display = 'flex';
}

// ПОМОЩНИК ДЛЯ API ЗАПРОСОВ
async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Добавляем токен в заголовки, если он есть
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : null,
      credentials: 'include'
    });
    
    // Обрабатываем ошибки
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Ошибка запроса');
    }
    
    return response;
  } catch (error) {
    console.error('Ошибка API запроса:', error);
    throw error;
  }
}

// ОБРАБОТЧИКИ ФОРМ

// Настройка обработчиков форм
function setupFormHandlers() {
  if (elements.registerForm) {
    elements.registerForm.addEventListener('submit', handleRegister);
  }
  
  if (elements.loginForm) {
    elements.loginForm.addEventListener('submit', handleLogin);
  }
}

// Обработка регистрации
async function handleRegister(e) {
  e.preventDefault();
  
  try {
    const formData = {
      username: document.getElementById('username').value,
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    };
    
    // Отправляем данные регистрации
    const response = await apiRequest('/register', 'POST', formData);
    const data = await response.json();
    
    // Сохраняем токен и обновляем состояние
    localStorage.setItem(TOKEN_KEY, data.token);
    updateAuthState(data.user);
    
    // Закрываем модальное окно и показываем уведомление
    closeModal('registerModal');
    showToast('Регистрация прошла успешно!');
    
    // Перенаправляем в личный кабинет
    window.location.href = 'personal.html';
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Обработка входа
async function handleLogin(e) {
  e.preventDefault();
  
  try {
    const formData = {
      email: document.getElementById('loginEmail').value,
      password: document.getElementById('loginPassword').value
    };
    
    // Отправляем данные входа
    const response = await apiRequest('/login', 'POST', formData);
    const data = await response.json();
    
    // Сохраняем токен и обновляем состояние
    localStorage.setItem(TOKEN_KEY, data.token);
    updateAuthState(data.user);
    
    // Закрываем модальное окно и показываем уведомление
    closeModal('loginModal');
    showToast('Вход выполнен успешно!');
    
    // Перенаправляем в личный кабинет
    window.location.href = 'personal.html';
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// РАБОТА С МОДАЛЬНЫМИ ОКНАМИ

// Настройка обработчиков модальных окон
function setupModalHandlers() {
  // Закрытие при клике вне окна
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });
  
  // Кнопки закрытия
  document.querySelectorAll('.modal .close').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(btn.closest('.modal').id);
    });
  });
}

// Открытие модального окна
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'flex';
}

// Закрытие модального окна
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'none';
}

// НАВИГАЦИЯ ПО РАЗДЕЛАМ

// Настройка разделов контента
function setupContentSections() {
  const defaultSection = document.getElementById('home-content');
  if (defaultSection) defaultSection.classList.add('active');
  
  // Обработчики для меню
  document.querySelectorAll('.sidebar ul li a').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Удаляем активный класс у всех пунктов
      document.querySelectorAll('.sidebar ul li a').forEach(item => {
        item.classList.remove('active');
      });
      
      // Добавляем активный класс текущему пункту
      this.classList.add('active');
      showContent(this.dataset.section || 'home');
    });
  });
}

// Показ нужного раздела
function showContent(sectionId) {
  // Скрываем все разделы
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Показываем нужный раздел
  const targetSection = document.getElementById(`${sectionId}-content`);
  if (targetSection) targetSection.classList.add('active');
}

// РАБОТА С ТАБАМИ

// Настройка табов
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Удаляем активный класс у всех кнопок и контента
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Добавляем активный класс текущей кнопке
      button.classList.add('active');
      
      // Находим и показываем соответствующий контент
      const tabId = button.getAttribute('data-tab');
      const content = document.getElementById(tabId);
      if (content) {
        content.classList.add('active');
        // Плавное появление
        content.style.opacity = 0;
        setTimeout(() => {
          content.style.opacity = 1;
        }, 10);
      }
    });
  });
}

// МОБИЛЬНОЕ МЕНЮ

// Настройка мобильного меню
function setupMobileMenu() {
  const toggle = document.querySelector('.mobile-menu-toggle');
  if (!toggle) return;
  
  const nav = document.querySelector('.header__nav');
  const auth = document.querySelector('.header__auth');
  
  toggle.addEventListener('click', () => {
    const isNavVisible = nav.style.display === 'flex';
    nav.style.display = isNavVisible ? 'none' : 'flex';
    auth.style.display = isNavVisible ? 'none' : 'flex';
  });
}

// ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ

// Настройка глобальных обработчиков
function setupGlobalEventListeners() {
  // Кнопка выхода
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
  
  // Ссылка "Зарегистрироваться" в форме входа
  const switchToRegister = document.querySelector('.switch-to-register');
  if (switchToRegister) {
    switchToRegister.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal('loginModal');
      openModal('registerModal');
    });
  }
  
  // Переключение видимости пароля
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', function() {
      const input = this.parentElement.querySelector('input');
      const icon = this.querySelector('i');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    });
  });
}

// ВЫХОД ИЗ СИСТЕМЫ
function logout() {
  clearAuthState();
  showToast('Вы успешно вышли из системы');
  window.location.href = 'index.html';
}

// УВЕДОМЛЕНИЯ

// Показ всплывающих уведомлений
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Плавное появление
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Автоматическое скрытие через 3 секунды
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ЗАПУСК ПРИЛОЖЕНИЯ
document.addEventListener('DOMContentLoaded', init);
