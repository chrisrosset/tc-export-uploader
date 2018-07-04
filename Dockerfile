FROM kinlan/puppets:latest

COPY ./package.json /app/
WORKDIR app
RUN npm i
RUN apt-get update && apt-get -y install cron

COPY . /app/
RUN mv /app/tc-schedule /etc/cron.d

# Add user so we don't need --no-sandbox.
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser .

EXPOSE 8084
ENTRYPOINT ["dumb-init", "--"]
CMD ["cron", "-f"]