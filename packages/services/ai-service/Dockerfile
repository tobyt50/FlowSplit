# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# --- UPDATED COPY COMMAND ---
# Since context is now the repo root, we must specify the full path to requirements.txt
COPY packages/services/ai-service/requirements.txt ./

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# --- UPDATED COPY COMMAND ---
# Copy the source code from the specific service directory
COPY packages/services/ai-service/ .

# Expose the port the app runs on
EXPOSE 3107

# Run uvicorn server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3107"]