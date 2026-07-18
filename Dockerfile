FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy the entire src directory (backend & frontend)
COPY src/ /app/src/

# Expose the port the REST API and Web Portal run on
EXPOSE 8000

# Run the backend server
CMD ["python", "src/backend/ksp_ai_backend_server.py"]
