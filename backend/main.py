from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, BackgroundTasks
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

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "TAXA Engine"}

# ---- Schemas ----
class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class GoogleLoginRequest(BaseModel):
    email: str
    name: str

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

@app.post("/api/google-login", response_model=Token)
async def google_login(payload: GoogleLoginRequest, database: Session = Depends(get_db)):
    username = payload.email.lower()
    db_user = database.query(db.UserModel).filter(db.UserModel.username == username).first()
    if not db_user:
        hashed_password = auth.get_password_hash("google_auth_" + os.urandom(8).hex())
        db_user = db.UserModel(username=username, password_hash=hashed_password)
        database.add(db_user)
        database.commit()
        database.refresh(db_user)
        
    access_token = auth.create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer", "username": db_user.username}

class QuickLoginRequest(BaseModel):
    name: str

@app.post("/api/quick-login", response_model=Token)
async def quick_login(payload: QuickLoginRequest, database: Session = Depends(get_db)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name cannot be empty.")
    
    # Generate a secure slugified username from the name
    import re
    username = re.sub(r'[^a-zA-Z0-9_]', '', name.lower().replace(' ', '_'))
    if not username:
        username = "guest_" + os.urandom(4).hex()
        
    db_user = database.query(db.UserModel).filter(db.UserModel.username == username).first()
    if not db_user:
        # Create a new user with a silent, secure random password hash
        hashed_password = auth.get_password_hash("quick_auth_" + os.urandom(8).hex())
        db_user = db.UserModel(username=username, password_hash=hashed_password)
        database.add(db_user)
        database.commit()
        database.refresh(db_user)
        
    access_token = auth.create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer", "username": db_user.username}


class SessionResponse(BaseModel):
    id: str
    title: str

@app.get("/api/verify-token")
async def verify_token(current_user: str = Depends(auth.get_current_user)):
    return {"status": "valid", "username": current_user}

@app.get("/api/sessions/{username}", response_model=List[SessionResponse])
async def get_sessions(username: str, database: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    if current_user.lower() != username.lower():
        raise HTTPException(status_code=403, detail="Forbidden: You cannot access this user's sessions.")
    user = database.query(db.UserModel).filter(db.UserModel.username == username).first()
    if not user:
        return []
    sessions = database.query(db.SessionModel).filter(db.SessionModel.user_id == user.id).all()
    return [{"id": s.id, "title": s.title} for s in sessions]

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str, database: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    session = database.query(db.SessionModel).filter(db.SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verify owner matches authenticated user
    user = database.query(db.UserModel).filter(db.UserModel.id == session.user_id).first()
    if not user or user.username.lower() != current_user.lower():
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this session.")
        
    # Delete all messages in the session
    database.query(db.MessageModel).filter(db.MessageModel.session_id == session_id).delete()
    
    # Delete the session itself
    database.delete(session)
    database.commit()
    return {"status": "success", "message": f"Session {session_id} and all messages deleted."}

@app.delete("/api/sessions/clear/{username}")
async def clear_all_sessions(username: str, database: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    if current_user.lower() != username.lower():
        raise HTTPException(status_code=403, detail="Forbidden: You cannot clear this user's history.")
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
async def get_history(session_id: str, database: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    session = database.query(db.SessionModel).filter(db.SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Verify owner matches authenticated user
    user = database.query(db.UserModel).filter(db.UserModel.id == session.user_id).first()
    if not user or user.username.lower() != current_user.lower():
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this session.")

    msgs = database.query(db.MessageModel).filter(db.MessageModel.session_id == session_id).all()
    history = [MessageSchema(role=m.role, content=m.content, image_url=m.image_url) for m in msgs]
    return HistoryResponse(messages=history)

class ChatRequestWithUser(ChatRequest):
    username: str
    attached_file_content: Optional[str] = None
    attached_file_name: Optional[str] = None

def update_user_memory_task(user_id: int, user_msg: str, assistant_reply: str):
    db_session = db.SessionLocal()
    try:
        memory_rec = db_session.query(db.UserMemoryModel).filter(db.UserMemoryModel.user_id == user_id).first()
        current_notes = memory_rec.memory_notes if memory_rec else ""
        
        api_key = os.getenv("OPENROUTER_API_KEY", "")
        if not api_key or api_key == "paste_your_actual_key_here":
            return
            
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import SystemMessage
        
        llm = ChatOpenAI(
            model_name="google/gemini-2.5-flash",
            openai_api_key=api_key,
            openai_api_base="https://openrouter.ai/api/v1",
            temperature=0.2,
            max_tokens=500,
        )
        
        prompt = f"""You are a quiet background memory-logging agent. Your job is to analyze the conversation exchange and update a highly-compressed memory profile of the user.

CURRENT MEMORY PROFILE:
{current_notes or "(No memory yet)"}

NEW INTERACTION:
User: {user_msg}
Assistant: {assistant_reply}

INSTRUCTIONS:
1. Extract any concrete, personal details about the user mentioned in the interaction (e.g. their name, age, location, job, favorite tech/coding stack, hobbies, language preferences, habits, goals, specific concerns, or style of talking).
2. Merge these new details into the CURRENT MEMORY PROFILE.
3. Remove old, redundant, outdated, or contradictory items. Keep it extremely compact (maximum 10 bullet points).
4. Each bullet point should be a single, short sentence written in the English alphabet (e.g. "* User likes to code in TypeScript.", "* User's name is Pranav.").
5. Output ONLY the updated list of bullet points. No conversational intro, no fluff, no explanations. Just the list.
"""
        try:
            response = llm.invoke([SystemMessage(content=prompt)])
        except Exception as e:
            error_msg = str(e)
            is_credit_error = (
                "402" in error_msg 
                or "credit" in error_msg.lower() 
                or "afford" in error_msg.lower() 
                or "payment" in error_msg.lower()
                or "billing" in error_msg.lower()
            )
            if is_credit_error:
                try:
                    fallback_llm = ChatOpenAI(
                        model_name="google/gemma-2-9b-it:free",
                        openai_api_key=api_key,
                        openai_api_base="https://openrouter.ai/api/v1",
                        temperature=0.2,
                        max_tokens=300,
                    )
                    response = fallback_llm.invoke([SystemMessage(content=prompt)])
                except Exception as fallback_e:
                    try:
                        final_llm = ChatOpenAI(
                            model_name="openrouter/free",
                            openai_api_key=api_key,
                            openai_api_base="https://openrouter.ai/api/v1",
                            temperature=0.2,
                            max_tokens=300,
                        )
                        response = final_llm.invoke([SystemMessage(content=prompt)])
                    except Exception as final_e:
                        raise final_e
            else:
                raise e

        updated_notes = response.content.strip()
        if updated_notes:
            if not memory_rec:
                memory_rec = db.UserMemoryModel(user_id=user_id, memory_notes=updated_notes)
                db_session.add(memory_rec)
            else:
                memory_rec.memory_notes = updated_notes
            db_session.commit()
    except Exception as e:
        print(f"[BACKGROUND MEMORY ERROR]: {e}")
    finally:
        db_session.close()

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequestWithUser, background_tasks: BackgroundTasks, database: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    session_id = request.session_id
    username = request.username
    if current_user.lower() != username.lower():
        raise HTTPException(status_code=403, detail="Forbidden: You cannot chat as another user.")
    
    # Ensure Session exists and retrieve user object
    user = database.query(db.UserModel).filter(db.UserModel.username == username).first()
    
    session_exists = database.query(db.SessionModel).filter(db.SessionModel.id == session_id).first()
    if not session_exists:
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
            
    # Retrieve user memory if available
    user_memory_notes = ""
    if user:
        memory_rec = database.query(db.UserMemoryModel).filter(db.UserMemoryModel.user_id == user.id).first()
        if memory_rec:
            user_memory_notes = memory_rec.memory_notes

    # Invoke LangGraph Agent Model (TAXA Gemini 2.5 Flash) with memory injection
    result = agent_app.invoke({"messages": lc_messages, "user_memory": user_memory_notes})
    final_message = result["messages"][-1].content
    
    # Save assistant response to DB
    db_response = db.MessageModel(session_id=session_id, role="assistant", content=final_message)
    database.add(db_response)
    database.commit()
    
    # Schedule background memory update task to teach the bot from this interaction
    if user:
        background_tasks.add_task(
            update_user_memory_task, 
            user.id, 
            latest_user_msg.content, 
            final_message
        )
    
    return ChatResponse(response=final_message)

# ---- File/Image Upload Endpoint ----
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), current_user: str = Depends(auth.get_current_user)):
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

