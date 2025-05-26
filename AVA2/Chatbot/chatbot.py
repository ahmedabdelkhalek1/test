from headers_and_imports import *
from calendar_extraction import extract_calendar_data
import time
from concurrent.futures import ThreadPoolExecutor

def extract_calendar_table(chat, calendar_data_list):
    prompt = (
    "You are a helpful assistant extracting structured data from calendar entries.\n"
    "Extract the following information and return it as a clean, ordered list under the heading:\n"
    "Calendar Summary:\n"
    "- Meeting Title\n"
    "- Date & Time\n"
    "- Location\n"
    "- Agenda points (if any)\n\n"
    "Example:\n"
    "Calendar Summary:\n"
    "1. Sprint Planning\n"
    "   Date & Time: 2025-04-15, 09:00 - 10:30\n"
    "   Location: Zoom - Room A\n"
    "   Agenda:\n"
    "   - Review last sprint\n"
    "   - Define sprint goals\n\n"
    "2. Client Call\n"
    "   Date & Time: 2025-04-15, 10:00 - 11:00\n"
    "   Location: Google Meet\n"
    "   Agenda:\n"
    "   - Present updates\n"
    "   - Address client concerns\n\n"
    "Now extract the same from the following calendar entries:\n"
    f"Calendar Data: {' '.join(calendar_data_list)}"
    )
    return chat.send_message(prompt).text

def extract_todo_list(chat, calendar_data_list):
    prompt = (
    "You are a helpful assistant extracting actionable tasks from calendar entries.\n"
    "For each task, include:\n"
    "- Action\n"
    "- Deadline (use the meeting's date if not mentioned)\n"
    "- Source meeting title\n\n"
    "Return a collective, ordered to-do list under the heading:\n"
    "To-Dos:\n"
    "Sort by deadline (YYYY-MM-DD) ascending.\n"
    "Format exactly like this:\n\n"
    "To-Dos:\n"
    "1. Share feedback on design mockups\n"
    "   Deadline: 2025-04-15\n"
    "   Source: Design Sync\n\n"
    "2. Send summary email to client\n"
    "   Deadline: 2025-04-16\n"
    "   Source: Client Call\n\n"
    "Now extract the to-do list from the following calendar entries:\n"
    f"Calendar Data: {' '.join(calendar_data_list)}"
    )
    return chat.send_message(prompt).text

def generate_summary(llm, calendar_table, todo_list, calendar_data_list):
    if not calendar_table or not todo_list:
        raise ValueError("Missing input for summary generation.")

    summary_prompt = PromptTemplate.from_template("""
        You are a friendly and helpful assistant. Start the message with a warm greeting, followed by a creative, conversational overview of the user's day (2-3 sentences). Then, group the information under **three clearly labeled sections** using the following format:

        Example Greeting and Overview:
        "Good morning! Here's your schedule for the day, along with some tasks to keep an eye on."

        Calendar Summary:
        1. 9:00 AM - 10:30 AM - Sprint Planning - Location: Zoom - Room A
        Agenda:
        - Review last sprint
        - Define sprint goals

        2. 10:00 AM - 11:00 AM - Client Call - Location: Google Meet
        Agenda:
        - Present updates
        - Address client concerns

        To-Dos:
        1. Share feedback on design mockups (Urgent, High Priority)
        Deadline: 2025-04-15 (Today!)
        Source: Design Sync

        2. Send summary email to client (High Priority)
        Deadline: 2025-04-16
        Source: Client Call

        Notes:
        - Ensure urgent tasks (due today or overdue) are marked with (Urgent).
        - Reorder tasks by priority: High → Medium → Low.
        - Add priority status (e.g., High Priority) to the to-do list.
        - Maintain a friendly, professional tone and concise format.
        - Don't include any asterisks or markdown
        - Don't include the date for each entry in the schedule
        - Add notes to the user when needed in cases such as overlapping meetings. Suggestions should be based on priority (e.g. client meeting or deadlines).

        Input:
        {calendar_table}

        {todo_list}
    """)
    chain = LLMChain(llm=llm, prompt=summary_prompt)
    return chain.run(calendar_table=calendar_table, todo_list=todo_list)


def enhance_summary(llm, summary_output):
    if not summary_output:
        raise ValueError("Missing summary_output")

    enhancement_prompt = PromptTemplate.from_template("""
        Improve the following calendar summary and task list:

        - Ensure urgent tasks (due today or overdue) are marked with (Urgent).
        - Reorder tasks by priority: High → Medium → Low.
        - Add priority status as (High Priority), (Medium Priority), etc., to the to-do list.
        - Keep "Calendar Summary" and "To-Dos" headers and formatting intact.
        - Do not use asterisks or bold styling.
        - Ensure a friendly, professional tone.
        - Ensure times are in AM/PM format. 

        Input:
        {summary_output}
    """)
    chain = LLMChain(llm=llm, prompt=enhancement_prompt)
    return chain.run(summary_output=summary_output)


def perform_review(model, calendar_data_list, summary_output):
    today = datetime.today().strftime("%Y-%m-%d")
    prompt = (
        f"Review the enhanced summary against original calendar data.\n"
        f"Ensure all meetings and tasks are included, urgent ones flagged, priorities sorted.\n"
        f"Return 'REVIEW PASSED' or diagnostic.\n\n"
        f"Calendar Data:\n{' '.join(calendar_data_list)}\n"
        f"Enhanced Output:\n{summary_output}\n"
        f"Today's Date: {today}"
    )
    review_chat = model.start_chat()
    return review_chat.send_message(prompt).text

def edit_based_on_review(llm, summary_output, review_comments):
    prompt = PromptTemplate.from_template("""
        Correct the enhanced summary using the following review feedback.

        Enhanced Summary:
        {summary_output}

        Review Feedback:
        {review_comments}
    """)
    chain = LLMChain(llm=llm, prompt=prompt)
    return chain.run(summary_output=summary_output, review_comments=review_comments)

def process_calendar_entries(calendar_data_list):
    start_time = time.time()
    chat = model.start_chat()

    # Use threading for parallel LLM calls
    with ThreadPoolExecutor() as executor:
        future_table = executor.submit(extract_calendar_table, chat, calendar_data_list)
        future_todo = executor.submit(extract_todo_list, chat, calendar_data_list)
        calendar_table = future_table.result()
        todo_list = future_todo.result()

    print(f"[Performance] Table & To-Do extraction: {time.time() - start_time:.2f}s")

    summary_output = generate_summary(llm, calendar_table, todo_list, calendar_data_list)

    review_report = perform_review(model, calendar_data_list, summary_output)
    print("[Review Result]", review_report)

    if "REVIEW PASSED" in review_report:
        final_summary = enhance_summary(llm, summary_output)
    else:
        revised = edit_based_on_review(llm, summary_output, review_report)
        final_summary = enhance_summary(llm, revised)

    print(f"[Total Time] Summary generation done in {time.time() - start_time:.2f}s")
    return final_summary

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
    - Give suggestions to organize the day based on priorities (sentimental such as client meetings and deadlines).
    """

    chat = model.start_chat()
    return chat.send_message(prompt).text.strip()
