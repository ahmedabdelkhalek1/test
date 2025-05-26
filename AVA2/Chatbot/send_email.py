# email_and_process.py

from headers_and_imports import *

def send_email(content):
    outlook = com.Dispatch("Outlook.Application")
    mail = outlook.CreateItem(0)
    mail.To = "rawaali@deloitte.com"
    mail.Subject = f"Your Calendar Summary for Today: {datetime.now().date()}"
    mail.HTMLBody = content
    mail.BodyFormat = 2
    mail.Send()

def extract_calendar_table(chat, calendar_data_list):
    prompt = (
        "Extract the following details from these calendar entries and return them as a properly formatted table "
        "- Date "
        "- Time "
        "- Title "
        "- Location "
        "- Agenda "
        "Calendar Data: " + " ".join(calendar_data_list)
    )
    response = chat.send_message(prompt)
    return response.text

def extract_todo_list(chat, calendar_data_list):
    prompt = (
        "Given these calendar entries, extract all actionable tasks. "
        "For each task, provide: "
        "- Action (what needs to be done) "
        "- Deadline (if not specified, use the meeting's date) "
        "- Source meeting "
        "Sort tasks by task deadline ascendingly using the format YYYY-MM-DD. "
        "Calendar Data: " + " ".join(calendar_data_list)
    )
    response = chat.send_message(prompt)
    return response.text

def generate_summary(llm, calendar_table, todo_list, calendar_data_list):
    summary_prompt = PromptTemplate.from_template(
        "Format the following information as an email: "
        "Hello User, "
        "This email summarizes your upcoming calendar events for today: "
        f"{calendar_table} "
        "To-do List (sorted by deadline): "
        f"{todo_list}"
    )
    summary_chain = LLMChain(llm=llm, prompt=summary_prompt)
    return summary_chain.run(calendar_data=calendar_data_list)

def enhance_summary(llm, summary_output):
    enhancement_prompt = PromptTemplate.from_template("""
        Improve the following calendar summary and task list:
        - Make tasks clearer and more actionable.
        - Do not add email subject  
        - remove ```html  word if found at the start of the email
        - Highlight urgent tasks (due today or overdue).
        - Order the tasks according to the priority from high to low
        - Add the priority status and notes to the table 
        - Color the high priority in red, medium priority in orange, and low priority in blue
        - Add friendly, professional tone.
        - Keep formatting intact.
        Input:
        {summary_output}
    """)
    enhancement_chain = LLMChain(llm=llm, prompt=enhancement_prompt)
    return enhancement_chain.run(summary_output=summary_output)

def perform_review(model, calendar_data_list, summary_output):
    today_str = datetime.today().strftime('%Y-%m-%d')
    prompt = (
        "You are a final reviewer. Compare the original calendar entries and the enhanced output. "
        "Check for these:\n"
        "- Are all meetings included in the summary?\n"
        "- Are all tasks accounted for with deadlines?\n"
        "- If no deadline is provided, assume today's date as the default.\n"
        "- Are tasks due today or overdue flagged as urgent?\n"
        "- Are tasks arranged according to priority from highest to lowest?\n"
        "- Report any missed or inaccurate info.\n"
        "\nCalendar Data:\n"
        f"{' '.join(calendar_data_list)}\n"
        "\nEnhanced Output:\n"
        f"{summary_output}\n"
        "Today's Date: {today_str}\n"
        "Return only a short diagnostic report. If everything is passed, say 'REVIEW PASSED'. if not, say 'REVIEW FAILED'"
    )
    review_chat = model.start_chat()
    return review_chat.send_message(prompt).text

def edit_based_on_review(llm, summary_output, review_comments):
    edit_prompt = PromptTemplate.from_template("""
        The following summary was reviewed and found to have issues.
        Order the tasks according to the priority from high to low.
        Keep what was there in the summary but add the missing items from the review feedback
        
        Enhanced Summary:
        {summary_output}
        
        Review Feedback:
        {review_comments}

        Return the corrected and improved version.
    """)
    edit_chain = LLMChain(llm=llm, prompt=edit_prompt)
    return edit_chain.run(enhancement_output=summary_output, review_comments=review_comments)

def format_email(llm, enhancement_output):
    email_prompt = PromptTemplate.from_template("""
    Format the following information as a well-structured, properly styled HTML email and do not include ```html word at the beginning while formatting the email: 
    <html>
    <head>
    <style>
        body {{
            font-family: Arial, sans-serif;
            font-size: 13px;
        }}
        h2 {{
            font-size: 15px;
            margin-bottom: 10px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }}
        th, td {{
            border: 1px solid black;
            padding: 10px;
            text-align: left;
        }}
        th {{
            background-color: #f2f2f2;
            font-size: 16px;
        }}
        ul {{
            padding-left: 20px;
        }}
        li {{
            margin-bottom: 20px;
        }}
    </style>
    </head>
    <body>
    {enhancement_output}  
    </body>
    </html>
    """)
    email_chain = LLMChain(llm=llm, prompt=email_prompt)
    return email_chain.run(enhancement_output=enhancement_output)

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

def process_calendar_entries(calendar_data_list):
    chat = model.start_chat()

    calendar_table = extract_calendar_table(chat, calendar_data_list)
    todo_list = extract_todo_list(chat, calendar_data_list)
    summary_output = generate_summary(llm, calendar_table, todo_list, calendar_data_list)
    review_report = perform_review(model, calendar_data_list, summary_output)

    if "REVIEW PASSED" in review_report:
        final_summary = enhance_summary(llm, summary_output)
    else:
        revised_output = edit_based_on_review(llm, summary_output, review_report)
        final_summary = enhance_summary(llm, revised_output)

    final_email = format_email(llm, final_summary)
    paragraph_summary = convert_summary_to_paragraph(llm, calendar_table, todo_list)

    print("\nParagraph Summary:\n", paragraph_summary)
    print("To-do list:\n", todo_list)
    send_email(final_email)
