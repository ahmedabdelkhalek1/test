from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from calendar_extraction import extract_calendar_data
from chatbot import *
from headers_and_imports import *

# app = FastAPI()

# # Allow frontend calls
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # change to your frontend URL if deploying
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# calendar_data_list = extract_calendar_data()
# chat = model.start_chat()
# calendar_table = extract_calendar_table(chat, calendar_data_list)
# todo_list = extract_todo_list(chat, calendar_data_list)

# # Convert to paragraph on startup
# initial_output = process_calendar_entries(calendar_data_list)

# # @app.get("/initial_output")
# # def get_initial_output():
# #     return {"summary": initial_output}
# initial_output_cache = None

# @app.get("/initial_output")
# def get_initial_output():
#     global initial_output_cache
#     if not initial_output_cache:
#         calendar_data_list = extract_calendar_data()
#         initial_output_cache = process_calendar_entries(calendar_data_list)
#     return {"summary": initial_output_cache}


# class UserInput(BaseModel):
#     question: str

# @app.post("/ask")
# def answer_question(user_input: UserInput):
#     answer = respond_to_user_question(model, user_input.question, calendar_data_list)
#     return {"answer": answer}

from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import threading
import time

from calendar_extraction import extract_calendar_data
from chatbot import process_calendar_entries, respond_to_user_question

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev; change to specific domain in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global cache
initial_output_cache = None
cache_lock = threading.Lock()

# Background task to generate initial summary
def precompute_summary():
    global initial_output_cache
    calendar_data = extract_calendar_data()
    result = process_calendar_entries(calendar_data)
    with cache_lock:
        initial_output_cache = result
    print("Initial output cached.")

@app.get("/initial_output")
def get_initial_output(background_tasks: BackgroundTasks):
    global initial_output_cache

    with cache_lock:
        if initial_output_cache is not None:
            return {"summary": initial_output_cache}

    # Launch background task
    background_tasks.add_task(precompute_summary)
    return {"summary": "Processing summary. Please refresh in a few seconds."}


class UserInput(BaseModel):
    question: str

@app.post("/ask")
def answer_question(user_input: UserInput):
    calendar_data = extract_calendar_data()
    answer = respond_to_user_question(model, user_input.question, calendar_data)
    return {"answer": answer}
