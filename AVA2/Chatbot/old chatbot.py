from calendar_extraction import *
from send_email import *
from chatbot import *
from headers_and_imports import *

def convert_summary_to_paragraph(llm, calendar_table, todo_list):
    paragraph_prompt = PromptTemplate.from_template("""
        Based on the following calendar table and to-do list, write a clear, concise paragraph-style summary.
        - Use a professional and friendly tone.
        - Focus on clarity and readability.
        - Mention meetings and tasks in a flowing narrative.
        - Do not use lists, bullets, or tables.
        - Prioritize important tasks and urgent meetings.
        - Assume the user is a busy professional who wants a quick overview.

        Calendar Table:
        {calendar_table}

        To-Do List:
        {todo_list}
    """)
    paragraph_chain = LLMChain(llm=llm, prompt=paragraph_prompt)
    return paragraph_chain.run(calendar_table=calendar_table, todo_list=todo_list)

def respond_to_user_question(model, user_question, calendar_data_list):
    prompt = f"""
    You are a helpful assistant. Answer the user's question based only on:

    Calendar Entries:
    {' '.join(calendar_data_list)}

    User Question:
    {user_question}

    Guidelines:
    - If no relevant info, say "I couldn't find anything about that today."
    - Be clear, no asterisks or markdown.
    """

    chat = model.start_chat()
    return chat.send_message(prompt).text.strip()