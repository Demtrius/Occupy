from fastapi import FastAPI

app = FastAPI(title="Clique API")


@app.get("/health")
async def health():
    return {"status": "ok"}
