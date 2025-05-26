from vertexai.generative_models import GenerativeModel, SafetySetting, Part
from datetime import datetime
import vertexai
import requests
import win32com.client as com
from langchain_google_vertexai import ChatVertexAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.agents.agent_types import AgentType

# URL and keys for calendar data
url = "http://localhost:8000/schedules"
keys = [
    "sid", "name", "content", "category", "level", "status", 
    "creation_time", "start_time", "end_time", "attachments"
]

# Vertex AI model and initialization
vertexai.init(project="623829688314", location="us-central1")
model = GenerativeModel("projects/623829688314/locations/us-central1/endpoints/2577788518646415360")
llm = ChatVertexAI(model_name="projects/623829688314/locations/us-central1/endpoints/2577788518646415360", temperature=0.7)

generation_config = {
    "max_output_tokens": 8192,
    "temperature": 0.7,
    "top_p": 1,
}

safety_settings = [
    SafetySetting(
        category=SafetySetting.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold=SafetySetting.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
    ),
    SafetySetting(
        category=SafetySetting.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold=SafetySetting.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
    ),
    SafetySetting(
        category=SafetySetting.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold=SafetySetting.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
    ),
    SafetySetting(
        category=SafetySetting.HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold=SafetySetting.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
    ),
]
