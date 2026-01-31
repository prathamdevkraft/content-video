FROM python:3.9-slim

WORKDIR /app

RUN pip install streamlit supabase requests

COPY . .

CMD ["streamlit", "run", "dashboard.py", "--server.port=8501", "--server.address=0.0.0.0"]
