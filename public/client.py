import requests

BASE_URL = "http://localhost:8000"

def register(username, email, password):
    response = requests.post(
        f"{BASE_URL}/register/",
        json={"username": username, "email": email, "password": password}
    )
    return response.json()

def login(email, password):
    response = requests.post(
        f"{BASE_URL}/login/",
        json={"email": email, "password": password}
    )
    return response.json()

def get_current_user(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/me/", headers=headers)
    return response.json()

# Пример использования
if __name__ == "__main__":
    # Регистрация
    print(register("testuser", "test@example.com", "password123"))
    
    # Вход
    token_data = login("test@example.com", "password123")
    print("Token:", token_data)
    
    # Получение данных пользователя
    print(get_current_user(token_data["access_token"]))
