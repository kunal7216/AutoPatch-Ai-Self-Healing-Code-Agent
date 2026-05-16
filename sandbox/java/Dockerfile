FROM maven:3.9-eclipse-temurin-17-alpine

RUN adduser -D -u 1000 sandbox
WORKDIR /workspace
RUN chown sandbox:sandbox /workspace

USER sandbox

CMD ["mvn", "test", "-q"]
