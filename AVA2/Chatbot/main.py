from calendar_extraction import extract_calendar_data
from send_email import *
from chatbot import respond_to_user_question
from headers_and_imports import *

calendar_data_list = extract_calendar_data()
# process_calendar_entries(calendar_data_list)
chat = model.start_chat()
calendar_table = extract_calendar_table(chat, calendar_data_list)
todo_list = extract_todo_list(chat, calendar_data_list)

initial_output = convert_summary_to_paragraph(llm, calendar_table, todo_list)

print ("Initial Output:", initial_output)

user_question = "What are the deadlines do I have today?"
answer = respond_to_user_question(model, user_question, calendar_data_list)
print("Answer:", answer)


# from fastapi import FastAPI, Request
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel

# from calendar_extraction import extract_calendar_data
# from send_email import *
# from chatbot import respond_to_user_question
# from headers_and_imports import *

# app = FastAPI()

# # Allow frontend requests (e.g., from localhost:5173)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # You can restrict this to your frontend domain
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Shared data setup
# calendar_data_list = extract_calendar_data()
# chat = model.start_chat()
# calendar_table = extract_calendar_table(chat, calendar_data_list)
# todo_list = extract_todo_list(chat, calendar_data_list)
# initial_output = convert_summary_to_paragraph(llm, calendar_table, todo_list)

# class Question(BaseModel):
#     question: str

# @app.get("/api/briefing")
# async def get_briefings():
#     return {"briefing": initial_output}

# @app.post("/api/question")
# async def handle_questions(data: Question):
#     answer = respond_to_user_question(model, data.question, calendar_data_list)
#     return {"answer": answer}
