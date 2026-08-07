FROM python:3.12-slim

WORKDIR /app

# Silence pip's root-user and update-available notices: this is a single-
# purpose container image, not a host machine, so neither warning applies.
ENV PIP_ROOT_USER_ACTION=ignore \
    PIP_DISABLE_PIP_VERSION_CHECK=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
