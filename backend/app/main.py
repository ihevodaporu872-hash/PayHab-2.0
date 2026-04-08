from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, employees, departments, positions, cards, projects, estimate_sections, cost_types, material_requests, users

app = FastAPI(title="PayHab API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(departments.router)
app.include_router(positions.router)
app.include_router(cards.router)
app.include_router(projects.router)
app.include_router(estimate_sections.router)
app.include_router(cost_types.router)
app.include_router(material_requests.router)
app.include_router(users.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
