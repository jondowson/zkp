# Use an official Node.js image as the base
FROM node:20

# Install dependencies
RUN apt-get update && \
    apt-get install -y git build-essential curl && \
    apt-get clean

# Install Rust and Cargo
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Circom
RUN git clone https://github.com/iden3/circom.git && \
    cd circom && \
    cargo build --release && \
    cargo install --path circom

# Install SnarkJS
RUN npm install -g snarkjs

# Set the working directory
WORKDIR /app

# Copy the entrypoint script into the container
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["entrypoint.sh"]
