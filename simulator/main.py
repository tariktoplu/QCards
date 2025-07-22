# simulator/main.py
from fastapi import FastAPI

# Uygulamamızı oluşturuyoruz
app = FastAPI()

# Kök adrese (http://localhost:8000) bir GET isteği geldiğinde çalışacak fonksiyon
@app.get("/")
def read_root():
    return {"message": "Quantum Bluff - Simulation Server is running!"}


# /simulate adresine bir POST isteği geldiğinde çalışacak fonksiyon
@app.post("/simulate")
def simulate_measurement():
    # --- GELECEKTE BURASI GERÇEK QISKIT MANTIĞI İLE DEĞİŞECEK ---
    # Bu aşamada, sadece sahte bir ölçüm sonucu döndürüyoruz.
    # Oyunun geri kalanını geliştirirken bu bize yeterli olacaktır.
    print("Simülasyon isteği alındı. Sahte sonuç '0' döndürülüyor.")
    return {"measurement_result": "0", "info": "This is a dummy simulation result."}