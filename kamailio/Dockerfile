FROM kamailio/kamailio:5.8.3-bookworm

USER root

# Install necessary modules for MySQL, TLS, WebSockets, and diagnostic tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    kamailio-mysql-modules \
    kamailio-tls-modules \
    kamailio-websocket-modules \
    kamailio-extra-modules \
    mariadb-client \
    procps \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Default working directory
WORKDIR /etc/kamailio

# Expose standard SIP, WS, and WSS ports
EXPOSE 5060/udp 5060/tcp 4443/tcp 8080/tcp

CMD ["kamailio", "-DD", "-E"]
