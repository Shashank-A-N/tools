FROM python:3.9-slim

# Set up a new user named "user" with user ID 1000
RUN useradd -m -u 1000 user

# Set working directory to the user's home directory
WORKDIR /home/user/app

# Copy the current directory contents into the container at /home/user/app
COPY --chown=user . /home/user/app

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Switch to the "user" user
USER user

# Expose port 7860 for Hugging Face Spaces
EXPOSE 7860

# Run the FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
