import psycopg2

try:
    conn = psycopg2.connect(
        host="localhost",
        port="5433",
        database="rosseti_db",
        user="postgres",
        password="123"
    )
    print("✅ Подключение к PostgreSQL успешно!")
    conn.close()
except Exception as e:
    print(f"❌ Ошибка подключения: {e}")