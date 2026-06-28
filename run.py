"""
Start both servers for local development.
Usage: python run.py
Requires: pip install -r requirements.txt && cd frontend && npm install
"""

import subprocess, sys, os, time

def check_env():
    if not os.environ.get("ANTHROPIC_API_KEY"):
        key = input("ANTHROPIC_API_KEY not set. Paste your key (or press Enter to skip): ").strip()
        if key:
            os.environ["ANTHROPIC_API_KEY"] = key
        else:
            print("Warning: No API key set — Claude interpretation will fail.")

def main():
    check_env()
    print("\n[1/2] Starting FastAPI backend on http://localhost:8000 ...")
    backend = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--reload", "--port", "8000"],
        cwd=os.path.dirname(os.path.abspath(__file__)),
    )
    time.sleep(2)

    print("[2/2] Starting Vite frontend on http://localhost:5173 ...")
    frontend = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend"),
        shell=True,
    )

    print("\n✓ Both servers running.")
    print("  Backend: http://localhost:8000")
    print("  Frontend: http://localhost:5173")
    print("  API docs: http://localhost:8000/docs")
    print("\nPress Ctrl+C to stop.\n")

    try:
        backend.wait()
        frontend.wait()
    except KeyboardInterrupt:
        backend.terminate()
        frontend.terminate()
        print("\nStopped.")

if __name__ == "__main__":
    main()
