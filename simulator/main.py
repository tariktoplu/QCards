from fastapi import FastAPI
from pydantic import BaseModel
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
from qiskit.exceptions import QiskitError

# --- Data Models for Incoming Requests ---
class SimulationRequest(BaseModel):
    initial_state: str | None = None
    gate: str

# --- FastAPI Application Instance ---
app = FastAPI()

# --- Helper Function to Build and Run Quantum Circuit ---
def run_quantum_simulation(initial_state: str | None, gate: str) -> str:
    try:
        qc = QuantumCircuit(1, 1)
        if initial_state == '1':
            qc.x(0)
        
        if gate.lower() == 'h':
            qc.h(0)
        elif gate.lower() == 'x':
            qc.x(0)
        elif gate.lower() == 'z':
            qc.z(0)
        elif gate.lower() == 'i':
            qc.id(0) # CRITICAL FIX: Changed from qc.i(0) to qc.id(0)

        qc.measure(0, 0)
        
        simulator = AerSimulator()
        job = simulator.run(qc, shots=1)
        result = job.result()
        counts = result.get_counts(qc)
        
        measured_state = list(counts.keys())[0]
        return f'|{measured_state}>'

    except QiskitError as e:
        print(f"An error occurred during simulation: {e}")
        return "|error>"


# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Quantum Bluff - Simulation Server is running!"}

@app.post("/simulate")
def simulate_gate_operation(request: SimulationRequest):
    print(f"Received simulation request: initial_state='{request.initial_state}', gate='{request.gate}'")
    
    initial_ket = f'|{request.initial_state}>' if request.initial_state else '|0>'
    
    if request.gate.lower() == 'h':
        if initial_ket == '|0>':
            final_state = '|+>'
        elif initial_ket == '|1>':
            final_state = '|->'
        else:
            final_state = run_quantum_simulation(request.initial_state, request.gate)
    else:
        if initial_ket == '|+>' or initial_ket == '|->':
            if initial_ket == '|+>':
                temp_state = '0'
            else: # |->
                temp_state = '1'
            final_state = run_quantum_simulation(temp_state, request.gate)
        else:
            final_state = run_quantum_simulation(request.initial_state, request.gate)

    print(f"Simulation result: {final_state}")
    return {"final_state": final_state}