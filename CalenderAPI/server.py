# -*- coding:utf-8 -*-

"""API 服务
    Author: github@luochang212
    Date: 2020-11-15
    Usage: uvicorn server:app --reload
"""


from fastapi import FastAPI ,Request
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from fastapi import FastAPI, File, UploadFile, Depends
from fastapi.responses import JSONResponse
import shutil
import os
import configparser
import json

import database_handler
import method


app = FastAPI()


config = configparser.ConfigParser()
config.read('db.conf')
info = config['DEFAULT']

dbh = database_handler.DatabaseHandler(
    db_name=info['db_name'],
    check_same_thread=False)
m = method.Method(conf_file='db.conf')


class Schedule(BaseModel):
    sid: str  # ID
    name: str  # 名称
    content: str  # 内容
    category: str  # 分类
    level: int  # 重要程度, 0: 未定义  1: 低  2: 中  3: 高
    status: float  # 当前进度, 0 <= status <= 1
    creation_time: str  # 创建时间
    start_time: str  # 开始时间
    end_time: str  # 结束时间
    attachments: str #the path to attachment

# Set up templates
templates = Jinja2Templates(directory="templates")


@app.get('/')
# def index():
#     return {'app_name': 'calendar'}

def index(request: Request):
    schedules = dbh.fetch_all(table_name=info['table_name'])
    return templates.TemplateResponse("index.html", {"request": request, "schedules": schedules})


@app.get('/schedules')
def get_schedules():
    return dbh.fetch_all(
        table_name=info['table_name'])


@app.get('/schedules/{schedule_id}')
def get_schedule(schedule_id: str):
    return m.get(dbh, schedule_id)


@app.post('/schedules')
def create_schedule(schedule: Schedule):
    if m.post(dbh, schedule):
        return schedule
    else:
        return {"errno": "1"}


@app.put('/schedules/{schedule_id}')
def update_schedule(schedule_id: str, schedule: Schedule):
    if m.update(dbh, schedule_id, schedule):
        return schedule
    else:
        return {"errno": "2"}


@app.delete('/schedules/{schedule_id}')
    
def delete_schedule(schedule_id: str):
    if m.delete(dbh, schedule_id):
        return {"msg": "success"}
    else:
        return {"errno": "3"}
    
# Get the directory where the script is running
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Append "attachments" to it
UPLOAD_DIR = os.path.join(BASE_DIR, "attachments")
# Ensure the directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)
print(f"Uploads will be saved in: {UPLOAD_DIR}")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Ensure the directory exists
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        file_location = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return JSONResponse(content={"message": "File uploaded successfully", "file_name": file.filename}, status_code=200)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# # -*- coding:utf-8 -*-
# """API 服务
#     Author: github@luochang212
#     Date: 2020-11-15
#     Usage: uvicorn server:app --reload
# """

# from fastapi import FastAPI, Request, File, UploadFile
# from fastapi.templating import Jinja2Templates
# from fastapi.responses import JSONResponse
# from pydantic import BaseModel
# import shutil
# import os
# import configparser

# import database_handler
# import method


# # 🧠 AI logic
# from AVA2.Chatbot.main import get_briefings, handle_questions

# app = FastAPI()

# # Configuration
# config = configparser.ConfigParser()
# config.read('db.conf')
# info = config['DEFAULT']

# # Database handler
# dbh = database_handler.DatabaseHandler(
#     db_name=info['db_name'],
#     check_same_thread=False
# )

# m = method.Method(conf_file='db.conf')

# # Upload directory
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# UPLOAD_DIR = os.path.join(BASE_DIR, "attachments")
# os.makedirs(UPLOAD_DIR, exist_ok=True)

# print(f"Uploads will be saved in: {UPLOAD_DIR}")

# # Templates
# templates = Jinja2Templates(directory="templates")

# # Schedule model
# class Schedule(BaseModel):
#     sid: str
#     name: str
#     content: str
#     category: str
#     level: int
#     status: float
#     creation_time: str
#     start_time: str
#     end_time: str
#     attachments: str

# # Main page
# @app.get('/')
# def index(request: Request):
#     schedules = dbh.fetch_all(table_name=info['table_name'])
#     return templates.TemplateResponse("index.html", {"request": request, "schedules": schedules})

# # CRUD Endpoints
# @app.get('/schedules')
# def get_schedules():
#     return dbh.fetch_all(table_name=info['table_name'])

# @app.get('/schedules/{schedule_id}')
# def get_schedule(schedule_id: str):
#     return m.get(dbh, schedule_id)

# @app.post('/schedules')
# def create_schedule(schedule: Schedule):
#     if m.post(dbh, schedule):
#         return schedule
#     return {"errno": "1"}

# @app.put('/schedules/{schedule_id}')
# def update_schedule(schedule_id: str, schedule: Schedule):
#     if m.update(dbh, schedule_id, schedule):
#         return schedule
#     return {"errno": "2"}

# @app.delete('/schedules/{schedule_id}')
# def delete_schedule(schedule_id: str):
#     if m.delete(dbh, schedule_id):
#         return {"msg": "success"}
#     return {"errno": "3"}

# # File upload endpoint
# @app.post("/upload")
# async def upload_file(file: UploadFile = File(...)):
#     try:
#         os.makedirs(UPLOAD_DIR, exist_ok=True)
#         file_location = os.path.join(UPLOAD_DIR, file.filename)
#         with open(file_location, "wb") as buffer:
#             shutil.copyfileobj(file.file, buffer)
#         return JSONResponse(content={"message": "File uploaded successfully", "file_name": file.filename}, status_code=200)
#     except Exception as e:
#         return JSONResponse(content={"error": str(e)}, status_code=500)

# # ✅ AI-Driven Briefing Endpoint
# @app.get("/api/briefing")
# def get_briefing():
#     try:
#         schedules = dbh.fetch_all(table_name=info['table_name'])
#         if not schedules:
#             return {"briefing": "You have no schedules today."}
#         briefing = get_briefings(schedules)
#         return {"briefing": briefing}
#     except Exception as e:
#         return {"briefing": f"Error generating briefing: {str(e)}"}

# # ✅ AI-Driven Q&A Endpoint
# class QuestionRequest(BaseModel):
#     question: str

# @app.post("/api/question")
# def ask_question(payload: QuestionRequest):
#     try:
#         schedules = dbh.fetch_all(table_name=info['table_name'])
#         answer = handle_questions(schedules, payload.question)
#         return {"answer": answer}
#     except Exception as e:
#         return {"answer": f"Error answering question: {str(e)}"}
