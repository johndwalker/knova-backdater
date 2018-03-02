# Docker image to be used for building a container ready with 
# Oracle instant client binaries and all necessary environment 
# variables needed to use the primary Node.js Oracle Database driver library
FROM node:8-wheezy

# ORACLE PATH LIBS & CONF VARS
ENV LD_LIBRARY_PATH="/opt/oracle/instantclient" \
    OCI_HOME="/opt/oracle/instantclient" \
    OCI_LIB_DIR="/opt/oracle/instantclient" \
    OCI_INCLUDE_DIR="/opt/oracle/instantclient/sdk/include"

# Oracle Instant Client
COPY ./oracle/linux/ .

RUN apt-get update
RUN BUILD_PACKAGES="build-essential unzip curl libaio1 python-minimal git" && \
    apt-get install -y $BUILD_PACKAGES && \
    mkdir -p opt/oracle && \
    unzip instantclient-basic-linux.x64-12.1.0.2.0.zip -d /opt/oracle && \
    unzip instantclient-sdk-linux.x64-12.1.0.2.0.zip -d /opt/oracle && \
    mv /opt/oracle/instantclient_12_1 /opt/oracle/instantclient && \
    ln -s /opt/oracle/instantclient/libclntsh.so.12.1 /opt/oracle/instantclient/libclntsh.so && \
    ln -s /opt/oracle/instantclient/libocci.so.12.1 /opt/oracle/instantclient/libocci.so && \
    echo '/opt/oracle/instantclient/' | tee -a /etc/ld.so.conf.d/oracle_instant_client.conf && ldconfig && \
    rm -rf instantclient-basic-linux.x64-12.1.0.2.0.zip instantclient-sdk-linux.x64-12.1.0.2.0.zip && \
    AUTO_ADDED_PACKAGES=`apt-mark showauto` && \
    # apt-get remove --purge -y $AUTO_ADDED_PACKAGES && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Add files to local image
ADD src ./src

# CMD [ "node", "./src/lib/pgcd.js", "-h" ]