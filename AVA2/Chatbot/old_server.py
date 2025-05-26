from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from calendar_extraction import extract_calendar_data
from send_email import *
from chatbot import respond_to_user_question
from headers_and_imports import *

app = FastAPI()

# Allow frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to your frontend URL if deploying
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

calendar_data_list = extract_calendar_data()
chat = model.start_chat()
calendar_table = extract_calendar_table(chat, calendar_data_list)
todo_list = extract_todo_list(chat, calendar_data_list)

# Convert to paragraph on startup
initial_output = convert_summary_to_paragraph(llm, calendar_table, todo_list)

@app.get("/initial_output")
def get_initial_output():
    return {"summary": initial_output}

class UserInput(BaseModel):
    question: str

@app.post("/ask")
def answer_question(user_input: UserInput):
    answer = respond_to_user_question(model, user_input.question, calendar_data_list)
    return {"answer": answer}
