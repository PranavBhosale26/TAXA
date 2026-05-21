from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from typing import List, Optional
from sqlalchemy.orm import Session
import models.database as db
from agent.graph import agent_app
from langchain_core.messages import HumanMessage, AIMessage
import auth
import PyPDF2
import io
import base64

import os
from dotenv import load_dotenv

load_dotenv()
ALLOWED_USERS = [u.strip().lower() for u in os.getenv("ALLOWED_USERS", "pranav,Pranav").split(",") if u.strip()]

def verify_user(username: str):
    # Opened to any user on the web for registration, login, and workspace operations.
    pass

db.Base.metadata.create_all(bind=db.engine)

app = FastAPI(
    title="TAXA AI Backend",
    description="Professional Agentic RAG API with Auth and witty TAXA conversational AI engine",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    database = db.SessionLocal()
    try:
        yield database
    finally:
        database.close()

# ---- Schemas ----
class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    username: str

class MessageSchema(BaseModel):
    role: str
    content: str
    image_url: Optional[str] = None

class ChatRequest(BaseModel):
    messages: List[MessageSchema]
    session_id: str

class ChatResponse(BaseModel):
    response: str

class HistoryResponse(BaseModel):
    messages: List[MessageSchema]

# ---- Auth Endpoints ----
@app.post("/api/register", response_model=Token)
async def register(user: UserCreate, database: Session = Depends(get_db)):
    verify_user(user.username)
    db_user = database.query(db.UserModel).filter(db.UserModel.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = db.UserModel(username=user.username, password_hash=hashed_password)
    database.add(new_user)
    database.commit()
    database.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.username})
    return {"access_token": access_token, "token_type": "bearer", "username": new_user.username}

@app.post("/api/login", response_model=Token)
async def login(user: UserLogin, database: Session = Depends(get_db)):
    verify_user(user.username)
    db_user = database.query(db.UserModel).filter(db.UserModel.username == user.username).first()
    if not db_user or not auth.verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = auth.create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer", "username": db_user.username}

class SessionResponse(BaseModel):
    id: str
    title: str

@app.get("/api/sessions/{username}", response_model=List[SessionResponse])
async def get_sessions(username: str, database: Session = Depends(get_db)):
    verify_user(username)
    user = database.query(db.UserModel).filter(db.UserModel.username == username).first()
    if not user:
        return []
    sessions = database.query(db.SessionModel).filter(db.SessionModel.user_id == user.id).all()
    return [{"id": s.id, "title": s.title} for s in sessions]

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str, database: Session = Depends(get_db)):
    session = database.query(db.SessionModel).filter(db.SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verify owner is allowed
    user = database.query(db.UserModel).filter(db.UserModel.id == session.user_id).first()
    if user:
        verify_user(user.username)
        
    # Delete all messages in the session
    database.query(db.MessageModel).filter(db.MessageModel.session_id == session_id).delete()
    
    # Delete the session itself
    database.delete(session)
    database.commit()
    return {"status": "success", "message": f"Session {session_id} and all messages deleted."}

@app.delete("/api/sessions/clear/{username}")
async def clear_all_sessions(username: str, database: Session = Depends(get_db)):
    verify_user(username)
    user = database.query(db.UserModel).filter(db.UserModel.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    sessions = database.query(db.SessionModel).filter(db.SessionModel.user_id == user.id).all()
    for s in sessions:
        database.query(db.MessageModel).filter(db.MessageModel.session_id == s.id).delete()
        database.delete(s)
        
    database.commit()
    return {"status": "success", "message": "All chat history cleared successfully."}

@app.get("/api/history/{session_id}", response_model=HistoryResponse)
async def get_history(session_id: str, database: Session = Depends(get_db)):
    msgs = database.query(db.MessageModel).filter(db.MessageModel.session_id == session_id).all()
    history = [MessageSchema(role=m.role, content=m.content, image_url=m.image_url) for m in msgs]
    return HistoryResponse(messages=history)

class ChatRequestWithUser(ChatRequest):
    username: str
    attached_file_content: Optional[str] = None
    attached_file_name: Optional[str] = None

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequestWithUser, database: Session = Depends(get_db)):
    session_id = request.session_id
    username = request.username
    verify_user(username)
    
    # Ensure Session exists
    session_exists = database.query(db.SessionModel).filter(db.SessionModel.id == session_id).first()
    if not session_exists:
        user = database.query(db.UserModel).filter(db.UserModel.username == username).first()
        if user:
            # Generate a title based on first query
            title = request.messages[-1].content[:30] + "..." if request.messages else "New Chat"
            new_session = db.SessionModel(id=session_id, user_id=user.id, title=title)
            database.add(new_session)
            database.commit()

    latest_user_msg = request.messages[-1]
    
    # Save the original user message to the DB
    db_msg = db.MessageModel(
        session_id=session_id, 
        role="user", 
        content=latest_user_msg.content,
        image_url=latest_user_msg.image_url
    )
    database.add(db_msg)
    database.commit()

    # Reconstruct history for LangGraph/LangChain
    lc_messages = []
    for msg in request.messages[:-1]:
        if msg.role == "user":
            if msg.image_url:
                lc_messages.append(HumanMessage(content=[
                    {"type": "text", "text": msg.content},
                    {"type": "image_url", "image_url": {"url": msg.image_url}}
                ]))
            else:
                lc_messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            lc_messages.append(AIMessage(content=msg.content))
            
    # Process RAG if text file content is attached to the current query
    final_user_content = latest_user_msg.content
    if request.attached_file_content and request.attached_file_name:
        ext = request.attached_file_name.lower().split('.')[-1]
        if ext in ['pdf', 'txt', 'csv', 'json', 'xml', 'md']:
            from core.rag import perform_rag
            # Perform our TF-IDF RAG retrieval to extract relevant context
            relevant_context = perform_rag(latest_user_msg.content, request.attached_file_content)
            final_user_content = f"[RAG Context from file '{request.attached_file_name}']:\n{relevant_context}\n\nUser Query: {latest_user_msg.content}"

    # Append latest query (multimodal or text/RAG)
    if latest_user_msg.image_url:
        lc_messages.append(HumanMessage(content=[
            {"type": "text", "text": final_user_content},
            {"type": "image_url", "image_url": {"url": latest_user_msg.image_url}}
        ]))
    else:
        lc_messages.append(HumanMessage(content=final_user_content))
            
    # Invoke LangGraph Agent Model (TAXA Gemini 2.5 Flash)
    result = agent_app.invoke({"messages": lc_messages})
    final_message = result["messages"][-1].content
    
    # Save assistant response to DB
    db_response = db.MessageModel(session_id=session_id, role="assistant", content=final_message)
    database.add(db_response)
    database.commit()
    
    return ChatResponse(response=final_message)

# ---- File/Image Upload Endpoint ----
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        # If it's an image, base64 encode it for multimodal LLM processing
        if filename.endswith((".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp")):
            ext = filename.split('.')[-1]
            mime = f"image/{ext}"
            if ext == "jpg":
                mime = "image/jpeg"
            base64_data = base64.b64encode(content).decode("utf-8")
            data_url = f"data:{mime};base64,{base64_data}"
            return {"filename": file.filename, "type": "image", "content": data_url}
            
        # Parse PDF documents
        elif filename.endswith(".pdf"):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            extracted_text = ""
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
            return {"filename": file.filename, "type": "text", "content": extracted_text}
            
        # Default decode as plain text
        else:
            extracted_text = content.decode("utf-8")
            return {"filename": file.filename, "type": "text", "content": extracted_text}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File parsing error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

