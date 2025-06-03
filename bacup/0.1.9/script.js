// DOM элементы
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const userPanel = document.getElementById('userPanel');
const userName = document.getElementById('userName');
const sidebarUserName = document.getElementById('sidebarUserName');
const sidebarUserEmail = document.getElementById('sidebarUserEmail');

// Проверка авторизации при загрузке
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupMobileMenu();
    setupContentSections();
});

// Проверка статуса авторизации
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
        // В реальном приложении здесь бы была проверка токена
        const userData = JSON.parse(localStorage.getItem('userData')) || {
            name: 'Иван Иванов',
            email: 'ivan@example.com'
        };
        
        // Обновляем UI
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        userPanel.style.display = 'flex';
        userName.textContent = userData.name;
        sidebarUserName.textContent = userData.name;
        sidebarUserEmail.textContent = userData.email;
        
        // Показываем контент для авторизованных
        document.querySelector('.alert').style.display = 'none';
    }
}

// Мобильное меню
function setupMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.header__nav');
    const auth = document.querySelector('.header__auth');
    
    toggle.addEventListener('click', function() {
        const isNavVisible = nav.style.display === 'flex';
        nav.style.display = isNavVisible ? 'none' : 'flex';
        auth.style.display = isNavVisible ? 'none' : 'flex';
    });
}

// Управление разделами контента
function setupContentSections() {
    // Показываем первый раздел по умолчанию
    document.getElementById('home-content').classList.add('active');
    
    // Обработчики для бокового меню
    const menuLinks = document.querySelectorAll('.sidebar ul li a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Удаляем активный класс у всех ссылок
            menuLinks.forEach(item => item.classList.remove('active'));
            
            // Добавляем активный класс текущей ссылке
            this.classList.add('active');
            
            // Показываем соответствующий контент
            const target = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            showContent(target);
        });
    });
}

// Показать раздел контента
function showContent(sectionId) {
    // Скрываем все разделы
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Показываем выбранный раздел
    document.getElementById(`${sectionId}-content`).classList.add('active');
}

// Модальные окна
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function openRegisterModal() {
    document.getElementById('registerModal').style.display = 'flex';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

function switchToRegister() {
    closeLoginModal();
    openRegisterModal();
}

// Обработка формы регистрации
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };
    
    // В реальном приложении здесь был бы fetch запрос к API
    console.log('Регистрация:', formData);
    
    // Имитация успешной регистрации
    setTimeout(() => {
        localStorage.setItem('token', 'fake-jwt-token');
        localStorage.setItem('userData', JSON.stringify({
            name: formData.username,
            email: formData.email
        }));
        
        closeRegisterModal();
        checkAuthStatus();
        alert('Регистрация прошла успешно!');
    }, 1000);
});

// Обработка формы входа
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };
    
    // В реальном приложении здесь был бы fetch запрос к API
    console.log('Вход:', formData);
    
    // Имитация успешного входа
    setTimeout(() => {
        localStorage.setItem('token', 'fake-jwt-token');
        localStorage.setItem('userData', JSON.stringify({
            name: 'Иван Иванов', // В реальном приложении это пришло бы с сервера
            email: formData.email
        }));
        
        closeLoginModal();
        checkAuthStatus();
        alert('Вход выполнен успешно!');
    }, 1000);
});

// Выход из системы
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    
    loginBtn.style.display = 'block';
    registerBtn.style.display = 'block';
    userPanel.style.display = 'none';
    
    sidebarUserName.textContent = 'Гость';
    sidebarUserEmail.textContent = 'Не авторизован';
    
    // Показываем сообщение для гостей
    document.querySelector('.alert').style.display = 'flex';
    
    // Возвращаем на главную
    showContent('home');
    
    // Обновляем активную ссылку в меню
    const menuLinks = document.querySelectorAll('.sidebar ul li a');
    menuLinks.forEach(link => link.classList.remove('active'));
    menuLinks[0].classList.add('active');
}

// Закрытие модальных окон при клике вне их
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});


// Открытие модального окна для входа
function openLoginModal() {
  const loginModal = document.getElementById('loginModal');
  loginModal.style.display = 'block';
}

// Закрытие модального окна для входа
function closeLoginModal() {
  const loginModal = document.getElementById('loginModal');
  loginModal.style.display = 'none';
}

// Открытие модального окна для регистрации
function openRegisterModal() {
  const registerModal = document.getElementById('registerModal');
  registerModal.style.display = 'block';
}

// Закрытие модального окна для регистрации
function closeRegisterModal() {
  const registerModal = document.getElementById('registerModal');
  registerModal.style.display = 'none';
}
