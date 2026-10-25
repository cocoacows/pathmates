FROM eclipse-temurin:21-jdk
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY server/src ./src
COPY server/websiteFiles ./websiteFiles
RUN mkdir -p build/classes && javac -d build/classes $(find src -name '*.java')
EXPOSE 8080
CMD ["java", "-cp", "build/classes", "WebServer"]
